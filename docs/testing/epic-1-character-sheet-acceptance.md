# Epic #1 Character Sheet Acceptance Checklist

Issue: #63 — CS-12 final regression and acceptance coverage  
Scope: CS-01 through CS-11 complete character sheet  
Status: Manual acceptance checklist and coverage map

## Test environment record

Complete this section during each manual acceptance pass.

| Field               | Value                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Tester              |                                                                                                        |
| Date                |                                                                                                        |
| Branch / commit     |                                                                                                        |
| Browser and version |                                                                                                        |
| Desktop viewport    | 1440 × 900                                                                                             |
| Tablet viewport     | 768 × 1024                                                                                             |
| Mobile viewport     | 390 × 844                                                                                              |
| Accessibility tools | Keyboard-only navigation, browser accessibility tree/inspector, screen-reader smoke check if available |
| Notes / limitations |                                                                                                        |

## Licensing-safe test data

Use only this project-original, user-authored sample data or similarly original table data. Do not paste official move prose, asset text, oracle text, artwork, icons, screenshots, copied sheet layouts, or trade dress into the app, fixtures, docs, or tests.

| Area            | Sample value                                                              |
| --------------- | ------------------------------------------------------------------------- |
| Name            | Rowan Vale                                                                |
| Concept         | Wandering oathkeeper                                                      |
| Stats           | Edge 3, Heart 2, Iron 2, Shadow 1, Wits 1                                 |
| Status          | Health 5, Spirit 5, Supply 5                                              |
| Momentum        | Current 2, Reset 2, Maximum 10                                            |
| Bond            | Brynn — Met at the ford; owes a favor                                     |
| Asset reference | Raven companion; category Companion; source My table; notes Trusted scout |
| Equipment notes | Rope, torch, keepsake\nSpare cloak                                        |
| Character notes | Question: who left the mark?\nTrust Brynn.                                |

## Epic #1 acceptance coverage map

| Epic #1 must-have criterion                                                                        | Automated coverage                                                                                                                                                                      | Manual checklist item |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Create a character from no-character state                                                         | `Character` component tests render empty state, validate required name, and save a valid character.                                                                                     | M1, M2                |
| Identity and core stats can be edited with validation and correction                               | `Character` component tests cover editor prefill, required-name/stat validation, nonstandard-spread warning, save, cancel, and unrelated-field preservation.                            | M3                    |
| Health, Spirit, and Supply controls enforce normal limits and support explicit overrides           | `Character` component tests cover status controls, increment/decrement bounds, direct input validation, override persistence, save failure retention, and unrelated-field preservation. | M4                    |
| Momentum editing follows deterministic debility-derived Maximum/Reset behavior                     | `src/app/rules/momentum/momentum.spec.ts` covers pure derived values; `Character` component tests cover debility toggles, clamping confirmation, overrides, and return to derived mode. | M5                    |
| Bonds can be added, edited, removed, ordered, and persisted with notes                             | `Character` component and persistence tests cover empty state, add/edit/remove, stable IDs/order, multiline notes, reload, and unrelated-field preservation.                            | M6                    |
| Experience earned/spent/available supports warnings and overrides                                  | `Character` component and persistence tests cover calculated available XP, negative rejection, overspend warning, manual correction, persistence, and reload.                           | M7                    |
| Asset references can be added, edited, removed, ordered, and classified as user-authored           | `Character` component and persistence tests cover empty state, add/edit/remove, stable IDs/order, provenance, notes, reload, and unrelated-field preservation.                          | M8                    |
| Equipment and general notes preserve multiline text and retain in-memory edits on save failure     | `Character` component and persistence tests cover independent multiline saves, reload, and save-failure retention.                                                                      | M9                    |
| Complete-character round trip and minimal-save migration do not lose fields                        | Character journey test plus persistence and migration tests cover complete save/load and minimal-schema defaults.                                                                       | M10                   |
| Section-specific updates preserve unrelated fields                                                 | `ActiveCharacterService`, component, persistence, and complete journey tests assert nested patch preservation across sections.                                                          | M3-M10                |
| Responsive desktop, tablet, and mobile layouts are usable                                          | Documented manual checks.                                                                                                                                                               | M11                   |
| Keyboard, focus, labels, error association, screen-reader sanity, and touch targets are acceptable | Component accessibility assertions plus documented manual checks.                                                                                                                       | M12                   |
| Content and licensing checks confirm only approved labels and original/user-authored text/assets   | Content validation scripts and documented manual review.                                                                                                                                | M13                   |

## Manual acceptance checklist

### M1. First launch / no-character state

| Pass | Fail | Check                                   | Expected result                                                            | Notes |
| ---- | ---- | --------------------------------------- | -------------------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Clear local site data and open the app. | App loads safely and shows the character create prompt/no-character state. |       |
| [ ]  | [ ]  | Inspect no-character copy.              | Copy is original app guidance and does not include official prose.         |       |

### M2. Create character

| Pass | Fail | Check                                             | Expected result                                                                        | Notes |
| ---- | ---- | ------------------------------------------------- | -------------------------------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Submit with blank name.                           | Name error appears, is associated with the field, and no character is saved.           |       |
| [ ]  | [ ]  | Enter the licensing-safe test character and save. | Character summary appears with submitted identity, stats, status tracks, and Momentum. |       |

### M3. Identity and stats editing

| Pass | Fail | Check                                                     | Expected result                                                                                                                  | Notes |
| ---- | ---- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Open identity/stat editor.                                | Current values are prefilled and focus moves into the editor.                                                                    |       |
| [ ]  | [ ]  | Enter invalid name or non-whole stat.                     | Error text appears near the related field and active character remains unchanged.                                                |       |
| [ ]  | [ ]  | Correct values, including a nonstandard spread, and save. | Warning is visible for nonstandard spread; corrected values save without changing status, Momentum, bonds, assets, XP, or notes. |       |

### M4. Health, Spirit, and Supply

| Pass | Fail | Check                                                  | Expected result                                                 | Notes |
| ---- | ---- | ------------------------------------------------------ | --------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Use +/- and arrow keys for each track.                 | Values change within 0 to 5 and announce/save locally.          |       |
| [ ]  | [ ]  | Try below 0 and above 5 without override.              | Invalid values are rejected and previous values remain visible. |       |
| [ ]  | [ ]  | Enable override and save a value above 5, then reload. | Override value persists and unrelated fields are unchanged.     |       |

### M5. Momentum and debilities

| Pass | Fail | Check                                                                                       | Expected result                                                                                                    | Notes |
| ---- | ---- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----- |
| [ ]  | [ ]  | Edit current/reset/maximum Momentum within normal bounds.                                   | Values save and persist.                                                                                           |       |
| [ ]  | [ ]  | Mark one debility.                                                                          | Maximum becomes 9 and Reset becomes 1 unless manual override is preserved by confirmation choice.                  |       |
| [ ]  | [ ]  | Mark multiple debilities.                                                                   | Maximum decreases by marked count and Reset becomes 0.                                                             |       |
| [ ]  | [ ]  | Enable manual Momentum override, edit values, mark a debility, then return to derived mode. | Override values are preserved until returning to derived mode; derived Maximum/Reset then match marked debilities. |       |

### M6. Bonds

| Pass | Fail | Check                                      | Expected result                                                                                                | Notes |
| ---- | ---- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Add two bonds with project-original notes. | Bonds appear with stable names/notes in the order added.                                                       |       |
| [ ]  | [ ]  | Edit one bond.                             | Same bond ID/position is updated; no duplicate is created.                                                     |       |
| [ ]  | [ ]  | Cancel and confirm removal flows.          | Unsaved edits prompt before discard, removal prompts before deleting notes, and only selected bond is removed. |       |
| [ ]  | [ ]  | Reload.                                    | Remaining bonds and notes persist.                                                                             |       |

### M7. Experience

| Pass | Fail | Check                                           | Expected result                                                                     | Notes |
| ---- | ---- | ----------------------------------------------- | ----------------------------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Edit earned and spent.                          | Available equals earned minus spent.                                                |       |
| [ ]  | [ ]  | Try negative values.                            | Negative values are rejected.                                                       |       |
| [ ]  | [ ]  | Try spent above earned, then enable correction. | Warning appears first; manual correction allows negative available XP and persists. |       |

### M8. Asset references

| Pass | Fail | Check                                   | Expected result                                                              | Notes |
| ---- | ---- | --------------------------------------- | ---------------------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Add two user-authored asset references. | References appear with user-authored classification and original notes only. |       |
| [ ]  | [ ]  | Edit one reference.                     | Same ID/position updates; no duplicate is created.                           |       |
| [ ]  | [ ]  | Remove one reference and reload.        | Only selected reference is removed; remaining IDs/order/provenance persist.  |       |

### M9. Equipment and notes

| Pass | Fail | Check                                                    | Expected result                                               | Notes |
| ---- | ---- | -------------------------------------------------------- | ------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Save multiline equipment notes and character notes.      | Line breaks and punctuation are preserved after reload.       |       |
| [ ]  | [ ]  | Simulate or observe a storage save failure if practical. | In-memory text remains visible and save failure is announced. |       |

### M10. Complete round trip and migration

| Pass | Fail | Check                                                            | Expected result                                                                                            | Notes |
| ---- | ---- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Create a complete character, edit every section, refresh/reopen. | All values match the saved complete character.                                                             |       |
| [ ]  | [ ]  | Load an existing minimal save if available.                      | Missing complete-sheet fields are defaulted without losing original identity, stats, status, and Momentum. |       |

### M11. Responsive layout

| Pass | Fail | Check               | Expected result                                                                | Notes |
| ---- | ---- | ------------------- | ------------------------------------------------------------------------------ | ----- |
| [ ]  | [ ]  | Desktop 1440 × 900. | Complete sheet is readable and usable without unexpected horizontal scrolling. |       |
| [ ]  | [ ]  | Tablet 768 × 1024.  | Cards/controls adapt and remain readable.                                      |       |
| [ ]  | [ ]  | Mobile 390 × 844.   | Fields stack, buttons remain reachable, and touch targets are usable.          |       |

### M12. Keyboard and accessibility sanity

| Pass | Fail | Check                                                                      | Expected result                                                                                                   | Notes |
| ---- | ---- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Tab through create form, sheet controls, editors, add/edit/remove buttons. | Focus order is logical and visible; all actions are keyboard reachable.                                           |       |
| [ ]  | [ ]  | Activate buttons/checkboxes with keyboard.                                 | Space/Enter interactions work where expected.                                                                     |       |
| [ ]  | [ ]  | Inspect labels and error associations.                                     | Inputs have accessible names; validation/error text is discoverable through labels or described-by relationships. |       |
| [ ]  | [ ]  | Screen-reader/browser accessibility-tree smoke check.                      | Section headings, live status updates, and named item actions are understandable.                                 |       |

### M13. Content and licensing safety

| Pass | Fail | Check                                           | Expected result                                                                                    | Notes |
| ---- | ---- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----- |
| [ ]  | [ ]  | Review character UI, fixtures, docs, and tests. | No official prose, asset text, art, icons, screenshots, copied layout, or trade dress are bundled. |       |
| [ ]  | [ ]  | Run configured content validation scripts.      | Scripts pass or limitations are documented precisely.                                              |       |

## Deferred / skipped checks log

| Check                                       | Reason deferred or skipped                                                                                                                      | Follow-up                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Dedicated browser E2E runner                | No Playwright/Cypress or equivalent E2E script is configured in `package.json`; coverage is via Angular component tests plus manual acceptance. | Add when project chooses an E2E runner.               |
| Automated accessibility scanner             | No axe or equivalent scanner is configured; manual accessibility sanity checks are required for this story.                                     | Add compatible scanner when test tooling is approved. |
| Formal external accessibility certification | Out of scope for issue #63.                                                                                                                     | Consider before public release if required.           |
