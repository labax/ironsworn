# Ironsworn Digital Companion — Vertical Slice Manual QA Checklist

Issue: #42 — VS-10 Add vertical slice manual QA checklist  
Scope: VS-01 through VS-08  
Status: Draft checklist for manual verification

## Purpose

Verify the first playable vertical slice:

1. Create a minimal character.
2. Store the character in application state.
3. Persist the character locally.
4. Reload the character on app start.
5. Enter an action roll.
6. Resolve the action roll.
7. Save the roll to history.
8. Display the roll history list.

This checklist verifies the vertical slice only. It is not full MVP acceptance.

---

## Test Environment

Tester:

Date:

Branch / commit:

Browser:

Viewport tested:

Notes:

---

## Pre-checks

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Run `npm install` if dependencies are not installed. | Dependencies install successfully or any issue is documented. | |
| [ ] | [ ] | Run `npm run build`. | Build completes successfully. | |
| [ ] | [ ] | Run `npm run test:ci` or `npm test -- --watch=false`. | Tests pass, or skipped/failed checks are documented. | |
| [ ] | [ ] | Run `npm run lint` if configured. | Lint passes, or skipped/failed checks are documented. | |
| [ ] | [ ] | Run `npm run format:check` if configured. | Format check passes, or skipped/failed checks are documented. | |

---

## Test Data

Use original placeholder data only.

### Standard Test Character

| Field | Value |
|---|---|
| Name | Rowan Vale |
| Concept | Wandering oathkeeper |
| Edge | 3 |
| Heart | 2 |
| Iron | 2 |
| Shadow | 1 |
| Wits | 1 |
| Health | 5 |
| Spirit | 5 |
| Supply | 5 |
| Momentum | 2 |

### Optional Roll Context

| Field | Value |
|---|---|
| Roll label/context | Crossing the old bridge |
| Selected stat | Edge |
| Adds/modifier | 1 |

---

## Local Data Reset

Before a clean QA run:

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Clear local site data using browser dev tools, app reset control, or documented local storage reset method. | App starts with no saved character or roll history. | |
| [ ] | [ ] | Reload the app after clearing local data. | First-launch / empty state is shown safely. | |

---

## 1. First Launch / No-character State

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Open the app with no saved local data. | App loads without crashing. | |
| [ ] | [ ] | Navigate to the character area. | Empty state or create-character prompt is visible. | |
| [ ] | [ ] | Confirm the empty state uses original app wording. | No official rulebook prose or copied text appears. | |
| [ ] | [ ] | Confirm user can reach the minimal character form. | Character creation flow is discoverable. | |

---

## 2. Minimal Character Creation

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Open the minimal character form. | Form renders successfully. | |
| [ ] | [ ] | Check default status values. | Health 5, Spirit 5, Supply 5, Momentum 2 are prefilled or otherwise defaulted. | |
| [ ] | [ ] | Try submitting without a name. | Validation appears and bad data is not silently submitted. | |
| [ ] | [ ] | Enter the standard test character values. | All fields accept valid input. | |
| [ ] | [ ] | Submit the form. | Character is accepted and stored. | |
| [ ] | [ ] | Check visible character summary or confirmation. | Name and key values match the submitted character. | |

---

## 3. Active Character State

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | After submitting, navigate away and back within the app. | Character remains available during the current app session. | |
| [ ] | [ ] | Edit or resubmit character values if supported. | Updated values replace or patch the active character correctly. | |
| [ ] | [ ] | Confirm no-character state no longer appears after valid submit. | Active character summary or relevant character view is shown. | |

---

## 4. Local Persistence

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Create or update the standard test character. | Character is saved locally after submission/update. | |
| [ ] | [ ] | Refresh the page. | Character data is not lost. | |
| [ ] | [ ] | Close and reopen the app tab if practical. | Saved character is still available. | |
| [ ] | [ ] | Confirm persisted values. | Name, stats, Health, Spirit, Supply, Momentum, and optional concept match saved values. | |
| [ ] | [ ] | Simulate unavailable or cleared local data if practical. | App handles missing saved data without crashing. | |

---

## 5. Reload on App Start

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | With a saved character present, reload the app. | Saved character is restored into active state. | |
| [ ] | [ ] | Open the character view. | Restored character values are displayed correctly. | |
| [ ] | [ ] | Clear local data and reload again. | App shows empty/create-character state safely. | |
| [ ] | [ ] | If practical, test malformed saved data. | App does not crash and does not overwrite valid in-memory data with invalid saved data. | |

---

## 6. Minimal Action Roll Input

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Navigate to the roll/move/play area. | Minimal action roll input is visible. | |
| [ ] | [ ] | Confirm active character is shown near roll input if implemented. | Character name or summary is visible. | |
| [ ] | [ ] | Select Edge, Heart, Iron, Shadow, or Wits from the active character. | Selected stat value is used by the roll input. | |
| [ ] | [ ] | Enter an adds/modifier value. | Modifier is accepted and included in prepared roll input. | |
| [ ] | [ ] | Enter optional roll label/context. | Label/context is accepted. | |
| [ ] | [ ] | Try invalid numeric input. | Validation appears and bad input is not submitted silently. | |
| [ ] | [ ] | Submit a valid action roll input. | Roll proceeds to result display. | |

---

## 7. Action Roll Result Display

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Submit a valid action roll. | Result is displayed without crashing. | |
| [ ] | [ ] | Check raw dice display. | Action die and two challenge dice are visible. | |
| [ ] | [ ] | Check calculation inputs. | Stat/add inputs and final action score are visible. | |
| [ ] | [ ] | Check result classification. | Strong hit, weak hit, or miss is shown using original app wording. | |
| [ ] | [ ] | Check challenge dice match behavior if it occurs. | Match indicator is visible when challenge dice match. | |
| [ ] | [ ] | Confirm no narrative consequence is auto-written. | App shows mechanical result only. | |
| [ ] | [ ] | Confirm no official move text appears. | No copied move prose or rulebook text is displayed. | |

---

## 8. Save Action Roll to History

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Complete one action roll. | Roll is saved to in-memory history after resolution. | |
| [ ] | [ ] | Complete a second action roll. | A second separate history entry is created. | |
| [ ] | [ ] | Change active character values after saving a roll if supported. | Previously saved roll entries remain stable snapshots. | |
| [ ] | [ ] | Confirm optional roll label/context is preserved. | Saved history entry includes the label/context if supplied. | |
| [ ] | [ ] | Confirm duplicate entries are not created by one click. | One completed roll creates one history entry. | |

---

## 9. Roll History Display

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Open roll history before any roll is saved. | Clear empty state is shown. | |
| [ ] | [ ] | Save one action roll and view history. | One roll entry appears. | |
| [ ] | [ ] | Check one roll entry. | Entry shows label/context if present, dice, action score, result tier, and match indicator if applicable. | |
| [ ] | [ ] | Save multiple rolls and view history. | Entries appear in a clear order. | |
| [ ] | [ ] | Confirm latest roll is easy to identify if implemented. | Latest entry is visually or positionally clear. | |
| [ ] | [ ] | Confirm saved entries are not recalculated. | Display remains a saved snapshot. | |

---

## 10. Responsive Checks

Test at minimum:

- Desktop width.
- Mobile width using browser dev tools.

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Character form at desktop width. | Form is readable and usable. | |
| [ ] | [ ] | Character form at mobile width. | Fields stack or adapt without horizontal scrolling. | |
| [ ] | [ ] | Roll input at desktop width. | Roll input is compact and usable. | |
| [ ] | [ ] | Roll input at mobile width. | Roll fields remain usable and readable. | |
| [ ] | [ ] | Roll result at desktop width. | Dice, score, and result are readable. | |
| [ ] | [ ] | Roll result at mobile width. | Result stacks cleanly and remains readable. | |
| [ ] | [ ] | Roll history at desktop width. | Entries are scannable. | |
| [ ] | [ ] | Roll history at mobile width. | No wide table or awkward horizontal scrolling. | |

---

## 11. Basic Keyboard and Accessibility Sanity Checks

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Use keyboard to move through character form fields. | Focus order is usable. | |
| [ ] | [ ] | Use keyboard to submit character form. | Submit action is reachable. | |
| [ ] | [ ] | Use keyboard to select roll stat or manual input. | Roll input is keyboard-accessible. | |
| [ ] | [ ] | Check validation messages. | Errors appear near related fields. | |
| [ ] | [ ] | Check dice/result labels. | Values are understandable without relying only on layout. | |

---

## 12. Content and Licensing Safety Checks

| Pass | Fail | Check | Expected Result | Notes |
|---|---|---|---|---|
| [ ] | [ ] | Review character UI copy. | Uses original app wording only. | |
| [ ] | [ ] | Review roll input UI copy. | No official move prose or copied rulebook explanation. | |
| [ ] | [ ] | Review result display. | No official move text, examples, or narrative consequences. | |
| [ ] | [ ] | Review roll history display. | Stores and displays user-generated mechanical records only. | |
| [ ] | [ ] | Review icons/art/screenshots. | No unapproved official art, icons, screenshots, copied layout, or trade dress. | |
| [ ] | [ ] | Review test/sample data shown in UI. | Placeholder data is original and user-authored. | |

---

## 13. Out-of-scope Confirmation

The following should not block vertical-slice acceptance:

| Confirmed | Item |
|---|---|
| [ ] | Full MVP feature completeness is not required. |
| [ ] | Full character sheet is not required. |
| [ ] | Assets, vows, bonds, debilities, equipment, XP, and notes are not required. |
| [ ] | Oracle rolls are not required. |
| [ ] | Progress rolls are not required. |
| [ ] | Momentum burn workflow is not required. |
| [ ] | Full session journal is not required. |
| [ ] | Roll history persistence across reload is not required unless already implemented separately. |
| [ ] | Account/cloud sync is not required. |
| [ ] | Full accessibility audit is not required. |
| [ ] | Full cross-browser/device certification is not required. |

---

## 14. Demo Walkthrough Script

Use this optional script for a short vertical-slice recording:

1. Start with cleared local data.
2. Open the app and show the empty character state.
3. Create the standard test character.
4. Show the saved active character summary.
5. Refresh the page and show the character reload.
6. Open the action roll input.
7. Select a character stat and enter an adds/modifier value.
8. Submit the roll.
9. Show dice, action score, result tier, and match indicator if present.
10. Open roll history.
11. Show the saved roll entry.
12. Add a second roll and show multiple entries.
13. Briefly show mobile-width layout.

---

## Defect Notes

| ID | Area | Description | Severity | Follow-up Issue |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

---

## Acceptance Decision

| Decision | Checked |
|---|---|
| Accept vertical slice | [ ] |
| Accept with known follow-up issues | [ ] |
| Do not accept yet | [ ] |

Decision notes:

Reviewer:

Date: