# OR-11 Oracle responsive and accessibility checks

Date: 2026-07-13

## Scope inspected

Oracle browser, discovery filters, selected table details, question/context input, roll action, latest result, shared-history status, journal handoff action, custom-table editor, delete confirmation, loading, empty, error, and provenance/status messaging.

## Viewport checks

- Desktop (1280px): discovery filters remain labelled, table browser and selected table use two columns, results wrap long table/result/provenance text, and history/journal actions remain reachable.
- Tablet (768px): columns compress without clipping; action rows wrap and maintain visible labels and focus outlines.
- Mobile (360px): discovery filters, table selection, context/note inputs, roll action, result cards, editor rows, and delete confirmation stack to one column without ordinary horizontal page scrolling.

## Keyboard and focus checks

- Tab order follows page order: page header, custom editor, filters, table list, selected details, context/note fields, roll/actions, latest results, and journal handoff.
- Native buttons/selects/inputs provide keyboard operation and visible focus.
- Edit custom table moves focus to the custom-table editor heading.
- Delete custom table opens an alert dialog, focuses Cancel, supports Escape/cancel, and returns focus to the invoking Delete button when cancelled.

## Zoom, text, touch, and screen-reader sanity checks

- 200% zoom/text-size: long table names, entries, user context, validation messages, and provenance labels wrap without overlap.
- Touch: controls use practical minimum target sizing and full-width stacked action buttons on mobile.
- Screen reader: persistent labels and `aria-describedby` helper/error text identify inputs; status regions announce loading/filter counts/saved-history status/result changes; delete confirmation exposes an alert-dialog name and description.

## Limitations

Interactive browser assistive-technology runs were not available in this non-interactive shell. The checks above were performed by code inspection of semantic markup, responsive CSS breakpoints, and automated Angular tests.
