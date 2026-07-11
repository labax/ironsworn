# Release notes

Release notes and release process documentation will live here.

No application releases have been produced yet.

## Release content provenance gate

Before a public build or release candidate, run:

```sh
npm run validate:content
```

Release-blocking errors must be resolved before publishing. Warnings identify records that are not release-eligible unless later reviewed; public bundled references may only point to release-eligible manifest entries. This validation records provenance metadata and does not provide legal advice or copyright-similarity detection.
