# Ironsworn Digital Companion

Ironsworn Digital Companion is a planned web application for managing solo and co-op Ironsworn play at the table. The repository is currently in foundation/setup mode: it contains project structure, documentation placeholders, licensing notices, and Angular-ready directories before gameplay implementation begins.

## Project purpose

The companion will help players organize campaign state and approved game data without bundling unreviewed licensed material. The app code and any game/content data are tracked separately so contributors can review licensing and attribution before content is added.

## MVP scope

The initial MVP is expected to focus on:

- Campaign and character record-keeping.
- Vow, progress, asset, and journal tracking.
- Approved move/oracle data stored as structured content once licensing review is complete.
- Local-first usage suitable for early playtesting.
- A web UI implemented in an Angular-ready source structure.

Gameplay rules automation, official art, exact rulebook prose, icons, layout, trade dress, account sync, and publishing workflows are outside the current setup scope unless later approved and documented.

## Development status

This repository does not contain application code yet. The current milestone establishes:

- Top-level folders for application source, tests, docs, content, and GitHub configuration.
- Source-code licensing under the MIT License.
- Separate content licensing placeholders and notices.
- Documentation areas for requirements, architecture, decisions, testing, release notes, and product planning.

## Repository layout

```text
.github/                 GitHub issue templates and workflow placeholders
content/                 Approved game data, original content, examples, and manifests
docs/                    Requirements, architecture, decisions, licensing, release, testing, and product notes
src/                     Angular workspace/source placeholder
tests/                   Test placeholder for cross-cutting or future e2e/integration tests
README.md                Project overview and contributor orientation
LICENSE                  Source code license
NOTICE                   Attribution and third-party notices placeholder
```

## Content and licensing

Application source code is licensed under the license in [`LICENSE`](LICENSE). Content is handled separately; see [`content/LICENSE.md`](content/LICENSE.md) and [`docs/licensing/README.md`](docs/licensing/README.md) before adding any game data, examples, artwork, icons, or text derived from third-party sources.

Do not add unapproved Ironsworn rulebook prose, official art, icons, layout, trade dress, or other third-party content to this repository.

## Getting started for contributors

1. Read this README and the documentation index in [`docs/README.md`](docs/README.md).
2. Review licensing guidance before adding content.
3. Keep source code in `src/` once the Angular workspace is initialized.
4. Keep Angular unit tests alongside source files or in the Angular workspace convention; use `tests/` for repository-level, integration, or e2e test placeholders until the workspace is generated.
