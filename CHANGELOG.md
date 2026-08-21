# Changelog

## 2026-08-21

- Prevented blocked duplicate catalog rows from replacing an approved SKU's legacy redirect target, and made ambiguous approved targets fail closed.
- Replaced the bag's checkout-dependent delivery sentence with copy that matches the demo's no-checkout boundary, with wide and mobile browser regressions.
- Added a visible `Personal Demonstration Project` boundary stating that product records are fictional and checkout is unavailable.
- Added a keyboard-visible skip link that moves focus to the main content.
- Increased the footer Source and CI evidence-link targets to at least 44×44 CSS pixels.
- Added locked Playwright 1.62.1 regression coverage with pinned Chromium at 1440×900 and 390×844 for disclosure, navigation, exact evidence links, focus visibility, target size and horizontal overflow.
- Added reproducible screenshot and public-manifest maintenance commands.
