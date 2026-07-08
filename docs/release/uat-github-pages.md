# UAT GitHub Pages deployment

The UAT environment is a public, static GitHub Pages build for closed playtest review, QA, and early solo-player validation of the Angular frontend. It does not deploy a backend, server-side storage, authentication, or production hosting.

## Triggering a deployment

UAT deploys when either of these events occurs:

- a push to the `uat` branch; or
- a manual run of the **Deploy UAT to GitHub Pages** workflow from GitHub Actions.

The workflow installs dependencies with `npm ci`, runs `npm run test:ci`, builds with `npm run build:uat`, creates a `404.html` SPA fallback from `index.html`, uploads `dist/ironsworn/browser`, and deploys it through GitHub Pages.

## GitHub Pages settings

Repository Pages should use **GitHub Actions** as the Pages source. The workflow targets the `github-pages` Environment so repository maintainers can add optional manual approval in repository settings if supported by the plan.

The Angular UAT build uses `/ironsworn/` as its repository Pages base path. The expected UAT URL is:

```text
https://labax.github.io/ironsworn/
```

If the repository owner configures a custom UAT domain later, update this document and the Angular UAT `baseHref` / deploy URL configuration in `angular.json` together.

## Public access and data safety

GitHub Pages is public unless the repository uses a GitHub Enterprise feature that supports private Pages. Treat this UAT environment as public even when sharing it with a closed playtest group.

Use test data only. Do not enter real campaign secrets, private notes, credentials, API keys, tokens, or other sensitive data. Frontend environment files and Pages artifacts must contain public-safe configuration only.

## Content and licensing guardrails

This setup must not introduce unapproved official Ironsworn prose, oracle text, move text, art, icons, page layout, trade dress, or other protected material. Keep UAT content limited to reviewed test-only data and original application text.

## Verify after deployment

1. Open the workflow run and confirm install, test, build, artifact upload, and deploy steps passed.
2. Open the Pages URL from the deployment summary.
3. Confirm the app loads under `/ironsworn/` without broken asset URLs.
4. Confirm the visible UAT banner says the build is for test data only.
5. Confirm direct navigation or refresh on a routed URL falls back to the Angular app.
6. Confirm `https://labax.github.io/ironsworn/robots.txt` disallows crawling.
7. Share the UAT URL only with testers who understand it is public and for test data only.
