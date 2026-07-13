# Local MVP backup envelope

The local backup export writes human-inspectable JSON and does not upload data. The file is intended
for the matching restore workflow and contains only the canonical application-state snapshot.

## Envelope

Top-level fields are stable for format version 1:

- `format`: `ironsworn-local-mvp-backup`.
- `formatVersion`: backup-envelope version.
- `exportedAt`: ISO timestamp generated for the download.
- `application`: app name, app version, and environment label.
- `save`: canonical versioned application-state save envelope, including save schema version,
  app version, saved timestamp, metadata, and payload.
- `validation`: validation timestamp, validated domains, record counts, and recoverable warnings.

## Payload boundaries

The `save.payload` object includes the supported MVP user-data domains: active character,
campaign workspace records (vows, progress tracks, journal entries, custom oracle tables, selected
record IDs), shared roll/oracle/progress history, and autosave revision metadata. Bundled content,
caches, temporary UI state, debug data, unrelated browser storage, and raw local-storage keys are not
exported. Generated or bundled snapshots preserve provenance references and stable IDs rather than
copying redundant protected bundled content when references are sufficient.

## Privacy and compatibility

Backup JSON may contain private campaign notes and user-authored oracle text. Users should store it
securely. Restore implementations should verify `format`, `formatVersion`, `save.schemaVersion`, and
validation metadata before importing.
