# UI consistency audit/checklist — issue #183

## Shared visual system

Global tokens live in `src/styles.css` and are inherited by the Angular shell and routed components. They define semantic color roles (`surface`, `text`, `muted`, `border`, `accent`, `success`, `warning`, `danger`, `focus`), action colors, spacing, typography, control sizing, radii, and shadows. Light and dark values are defined with `prefers-color-scheme`.

Shared primitives are intentionally small and opt-in by convention: panels/cards use `--ui-color-surface`, subtle panels use `--ui-color-surface-subtle`, actions use primary/secondary/destructive variants, notices use semantic warning/success/danger tokens, and form controls share minimum height, padding, radius, border, placeholder, disabled, invalid, and focus-visible treatments.

## Audit findings

- Buttons were repeatedly styled with different hard-coded blue, slate, parchment, and dark treatments across Character, Moves, Trackers, Oracles, Vows, Journal, onboarding, and placeholder views.
- Inputs/selects/textareas used different border colors, radii, padding, focus rings, and dark/light assumptions.
- Cards/panels used unrelated translucent dark surfaces, parchment surfaces, or shell surfaces depending on feature.
- Empty, warning, error, and saved states used feature-local colors instead of semantic variants.
- The shell palette previously existed only in `app-shell.css`; routed components now inherit the same global token layer.

## Migrated routed views

- Home and placeholder-style utility views.
- Welcome/onboarding, first vow, and review.
- Character sheet and status controls.
- Moves action roll input and roll history.
- Trackers.
- Oracles.
- Vows.
- Journal editor, list, reading view, links, and delete dialog styling hooks.
- Settings, About, and Not Found use the shared placeholder stylesheet.
- Shell and navigation now consume global tokens.

## Documented variants and exceptions

- Primary action: filled accent treatment for main submit/continue/roll actions.
- Secondary/quiet action: surface or transparent treatment with accent text for cancel, reset, filters, and navigation-adjacent actions.
- Destructive action: danger-soft surface with danger text for delete/reset-destructive actions.
- Panels/cards: default surface for major cards, subtle surface for nested facts/snapshots/stat chips, warning/success/danger semantic surfaces for state messaging.
- Journal snapshots intentionally keep a distinct subtle inset treatment so generated/mechanical snapshots remain visually separate from user-authored prose.
- Progress boxes in Trackers/Vows keep their compact mark-grid shape, but inherit shared semantic colors around the control chrome.

## Manual verification targets

Run a browser pass at representative desktop (~1280px), tablet (~768px), and mobile (~390px) widths in both light and dark system schemes:

- Confirm no ordinary horizontal scrolling or clipped action groups in shell/navigation, Character, Moves/history, Trackers, Oracles, Vows, Journal, Settings, About, onboarding, and Not Found.
- Tab through navigation, forms, filters, dialogs, and destructive actions; verify visible focus and preserved focus return.
- Check disabled controls, invalid required fields, helper/error text associations, destructive buttons, and dialog labels.
- Check increased text size/zoom and long user-authored Journal/Vow/Tracker content for wrapping without loss of distinction from generated snapshots.

Interactive browser and assistive-technology verification may be performed by QA if unavailable in the local agent environment.
