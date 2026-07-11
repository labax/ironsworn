# VJ-12 Vow responsive and accessibility checks

Date: 2026-07-11

## Scope

Checked the complete vow workspace workflows: list and detail cards, create/edit form, rank/status selection, progress-track link/unlink/create/open actions, progress rolls, outcome notes, milestones, archive/restore/delete, filtering/sorting/search, empty/loading/error states, and persistence-status preserving workspace state through the canonical `CampaignWorkspaceService`.

## Representative viewport and zoom checklist

Use browser responsive tooling when available:

- Desktop: 1280px and 1024px widths at 100% and 200% zoom.
- Tablet: 768px width at 100% and enlarged text.
- Mobile: 390px and 320px widths at 100%, enlarged text, and touch input.

Expected results:

- No ordinary vow control requires horizontal page scrolling.
- Title, rank, status, and linked progress summary remain visible in every card.
- Long titles, descriptions, notes, milestone notes, outcome notes, track names, IDs, warnings, and roll results wrap inside their cards.
- Primary action groups stack on narrow screens and keep practical touch target height.
- Critical statuses, warnings, archive state, destructive actions, and roll results are communicated with text, not color alone.

## Keyboard and screen-reader sanity checklist

- Tab through create/edit fields, filters, sort, link selector, progress-roll actions, outcome editor, milestone editor, archive, restore, and delete controls.
- Confirm focus moves into opened editors and returns to the invoking action or safe editor title field after save/cancel/destructive confirmations.
- Confirm form fields retain persistent labels and invalid fields expose `aria-invalid` plus error/help associations.
- Confirm sections use headings and labelled articles/lists so screen-reader navigation exposes the page, editor, discovery, vow cards, outcome, milestone, and progress-roll regions.

## Tooling limitation

This environment does not provide an interactive browser or assistive technology session. The checks above were documented for manual execution, while automated component tests cover label associations, focus return, long-content rendering, and narrow-layout class hooks where practical.
