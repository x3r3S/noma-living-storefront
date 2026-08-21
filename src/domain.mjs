function clean(value, limit = 200) { return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, limit); }
export function safeSlug(value) { return clean(value, 180).toLowerCase().normalize("NFKD").replace(/\p{M}+/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "item"; }

export function auditCatalog(rawItems = []) {
  if (!Array.isArray(rawItems)) throw new TypeError("Catalog must be an array");
  const seenSkus = new Set();
  const seenSlugs = new Set();
  const findings = [];
  const products = rawItems.slice(0, 1000).map((raw, index) => {
    const sku = clean(raw?.sku, 80).toUpperCase();
    const name = clean(raw?.name, 180) || `Untitled product ${index + 1}`;
    let slug = safeSlug(raw?.slug || name);
    const amount = Number(raw?.price);
    const duplicateSku = Boolean(sku && seenSkus.has(sku));
    if (!sku) findings.push({ severity: "error", code: "missing_sku", index, detail: name });
    else if (duplicateSku) findings.push({ severity: "error", code: "duplicate_sku", index, detail: sku });
    if (seenSlugs.has(slug)) { findings.push({ severity: "warning", code: "duplicate_slug", index, detail: slug }); slug = `${slug}-${index + 1}`; }
    if (!Number.isFinite(amount) || amount <= 0) findings.push({ severity: "error", code: "invalid_price", index, detail: name });
    if (!clean(raw?.image, 120)) findings.push({ severity: "warning", code: "missing_image", index, detail: name });
    seenSkus.add(sku); seenSlugs.add(slug);
    return Object.freeze({ id: sku && !duplicateSku ? sku : `ROW-${index + 1}`, sku, name, slug, category: clean(raw?.category, 80) || "Other", price: Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : 0, image: clean(raw?.image, 120), available: Boolean(sku && !duplicateSku && Number.isFinite(amount) && amount > 0) });
  });
  const errors = findings.filter((item) => item.severity === "error").length;
  const warnings = findings.filter((item) => item.severity === "warning").length;
  return Object.freeze({ products, findings, summary: Object.freeze({ products: products.length, ready: products.filter((item) => item.available).length, errors, warnings }), externalWrites: false });
}

export function buildRedirectMap(legacyPaths = [], products = []) {
  const targetBySku = new Map();
  const ambiguousSkus = new Set();
  for (const item of products.slice(0, 1000)) {
    const sku = clean(item?.sku, 80).toUpperCase();
    const slug = clean(item?.slug, 90);
    if (!item?.available || !sku || !slug || ambiguousSkus.has(sku)) continue;
    if (targetBySku.has(sku)) {
      targetBySku.delete(sku);
      ambiguousSkus.add(sku);
      continue;
    }
    targetBySku.set(sku, `/products/${slug}`);
  }
  const usedFrom = new Set();
  return legacyPaths.slice(0, 2000).map((entry) => {
    const from = clean(entry?.from, 300);
    const sku = clean(entry?.sku, 80).toUpperCase();
    const validFrom = from.startsWith("/") && !from.startsWith("//") && !from.includes("\\") && !from.includes("..") && !/[?#]/.test(from);
    const to = targetBySku.get(sku) || "";
    const valid = validFrom && Boolean(to) && !usedFrom.has(from);
    if (valid) usedFrom.add(from);
    return Object.freeze({ from, to, sku, status: valid ? 301 : 0, valid });
  });
}

export function filterProducts(products = [], { query = "", category = "all" } = {}) {
  const needle = clean(query, 120).toLowerCase();
  return products.filter((item) => item.available && (category === "all" || item.category === category) && (!needle || `${item.name} ${item.sku} ${item.category}`.toLowerCase().includes(needle)));
}

export function updateCart(cart = {}, product, quantityDelta = 1) {
  if (!product?.available) throw new Error("Unavailable product cannot be added");
  const next = { ...cart };
  const quantity = Math.max(0, Math.min(99, Number(next[product.id] || 0) + Number(quantityDelta || 0)));
  if (quantity) next[product.id] = quantity; else delete next[product.id];
  return Object.freeze(next);
}

export function cartSummary(cart = {}, products = []) {
  const byId = new Map(products.map((item) => [item.id, item]));
  return Object.entries(cart).reduce((result, [id, quantity]) => { const product = byId.get(id); if (!product) return result; return { items: result.items + quantity, total: Math.round((result.total + product.price * quantity) * 100) / 100 }; }, { items: 0, total: 0 });
}
