# Ironsworn Digital Companion

[![CI](https://github.com/labax/ironsworn/actions/workflows/ci.yml/badge.svg)](https://github.com/labax/ironsworn/actions/workflows/ci.yml)

Ironsworn Digital Companion is a planned web application for managing solo and co-op Ironsworn play at the table. The repository now contains the Angular frontend scaffold for the companion, plus project documentation, licensing notices, and content placeholders.

## Project purpose

The companion will help players organize campaign state and approved game data without bundling unreviewed licensed material. The app code and any game/content data are tracked separately so contributors can review licensing and attribution before content is added.

## MVP scope

The initial MVP is expected to focus on:

- Campaign and character record-keeping.
- Vow, progress, asset, and journal tracking.
- Approved move/oracle data stored as structured content once licensing review is complete.
- Local-first usage suitable for early playtesting.
- A web UI implemented with Angular standalone components, routing, strict TypeScript checks, and modern Angular patterns such as signals.

Gameplay rules automation, official art, exact rulebook prose, icons, layout, trade dress, account sync, and publishing workflows are outside the current setup scope unless later approved and documented.

## Development status

This milestone establishes:

- Angular application scaffolded with standalone architecture and routing.
- Strict TypeScript and Angular template checking.
- npm as the package manager, with `package-lock.json` committed for reproducible installs.
- Application layer folders for core services, shared UI, domain-facing services, features, and the app shell.
- Minimal home route, environment configuration, editor configuration, and development scripts ready for CI integration.

## Repository layout

```text
.github/                 GitHub issue templates and workflow placeholders
content/                 Approved game data, original content, examples, and manifests
docs/                    Requirements, architecture, decisions, licensing, release, testing, and product notes
public/                  Static web assets served by Angular
src/app/core/            Application-wide singleton services and providers
src/app/domain/          Domain-facing services and models for gameplay concepts
src/app/features/        Routed feature areas, starting with the home placeholder
src/app/shared/          Reusable presentational UI, directives, and pipes
src/app/shell/           Application frame and router outlet
src/environments/        Development and production environment configuration
tests/                   Repository-level, integration, or e2e test placeholders
README.md                Project overview and contributor orientation
LICENSE                  Source code license
NOTICE                   Attribution and third-party notices placeholder
```

## Developer setup

### Requirements

- Node.js `^20.19.0 || ^22.12.0 || >=24.0.0` (Angular 22 supported range).
- npm `11.4.2` or newer compatible npm 11 release.
- Internet access for the first dependency install.

This repository uses npm as its package manager. Use `npm ci` for clean checkout installs and CI jobs so the committed `package-lock.json` is respected.

### Install dependencies

```bash
npm ci
```

### Project scripts

| Command                | Purpose                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| `npm start`            | Start the Angular development server.                                          |
| `npm run build`        | Build the production application into `dist/`.                                 |
| `npm run build:uat`    | Build the public GitHub Pages UAT artifact with `/ironsworn/` base path.       |
| `npm test`             | Run Angular unit tests with the configured test builder.                       |
| `npm run lint`         | Run a strict development build as the initial scaffold lint/static-check gate. |
| `npm run format`       | Format repository files with Prettier.                                         |
| `npm run format:check` | Check formatting without writing files.                                        |

### Run locally

```bash
npm start
```

The development server defaults to `http://localhost:4200/`.

### Build for production

```bash
npm run build
```

Production builds use `src/environments/environment.prod.ts` and emit optimized files under `dist/ironsworn/`. UAT builds use `src/environments/environment.uat.ts`, emit the GitHub Pages artifact under `dist/ironsworn/browser/`, and copy `index.html` to `404.html` for SPA fallback routing. See [`docs/release/uat-github-pages.md`](docs/release/uat-github-pages.md) and [`docs/testing/uat-smoke-test.md`](docs/testing/uat-smoke-test.md) before deploying or sharing UAT.

## Content and licensing

Application source code is licensed under the license in [`LICENSE`](LICENSE). Content is handled separately; see [`content/LICENSE.md`](content/LICENSE.md) and [`docs/licensing/README.md`](docs/licensing/README.md) before adding any game data, examples, artwork, icons, or text derived from third-party sources.

Do not add unapproved Ironsworn rulebook prose, official art, icons, layout, trade dress, or other third-party content to this repository.

## Getting started for contributors

1. Read this README and the documentation index in [`docs/README.md`](docs/README.md).
2. Install dependencies with `npm ci`.
3. Start the app with `npm start` or build it with `npm run build`.
4. Review licensing guidance before adding content.
5. Keep Angular unit tests alongside source files or in the Angular workspace convention; use `tests/` for repository-level, integration, or e2e test placeholders.
