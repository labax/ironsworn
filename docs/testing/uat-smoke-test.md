# UAT smoke-test checklist

Run this checklist after each GitHub Pages UAT deployment.

- [ ] App loads at `https://labax.github.io/ironsworn/`.
- [ ] Browser console has no unexpected runtime errors during initial load.
- [ ] Header, home screen, and routed navigation render correctly.
- [ ] Refreshing a client-side route returns to the Angular app through the `404.html` fallback.
- [ ] UAT/test-build indicator is visible and says to use test data only.
- [ ] About, disclaimer, or equivalent licensing visibility remains present when that route exists.
- [ ] Local persistence behavior, when available, stores only test data and survives a refresh.
- [ ] `robots.txt` is available and discourages indexing with `Disallow: /`.
- [ ] No secrets, private URLs, credentials, official prose, oracle text, art, icons, layout, or trade dress are present in the deployed artifact.
