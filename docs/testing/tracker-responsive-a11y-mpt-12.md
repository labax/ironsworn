# MPT-12 Tracker Responsive and Accessibility Checks

Date: 2026-07-11
Scope: Momentum/Progress tracker workspace only.

## Viewport and zoom checklist

The tracker layout was reviewed against the component markup and responsive CSS at these representative widths:

- Desktop: 1280 px wide at 100% and 200% browser zoom.
- Tablet: 768 px wide at 100% and 150% browser zoom.
- Mobile: 390 px wide at 100% and enlarged text/zoom expectations.

Expected results for all widths:

- The create/edit form, view switcher, empty state, tracker cards, progress boxes, and action controls use the same semantic markup and workspace state at every width.
- Long user-authored titles and notes wrap instead of clipping or overlapping adjacent controls.
- Ordinary controls wrap onto new rows and do not require horizontal page scrolling.
- Mobile action controls keep practical touch spacing and at least 44 px control height.
- Active values, progress score, type, rank, status, linked-vow state, archive state, warnings, errors, and manual override state remain visible as text, not only color.

## Keyboard and focus checklist

Keyboard sanity checks performed from the component structure and automated tests:

- Create, edit/open, save, mark, remove, correct, roll, archive, restore, delete, linked-vow navigation, and return-to-standard controls are native buttons, inputs, or selects.
- The editor returns focus to the track name after create/open/save actions.
- Archive/delete cancellation returns focus to the initiating control when it remains in the DOM.
- Validation errors move focus to the first invalid editor field.
- Visible `:focus-visible` outlines are defined for buttons, inputs, selects, and textareas.

## Screen-reader sanity checklist

Screen-reader sanity checks performed from the component semantics and automated DOM assertions:

- The page and editor have labelled heading structure.
- The tracker list, view switcher, progress action groups, progress boxes, latest roll result, form status, and workspace status expose programmatic names or live status text.
- Inputs include labels and relevant `aria-describedby` relationships for help or error text.
- Correction controls are associated with progress help/status text.
- Manual override, archive state, linked record state, progress values, rank/type/status, roll result, and boundary warnings are exposed as text.

## Limitations and manual follow-up

No interactive browser, assistive-technology session, or visual screenshot tooling was available in this environment. Follow-up in a real browser should verify:

1. At 1280 px, 768 px, and 390 px widths, zoom to 200% and confirm the document does not horizontally scroll for ordinary tracker controls.
2. With keyboard only, tab through create/edit, rank/type selection, mark/remove/correction/roll, archive/restore/delete confirmations, and linked-vow navigation.
3. With a screen reader, confirm status/live messages are announced after save, validation failure, progress correction, roll, archive, restore, and delete.
4. On touch hardware or device emulation, confirm progress controls are easy to tap and do not overlap with long titles or notes.

## Unrelated defects observed

- The production build reports existing CSS budget warnings for `vows.css` and `character.css`; those files are outside tracker scope and were not changed.
