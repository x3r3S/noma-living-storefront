import { auditCatalog, buildRedirectMap, cartSummary, filterProducts, updateCart } from "./domain.mjs";

const rawProducts = [
  { sku: "ALB-01", name: "Alba Woven Pendant", category: "Lighting", price: "129.00", slug: "Alba Woven Pendant", image: "alba-pendant.jpg" },
  { sku: "LIN-02", name: "Linde Console Table", category: "Furniture", price: 189, slug: "linde-console-table", image: "linde-console.jpg" },
  { sku: "KIN-03", name: "Kinu Stoneware Set", category: "Dining", price: 84, slug: "kinu-stoneware-set", image: "kinu-tableware.jpg" },
  { sku: "MAR-04", name: "Mara Knit Throw", category: "Textiles", price: 92, slug: "mara-knit-throw", image: "mara-knit.jpg" }
];
const audit = auditCatalog(rawProducts);
const redirects = buildRedirectMap(rawProducts.map((item) => ({ from: `/shop/${String(item.sku).toLowerCase()}`, sku: item.sku })), audit.products);
let cart = {};
let cartReturnFocus = null;
const productsNode = document.querySelector("#products");
const categoryNode = document.querySelector("#category");
const searchNode = document.querySelector("#search");
function esc(value) { return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function euro(value) { return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value); }

for (const category of [...new Set(audit.products.map((item) => item.category))]) categoryNode.insertAdjacentHTML("beforeend", `<option value="${esc(category)}">${esc(category)}</option>`);

function renderProducts() {
  const items = filterProducts(audit.products, { query: searchNode.value, category: categoryNode.value });
  document.querySelector("#result-count").textContent = `${items.length} ${items.length === 1 ? "product" : "products"}`;
  productsNode.innerHTML = items.length ? items.map((item) => `<article class="product"><div class="product-art art-${esc(item.category.toLowerCase())}"><img src="assets/${esc(item.image)}" alt="${esc(item.name)} in a styled interior" loading="lazy"></div><div class="product-info"><div class="product-kicker"><small>${esc(item.category)} · ${esc(item.sku)}</small><span class="stock">In stock</span></div><h3>${esc(item.name)}</h3><div class="product-row"><b>${euro(item.price)}</b><button data-add="${esc(item.id)}" aria-label="Add ${esc(item.name)} to bag">Add to bag</button></div></div></article>`).join("") : '<div class="empty">Nothing here yet. Try another search or category.</div>';
}

function renderReport() {
  document.querySelector("#report-grid").innerHTML = [
    [`0${audit.summary.ready}`, "Products ready", `${audit.summary.errors} blocked catalog rows`],
    [`0${redirects.filter((item) => item.valid).length}`, "Old links checked", "Safe local redirects only"],
    [`0${audit.summary.warnings}`, "Open warnings", "Reviewed before release"],
    ["None", "External writes", "Preview checkout remains closed"]
  ].map(([value, label, detail]) => `<div class="check"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`).join("");
}

function renderCart() {
  const summary = cartSummary(cart, audit.products);
  document.querySelector("#cart-count").textContent = summary.items;
  document.querySelector("#cart-total").textContent = euro(summary.total);
  const byId = new Map(audit.products.map((item) => [item.id, item]));
  document.querySelector("#cart-lines").innerHTML = summary.items ? Object.entries(cart).map(([id, quantity]) => { const item = byId.get(id); return `<div class="cart-line"><img src="assets/${esc(item.image)}" alt=""><div><b>${esc(item.name)}</b><small>${quantity} × ${euro(item.price)}</small></div><button data-remove="${esc(id)}" aria-label="Remove one ${esc(item.name)}">−</button></div>`; }).join("") : '<div class="empty">Your bag is waiting for something considered.</div>';
}

function toggleCart(open, trigger = null) { const cartNode = document.querySelector("#cart"); if (open) cartReturnFocus = trigger || document.activeElement; cartNode.hidden = !open; document.querySelector("#veil").hidden = !open; document.body.classList.toggle("cart-open", open); if (open) document.querySelector("#cart-close").focus(); else if (cartReturnFocus instanceof HTMLElement) cartReturnFocus.focus(); }
productsNode.addEventListener("click", (event) => { const trigger = event.target.closest("[data-add]"); const id = trigger?.dataset.add; const product = audit.products.find((item) => item.id === id); if (!product) return; cart = updateCart(cart, product, 1); renderCart(); toggleCart(true, trigger); });
document.querySelector("#cart-lines").addEventListener("click", (event) => { const id = event.target.closest("[data-remove]")?.dataset.remove; const product = audit.products.find((item) => item.id === id); if (!product) return; cart = updateCart(cart, product, -1); renderCart(); });
document.querySelector("#cart-button").addEventListener("click", (event) => toggleCart(true, event.currentTarget));
document.querySelector("#cart-close").addEventListener("click", () => toggleCart(false));
document.querySelector("#veil").addEventListener("click", () => toggleCart(false));
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !document.querySelector("#cart").hidden) toggleCart(false); });
document.querySelectorAll("[data-category]").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); categoryNode.value = link.dataset.category; renderProducts(); document.querySelector("#collection").scrollIntoView({ behavior: "smooth", block: "start" }); }));
searchNode.addEventListener("input", renderProducts);
categoryNode.addEventListener("change", renderProducts);
renderProducts(); renderReport(); renderCart();
