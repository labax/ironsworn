# Local persistence spike

## Decision

For the MVP spike, use `localStorage` behind an asynchronous Angular persistence abstraction. Feature code should depend on `PersistenceAdapter` rather than calling browser storage APIs directly. This keeps the first implementation small while leaving room to replace the adapter with IndexedDB when campaign, journal, or roll-history data grows.

## Options evaluated

### localStorage

Pros:

- Built into browsers and simple to exercise in Angular unit tests.
- Sufficient for a small MVP campaign object containing character, vows, tracks, journal, and roll-history records.
- Works well for an initial local-first spike when saves are whole-document JSON and data volume is limited.

Cons and limitations:

- Synchronous API can block the main thread if payloads become large.
- String-only storage requires JSON serialization and careful malformed-data handling.
- Browser quotas are limited and vary by browser, mode, and user settings.
- Not appropriate for large journal histories, binary attachments, or high-frequency write workloads.

### IndexedDB

Pros:

- Asynchronous and better suited for larger campaign stores.
- Supports structured records, indexes, and more incremental persistence strategies.
- Better long-term fit for EPIC-07 if journal or roll-history data grows substantially.

Cons and limitations:

- More implementation complexity for schema setup, migrations, transaction handling, and tests.
- More surface area than needed for proving MVP data can survive reloads.

## MVP recommendation

Start with `localStorage` through `LocalStorageAdapter` and the `PersistenceAdapter` contract. Saved values are wrapped in a `VersionedSaveEnvelope` with `schemaVersion`, `appVersion`, `savedAt`, `payload`, and optional metadata. The adapter API is Promise-based even though `localStorage` is synchronous, so a future IndexedDB adapter can preserve feature-facing method shapes.

This recommendation is intentionally scoped to the first MVP spike. IndexedDB remains the likely follow-up if production campaign data, journals, backup snapshots, or roll history outgrow whole-document localStorage saves.

## Safety behavior

- Missing keys return a successful `found: false` load result and should not crash feature code.
- Malformed JSON returns a typed `malformed-data` error instead of throwing.
- JSON missing required schema/version metadata returns a typed `malformed-data` error.
- Unknown future schema versions return an `unsupported-version` error until migrations are implemented.
- Quota failures are surfaced as `quota-exceeded` when the browser exposes a quota DOMException.

## Backup spike

The spike includes a service-level `createCopyableJsonBackup` helper that produces copyable JSON containing export metadata and the saved envelope. It does not implement a full import/export UI, file picker, encryption, compression, or automatic backup rotation.

## Follow-up work

- Add a production campaign repository/service that validates domain payloads before save and after load.
- Decide when EPIC-07 should move storage from localStorage to IndexedDB.
- Add real migration functions for future save envelope versions.
- Add import-from-file UX and recovery guidance.
- Add storage quota testing notes after representative campaign sizes are known.

## Licensing note

Persistence tests use project-original placeholder records only. They do not include official rulebook prose, moves, oracle tables, asset text, artwork, icons, screenshots, or trade dress.
