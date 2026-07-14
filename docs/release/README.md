# Release notes

Release notes and release process documentation will live here.

No application releases have been produced yet.

## Release content provenance gate

Before a public build or release candidate, run:

```sh
npm run validate:content
```

Release-blocking errors must be resolved before publishing. Warnings identify records that are not release-eligible unless later reviewed; public bundled references may only point to release-eligible manifest entries. This validation records provenance metadata and does not provide legal advice or copyright-similarity detection.

Before releasing bundled oracle content, complete the repeatable [Oracle content licensing review checklist](../licensing/oracle-content-licensing-review.md) and keep any missing, conflicting, unknown, unreviewed, or blocked provenance out of public builds.

## Public release gate and evidence

Public artifact-producing workflows must run the canonical release gate before build output is uploaded or deployed:

```sh
npm run validate:content:release
```

This is the same validator as `npm run validate:content`, with explicit release strictness and an evidence file at `dist/release-evidence/content-provenance-evidence.json`. The evidence artifact contains diagnostic summaries, manifest inventory counts and IDs, checklist status, commit/ref metadata when available, and timestamps. It must not include protected content bodies, user-authored runtime saves, journal text, custom oracle tables, or other private local data.

Authorized exceptions are not silent overrides. A release-blocking diagnostic may only be cleared by a documented content/licensing remediation approved by the repository owner or delegated content-release reviewers. Required evidence includes the manifest record ID or checklist item, source/license/attribution notes, reason for approval or removal, and the follow-up commit that changes the version-controlled manifest, checklist, docs, or bundled content. Workflow environment variables or skipped steps are not an approved bypass.
