# Noma Living

Noma Living is a small, photo-led storefront built around a catalog migration problem: messy source rows should not reach a new shop with duplicate identifiers, invalid prices or unsafe legacy links.

![Noma Living desktop storefront](screenshots/web-rescue-commerce-wide.png)

## The problem

A visual redesign is only useful if the underlying catalog is safe to publish. The storefront therefore needed two things at once:

- a calm, editorial shopping experience that works on desktop and mobile;
- a deterministic release gate for product data and redirects.

## The workflow

The catalog module cleans names and identifiers, normalizes slugs and prices, blocks duplicate SKUs, reports duplicate slugs and missing images, and builds redirects only for safe local paths. The browser layer uses the approved rows for search, category filtering and a checkout-free bag.

The interface is deliberately unlike an admin dashboard. The first desktop view presents all four products as an asymmetric retail edit; the mobile layout starts with the brand story and a single lead photograph before the catalog.

## Evidence

- 6 deterministic domain tests;
- syntax checks for both JavaScript modules;
- four catalog rows and four validated local redirects;
- working search, category, empty-result and bag states;
- responsive captures at 1600×900 and 390×844;
- no framework, runtime dependency, analytics, payment integration or external write;
- no runtime network request for fonts or images.

![Noma Living mobile storefront](screenshots/web-rescue-commerce-mobile.png)

## Run locally

The storefront is static, but ES modules should be served over HTTP rather than opened directly from the filesystem. The included dependency-free server listens only on your local machine.

```bash
npm run demo
```

Then open `http://127.0.0.1:4173/`.

## Test

Node.js 24 LTS is used in CI.

```bash
npm test
npm run check
```

There is no install step because the project has no package dependencies.

## Project boundary

This is a self-initiated portfolio project. Noma Living, the products, SKUs, prices, catalog and contact address are fictional. It was not commissioned work, paid client work or a real retailer launch.

The four bundled product photographs are real stock photographs used under the Unsplash License. Their creators, source pages, license and retrieval date are listed in [ASSET-LICENSES.md](ASSET-LICENSES.md). The photographers did not create work for Noma Living and do not endorse this fictional brand.

The original interface and code are published for portfolio review under [PORTFOLIO-REVIEW-LICENSE.md](PORTFOLIO-REVIEW-LICENSE.md). That notice does not replace or restrict the separate licenses for third-party photographs.
