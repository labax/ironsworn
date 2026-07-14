# Issue #186 text contrast audit

This audit covers the routed MVP shell and feature views in the checked-out `labax/ironsworn` workspace: app shell/navigation, home, placeholder, not-found, onboarding welcome/first-vow/review states, character, moves and history, trackers, oracles, vows, journal, settings, about, dialogs, notices, and shared form/action states.

## Method

- Parsed `src/styles.css` light and dark semantic tokens and calculated WCAG contrast ratios with the deterministic `scripts/contrast-tokens.test.mjs` utility.
- Searched routed component styles and templates for text-bearing states, including headings, labels, helper text, metadata, badges/status labels, links, buttons, form controls, selected cards, notices, dialogs, destructive actions, empty/loading/saved/error/warning states, readonly and disabled states.
- Treated inherited colors, soft surfaces, selected states, and disabled-state opacity as actual rendered combinations rather than relying on token names alone.

## Semantic token contrast inventory

| Pair | Light ratio | Dark ratio | Target | Result |
| --- | ---: | ---: | ---: | --- |
| Body text / page background | 15.35:1 | 16.57:1 | 4.5:1 | Pass |
| Body text / surface | 16.45:1 | 14.54:1 | 4.5:1 | Pass |
| Body text / subtle surface | 14.51:1 | 12.81:1 | 4.5:1 | Pass |
| Muted text / page background | 5.92:1 | 10.17:1 | 4.5:1 | Pass |
| Muted text / surface | 6.34:1 | 8.93:1 | 4.5:1 | Pass |
| Muted text / subtle surface | 5.64:1 | 7.87:1 | 4.5:1 | Pass |
| Accent-strong text / surface | 7.27:1 | 10.47:1 | 4.5:1 | Pass |
| Accent-strong text / accent-soft surface | 5.93:1 | 7.51:1 | 4.5:1 | Pass |
| Success text / success-soft surface | 5.19:1 | 9.50:1 | 4.5:1 | Pass |
| Warning text / warning-soft surface | 5.90:1 | 10.78:1 | 4.5:1 | Pass |
| Danger text / danger-soft surface | 5.93:1 | 7.87:1 | 4.5:1 | Pass |
| Primary action text / primary background | 7.27:1 | 12.56:1 | 4.5:1 | Pass |
| Primary action text / primary hover background | 8.87:1 | 14.63:1 | 4.5:1 | Pass |
| Secondary action text / secondary background | 7.27:1 | 12.83:1 | 4.5:1 | Pass |
| Destructive action text / destructive background | 5.93:1 | 7.87:1 | 4.5:1 | Pass |
| Disabled action/control text / disabled background | 5.04:1 | 8.32:1 | 4.5:1 | Pass |

## Findings and fixes

- Light-mode success and warning foregrounds on their soft semantic surfaces were below 4.5:1. The shared `--ui-color-success` and `--ui-color-warning` tokens were darkened slightly so reused success, saved, warning, UAT banner, progress warning, notice, and empty-state text remains readable without one-off component overrides.
- Disabled controls previously used whole-element opacity. That could reduce foreground and background contrast unpredictably and made text-like symbols harder to identify. Shared disabled foreground/background tokens now style disabled buttons and form controls explicitly while preserving the disabled affordance.
- Dark-mode secondary actions used a transparent background token, making automated and manual reasoning depend on each component's inherited surface. The token now resolves to the dark surface color so secondary buttons and links have a stable verified pair.
- Oracle availability labels used a hard-coded pale green that failed on light surfaces. They now use the shared accent-strong foreground.
- Component-level disabled button opacity in onboarding, moves, trackers, and oracles was replaced with the shared disabled text/background tokens.
- Vow secondary and destructive actions now use the shared secondary/destructive action tokens instead of border or danger colors as button backgrounds.

## Reviewed view/state checklist

- Shell/header/footer/navigation: default, hover/focus, active navigation, UAT banner, autosave status, footer link.
- Home, placeholder, not-found, settings, about: headings, labels, body copy, links, placeholders, disclaimers and provenance labels.
- Onboarding: welcome, first vow, review, validation summary, skip/exit confirmation dialog, loading/saving/disabled/success paths.
- Character: identity editor, stats, status controls and steppers, Momentum/Experience, bonds, assets, equipment, notes, saved/empty/warning/error states.
- Moves/history: roll inputs/results, Momentum burn preview/applied states, history filters, badges, source links, empty and action states.
- Trackers: cards, progress controls, facts, notices, result panels, archived state, destructive/delete warnings.
- Oracles: filters, table navigation, selected table, result cards, provenance labels, custom editor, delete dialog, loading/empty/error states.
- Vows: discovery, cards, selected/active/archived states, progress links, milestones, outcomes, dialogs, destructive actions.
- Journal: editor, list, reading view, source links, snapshots, warnings, delete confirmation and generated/mechanical snapshot metadata.

## Exceptions and limitations

- Decorative borders, shadows, and focus outlines were not treated as text and are outside the text-contrast ratio table; focus remains visible with existing outline styles.
- The dialog backdrops are translucent overlays, but dialog text is rendered on opaque semantic surfaces and covered by the surface/text pairs above.
- Browser-native select option popup rendering can vary by operating system. The in-page select controls use verified semantic foreground/background tokens; native popup chrome should be checked during manual QA.
- No interactive browser or assistive-technology session was available in this command-only environment. Manual QA should open representative desktop (1280px), mobile (360px), and increased-text-size views in both light and dark system color schemes and walk the reviewed route/state checklist above.
