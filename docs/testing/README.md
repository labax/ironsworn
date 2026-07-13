# Testing and CI

GitHub Actions runs the project CI workflow for every pull request and every push to `main`. The workflow is defined in `.github/workflows/ci.yml` and uses Node.js 24.x with npm, matching the Angular-supported Node range documented in the repository setup notes.

## Local CI reproduction

Run the same commands locally from a clean checkout before opening a pull request:

```bash
npm ci
npm run build
npm run test:ci
npm run lint
npm run format:check
npm run validate:content-json
npm run validate:content
```

These commands intentionally fail when installs, Angular production builds, unit tests, scaffold lint/static checks, formatting, or content JSON metadata validation, or content provenance validation fail.

## CI jobs

- `install-and-build`: installs dependencies from `package-lock.json` with `npm ci`, then runs the Angular production build with `npm run build`.
- `unit-tests`: installs dependencies from the lockfile and runs unit tests once in CI mode with `npm run test:ci`.
- `lint-and-format`: runs the configured scaffold lint/static-check script with `npm run lint`, then verifies formatting with `npm run format:check`.
- `validate-content-json`: parses JSON data files under `content/**/*.json` and `public/**/*.json` with `npm run validate:content-json` while excluding dependency and build output directories.

## Character sheet acceptance

Epic #1 / issue #63 character-sheet acceptance is documented in [`epic-1-character-sheet-acceptance.md`](./epic-1-character-sheet-acceptance.md). Use it for the final CS-01 through CS-11 manual pass, coverage mapping, responsive/accessibility checks, and licensing-safety review.

## Deferred checks

- A dedicated Angular ESLint configuration is not configured yet. Until it is added, `npm run lint` remains the scaffold static-check gate and runs the Angular development build.
- End-to-end and smoke tests are deferred until the app shell and test runner requirements are defined.
- CodeQL, dependency review, and extended content provenance fixture coverage runs through `npm run test:provenance`.

## Oracle content licensing review

Oracle release testing must include the [Oracle content licensing review checklist](../licensing/oracle-content-licensing-review.md), which maps resolver, browser, result display, context, history, journal handoff, search, custom-table, responsive, and content-gating evidence to pass/fail/blocker decisions.
