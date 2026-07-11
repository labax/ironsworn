# Content directory

This directory contains the content provenance manifest and future reviewed content packages for the Ironsworn Digital Companion.

- `manifest.json` is the reviewable inventory of bundled content sources, licenses, attribution requirements, and release status.
- `manifest.schema.json` documents the expected manifest structure for validation tooling.
- Future oracle, move, rules-summary, helper-text, or fixture files must reference a manifest entry by `id` before release.

Do not add official Ironsworn rulebook prose, official move text, official oracle rows, official asset text, official art, icons, copied layout, screenshots, or trade dress unless an explicit permission or license has been documented and reviewed.

## Provenance validation rules

Run the canonical local and CI validator before release:

```sh
npm run validate:content
```

The validator is deterministic and release-blocking for errors. It first parses `content/manifest.json` and verifies the documented schema/rule enums in `content/manifest.schema.json` have not drifted from the centralized validator rules. It then checks every bundled-content record for required metadata, stable unique kebab-case `id`, allowed category/content/release/review states, source and license fields, attribution or notice references when required, and internally consistent release flags.

Blocking diagnostics include missing required fields, unknown enum values, duplicate IDs, invalid IDs, missing referenced files, orphan bundled JSON files under `content/`, unresolved manifest references, unresolved public `manifestId` / `contentManifestId` / `provenanceId` references, public references to non-release-eligible records, blocked records, unreviewed release-eligible records, and missing required attribution. `review-required` records are warnings unless public bundled content references them.

Public bundled references are resolved only from JSON files under `public/`; user-authored runtime data such as browser saves, journal text, custom oracle tables, and local campaign data is not scanned or copied into diagnostics. Diagnostics intentionally print file paths, record IDs, diagnostic codes, and remediation text only; they do not print content bodies and are not legal advice, copyright-similarity detection, or approval to ship content.

Manifest entries may include optional `files` paths relative to `content/manifest.json` and optional `references` to other manifest IDs. Any JSON content file under `content/` other than the manifest and schema is considered bundled content and must be listed by a manifest entry unless it is moved outside the bundled content tree.
