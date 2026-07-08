# Content inventory

The project content inventory starts in `content/manifest.json`. Future content files should reference manifest entries by `id` so each oracle, move, rules summary, helper text, fixture, notice, or asset reference can be traced to source and license metadata.

## Current inventory status

- Only project-original placeholder records are included.
- No official Ironsworn prose, move text, oracle rows, asset text, art, icons, screenshots, copied layout, or trade dress are included.
- Unknown, unreviewed, review-required, and blocked records are not release-ready.

## Future inventory workflow

- Add content in small reviewable batches.
- Keep app helper text separate from game data entries.
- Link notice requirements through `noticeRef` when attribution is required.
- Treat manifest-to-NOTICE generation and release-blocking validation as future workflow improvements after content loading exists.
