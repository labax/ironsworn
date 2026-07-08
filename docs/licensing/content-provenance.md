# Content provenance manifest

The content provenance manifest is the release review inventory for bundled app content. It tracks where each content record came from, which license applies, whether attribution or a notice is required, what kind of content it is, and whether it is eligible for release.

The initial manifest is `content/manifest.json`. It intentionally contains only project-original placeholder records and no official Ironsworn game text, oracle rows, move text, asset text, art, icons, screenshots, copied layout, or trade dress.

## Required entry fields

Every bundled content entry must include:

- `id`: stable identifier for future content files to reference.
- `title`: human-readable inventory title.
- `category`: content source category.
- `contentType`: the kind of content being inventoried.
- `source` and `sourceUrl`: source label and optional source URL.
- `license` and `licenseUrl`: license label and optional license URL.
- `attributionRequired`, `attributionText`, and `noticeRef`: attribution and notice tracking.
- `releaseStatus`: release eligibility.
- `reviewStatus`: review state.
- `notes`: reviewer notes and safety context.

## Content categories

| Category        | Use                                                                               | Default release handling                                                                   |
| --------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `official`      | Metadata for official source material when explicitly approved for tracking.      | Review required; do not add copied official content in this setup issue.                   |
| `SRD-derived`   | Material derived from an approved SRD or compatible license after review.         | Review required until source, license, and attribution are documented.                     |
| `original`      | Project-authored helper text, labels, examples, or test fixtures.                 | May be allowed after review confirms it is original.                                       |
| `custom`        | Project-created game-adjacent content that is not copied from a protected source. | Review required before public release.                                                     |
| `user-authored` | User-created content examples or future user data.                                | Separate from bundled app content; do not treat as bundled release content without review. |
| `third-party`   | Non-official content from another creator or package.                             | Review required; attribution and license must be documented.                               |
| `unknown`       | Unidentified, unreviewed, or incomplete provenance.                               | Must not be release-allowed.                                                               |

## Release statuses

- `allowed`: reviewed and eligible to ship in the current release context.
- `review-required`: not release-ready until content and licensing review is complete.
- `blocked`: not publishable in the current project context.

Unknown or unreviewed content must not be treated as release-ready. A `blocked` entry is not publishable and should not be marked as reviewed/allowed.

## Review statuses

- `unreviewed`: provenance or safety review has not happened.
- `reviewed`: reviewed for the current release context.
- `needs-legal-review`: requires qualified legal or licensing review before release.
- `rejected`: reviewed and rejected for use.

## Blocked content for public MVP

Unless explicit permission or a compatible license is documented and reviewed, the following are blocked for public MVP:

- Official art, icons, copied layout, screenshots, and trade dress.
- Unapproved full rulebook prose, setting excerpts, examples of play, move text, oracle table rows, and asset text.
- Third-party content without documented source, license, attribution, and release status.

App helper text should be project-original wherever possible. Keep app helper text entries separate from game data entries by using `contentType` values such as `app-helper-text` or `ui-label` rather than `move-text`, `oracle-table`, or `asset-text`.

## Adding a safe content entry

1. Create or identify the content file without copying blocked material.
2. Add a stable manifest `id` using lowercase kebab-case.
3. Set `category`, `contentType`, source, license, attribution, release status, and review status.
4. Use `releaseStatus: "review-required"` for any content that is not clearly reviewed and approved.
5. Use `category: "unknown"` only to flag incomplete provenance; never combine it with `releaseStatus: "allowed"`.
6. Reference the manifest `id` from future oracle, move, rules, helper-text, or fixture content files so reviewers can trace each content record back to provenance metadata.
7. Run `npm run validate:content` before opening a pull request.
