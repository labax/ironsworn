# Acceptance Criteria / Test Plan

## Ironsworn Digital Companion

*Version 0.1 | Draft | Prepared for the Ironsworn Project*

| Field | Value |
|---|---|
| Document owner | Product Owner / Project Lead |
| Related documents | Business Requirements Document v0.1; MVP Scope Document v0.1; Functional Requirements Document v0.1; Rules Engine Requirements v0.1; Data Model / Domain Model Specification v0.1; UX Flow / Wireframe Requirements v0.1; Content & Licensing Requirements v0.1 |
| Product scope | Solo-first Ironsworn digital companion MVP |
| MVP baseline | Character sheet, move roller, momentum/progress trackers, oracle tables, vow journal |
| Intended audience | Product owner, developer, UX designer, QA/tester, content/licensing reviewer, early playtesters |
| Status | Draft for review |

---

# Contents

1. Purpose  
2. Source Basis  
3. Test Plan Context  
4. Quality Objectives  
5. Test Scope  
6. Out of Scope  
7. Test Strategy  
8. Test Levels  
9. Test Environments  
10. Test Data Strategy  
11. Entry Criteria  
12. Exit Criteria  
13. Release Candidate Acceptance Gates  
14. Global MVP Acceptance Criteria  
15. Feature-Level Acceptance Criteria  
16. Detailed Acceptance Test Scenarios  
17. Rules Engine Test Matrix  
18. Persistence and Data Safety Test Matrix  
19. UX, Accessibility, and Responsive Test Matrix  
20. Content and Licensing Test Matrix  
21. Regression and Smoke Test Set  
22. Playtest / UAT Plan  
23. Defect Severity and Triage  
24. Traceability Matrix  
25. Open Questions  
26. Approval

---

# 1. Purpose

This document defines the acceptance criteria and test plan for the Ironsworn Digital Companion MVP.

It converts the project's business, MVP, functional, rules-engine, data-model, UX, and licensing requirements into a testable release-readiness framework. It is intended to help the project decide whether the MVP is complete enough for internal QA, closed playtest, and eventual public release review.

The MVP is considered successful when a solo-first player can create or resume a character, manage essential play state, roll moves, use momentum/progress tools, consult approved oracles, track vows, and maintain a basic journal without external spreadsheets or disconnected note tools for core tracking.

---

# 2. Source Basis

This document is based on:

- Ironsworn Rulebook by Shawn Tomkin.
- Ironsworn Digital Companion Business Requirements Document v0.1.
- Ironsworn Digital Companion MVP Scope Document v0.1.
- Ironsworn Digital Companion Functional Requirements Document v0.1.
- Ironsworn Digital Companion Rules Engine Requirements v0.1.
- Ironsworn Digital Companion Data Model / Domain Model Specification v0.1.
- Ironsworn Digital Companion UX Flow / Wireframe Requirements v0.1.
- Ironsworn Digital Companion Content & Licensing Requirements v0.1.
- The agreed MVP baseline: character sheet, move roller, momentum/progress trackers, oracle tables, and vow journal.

Important content note: this test plan verifies that content provenance, attribution, licensing notices, and release gates are implemented. It is not legal advice and does not replace content or legal review.

---

# 3. Test Plan Context

The Ironsworn Digital Companion is a lightweight play companion, not a full virtual tabletop, automated game master, marketplace, full rules compendium, or AI storytelling system. Testing must therefore validate two things at the same time:

1. The app correctly handles concrete mechanics and data operations.
2. The app does not over-automate or misrepresent fiction-first play.

The most important test risk areas are:

| Risk Area | Why it matters | Test response |
|---|---|---|
| Rules-adjacent calculation errors | Incorrect dice, momentum, or progress behavior would damage trust. | Deterministic unit tests and manual expected-result scenarios. |
| Data loss | Character and journal notes have high player value. | Persistence, reload, export, and destructive-action tests. |
| Scope creep | MVP could accidentally require excluded features. | Explicit out-of-scope release gate. |
| Licensing risk | Unapproved rulebook text, oracle data, art, or trade dress could block release. | Content inventory and release-gate tests. |
| Poor solo UX | If roll, oracle, progress, and journal flows are slow, the product fails its purpose. | Playtest scenarios and UX acceptance checks. |
| Over-automation | Forced story consequences would undermine the companion model. | Tests confirm user interpretation and user-confirmed consequences. |

---

# 4. Quality Objectives

| ID | Quality Objective | Acceptance Signal |
|---|---|---|
| QO-01 | Support the full solo MVP play loop. | A tester can complete character setup, first vow, action roll, progress update, oracle result, and journal entry in one session. |
| QO-02 | Produce correct rules results. | Dice, action roll, progress roll, oracle roll, match, momentum, and progress calculations pass deterministic tests. |
| QO-03 | Preserve user data. | Saved character, vow, progress, oracle, roll history, and journal data survive normal close/reopen. |
| QO-04 | Preserve fiction-first play. | The app prompts interpretation and records user notes; it does not force narrative outcomes. |
| QO-05 | Maintain MVP boundaries. | No test scenario requires maps, live multiplayer, AI GM, marketplace, full official assets, or monetization. |
| QO-06 | Be usable on common device sizes. | Core flows work on desktop, tablet, and phone widths. |
| QO-07 | Be ready for content review. | Bundled content has provenance metadata and unresolved content blocks public release. |
| QO-08 | Support maintainable QA. | Must-have requirements map to acceptance criteria or test cases. |

---

# 5. Test Scope

## 5.1 In Scope

| Area | In-scope testing |
|---|---|
| Character Sheet | Creation, editing, validation, debilities, stats, tracks, bonds, assets references, notes, save/reload. |
| Move Roller | Action rolls, progress rolls, oracle rolls, result classification, ties, matches, negative momentum, momentum burn, roll history. |
| Momentum / Progress Trackers | Momentum min/max/reset, manual adjustment, rank-based progress helpers, ticks/boxes, progress roll score. |
| Oracle Tables | Yes/no oracle, d100 roll, approved table browse/roll, provenance label, save/copy result. |
| Vow Journal | Vow creation, rank, status, progress, milestones, outcome notes, journal linkage. |
| Session Journal | Create/edit notes, saved roll/oracle outputs, chronological display, vow/track links where implemented. |
| Persistence | Close/reopen, reload, storage warning if local-first, export if implemented, data recovery states. |
| Onboarding | First character path, starting value hints, first vow prompt, empty states. |
| UX / Accessibility | Keyboard basics, readable labels, responsive layout, confirmation states, error states. |
| Content / Licensing | Source categories, content inventory, attribution screen, unofficial disclaimer, release gates. |
| Regression | Smoke test set for every build or release candidate. |

## 5.2 Conditional Scope

| Area | Test only if implemented |
|---|---|
| Manual dice entry | Validate manual d6, d10, d100 input and generated-vs-manual roll source. |
| Roll history persistence | Verify history survives reload only if persistent history is implemented. |
| JSON export | Verify export package, schema version, and content inclusion rules. |
| Account-based persistence | Verify user data isolation, authentication failure states, and multi-device sync. |
| Local-first persistence | Verify browser/device storage warning, backup/export guidance, and local reload behavior. |

---

# 6. Out of Scope

The following are explicitly not required for MVP acceptance testing:

| Area | Excluded from MVP testing |
|---|---|
| Full VTT | Maps, tokens, tactical grids, fog of war, scene boards. |
| Real-time Multiplayer | Live shared campaigns, invitations, presence, conflict resolution. |
| AI | AI GM, AI oracle interpretation, AI-authored journal prose, story automation. |
| Marketplace | Paid content, asset store, community publishing, creator payouts. |
| Full Rules Compendium | Complete copied rulebook sections, complete official move library, full rulebook replacement. |
| Full Asset Automation | Automated effects for every official asset. |
| Native Apps | iOS/Android app-store release testing. |
| Monetization | Payments, subscriptions, ads, gated content, unless later cleared by licensing review. |
| Advanced Campaign Management | NPC graph, relationship map, world atlas, timeline, region map editor. |

---

# 7. Test Strategy

The MVP should use a layered test strategy:

| Layer | Purpose | Recommended method |
|---|---|---|
| Requirements review | Catch gaps before coding. | Checklist review against each Must requirement. |
| Unit tests | Verify rules calculations and domain validation. | Deterministic dice injection; pure function tests. |
| Component tests | Verify UI controls and states. | Character fields, roll modal, track controls, oracle panel, journal forms. |
| Integration tests | Verify features working together. | Roll-to-journal, vow-to-progress, progress roll from track, save/reload. |
| End-to-end tests | Verify player journeys. | First launch, resume session, action roll with burn, oracle-to-journal, vow completion. |
| Accessibility checks | Verify baseline usability. | Keyboard navigation, labels, focus, contrast, responsive layout. |
| Content review tests | Verify release compliance. | Content inventory, source categories, attribution, no unapproved bundled content. |
| Playtest / UAT | Verify actual solo-session value. | Structured playtest script plus feedback survey. |
| Regression smoke tests | Protect core flows after changes. | Small repeatable checklist before every release candidate. |

---

# 8. Test Levels

## 8.1 Unit Tests

Primary owner: developer.  
Primary focus: rules engine and domain model.

Must cover:

- Dice ranges and deterministic injection.
- Action roll classification.
- Tie handling.
- Challenge dice match detection.
- Action score cap.
- Negative momentum cancellation.
- Momentum burn eligibility and result recalculation.
- Momentum reset after burn.
- Progress track tick/box math.
- Progress score from filled boxes only.
- Progress roll classification.
- Oracle d100 range and yes/no odds.
- Domain validation for tracks, stats, momentum, and source categories.

## 8.2 Component / UI Tests

Primary owner: developer/QA.  
Primary focus: individual screens or components.

Must cover:

- Character creation form.
- Stat and track controls.
- Debility toggles.
- Action roll panel.
- Momentum burn confirmation.
- Progress track editor.
- Oracle roll result view.
- Vow detail view.
- Journal editor.
- Empty states and validation messages.

## 8.3 Integration Tests

Primary owner: developer/QA.  
Primary focus: feature connections.

Must cover:

- Character state used by roll inputs.
- Action roll saved to roll history.
- Roll result saved to journal.
- Vow creation creates or links a vow progress track.
- Progress track can launch a progress roll.
- Oracle result can be saved to journal.
- Debility changes affect derived momentum values where implemented.
- Save/reload restores linked objects.

## 8.4 End-to-End Tests

Primary owner: QA/product owner.  
Primary focus: user journeys.

Must cover:

- First launch to first character.
- Resume saved session.
- Create vow and mark milestone.
- Action roll with optional momentum burn.
- Progress roll from a vow or track.
- Oracle roll to journal.
- Basic play loop without external tools.

## 8.5 Content and Licensing Review Tests

Primary owner: content/licensing reviewer.  
Primary focus: release eligibility.

Must cover:

- Content inventory exists.
- Bundled content has source category.
- Unknown/restricted content is blocked from release.
- Attribution and license notice are present.
- Unofficial-product disclaimer is present.
- Rulebook art, icons, trade dress, and unapproved visual assets are absent.
- Commercial release gate blocks NonCommercial-only content unless separately approved.

## 8.6 Playtest / UAT

Primary owner: product owner.  
Primary focus: practical value.

Must cover:

- Solo player can complete a 30-60 minute test session.
- Player can understand what changed after each roll or progress update.
- Journal and oracle flows are fast enough to support play.
- Known limitations are clear and acceptable for MVP.

---

# 9. Test Environments

| Environment | Purpose | Minimum requirements |
|---|---|---|
| Local Development | Developer unit and component tests. | Deterministic test fixtures; seeded content; debug logging. |
| QA Build | Manual QA and integration testing. | Stable build; resettable test data; representative browser/device coverage. |
| Closed Playtest Build | Early user validation. | Content-reviewed build; attribution screen; known limitations; no monetization. |
| Release Candidate | Final acceptance. | All Must criteria implemented or formally descoped; no blocker/critical defects. |

## 9.1 Browser / Device Coverage

Minimum recommended MVP coverage:

| Platform | Coverage target |
|---|---|
| Desktop Chromium-based browser | Must |
| Desktop Firefox | Should |
| Mobile Chromium-based browser | Should |
| Mobile Safari / iOS browser | Should before public release |
| Tablet width responsive test | Should |

---

# 10. Test Data Strategy

## 10.1 Standard Test Character

Use a repeatable test character for manual and automated scenarios.

| Field | Value |
|---|---|
| Name | Asha Test-Bearer |
| Concept | Solo Ironsworn playtest character |
| Edge | 3 |
| Heart | 2 |
| Iron | 2 |
| Shadow | 1 |
| Wits | 1 |
| Health | 5 |
| Spirit | 5 |
| Supply | 5 |
| Momentum | 2 |
| Momentum Max | 10 |
| Momentum Reset | 2 |
| Experience | 0 |

## 10.2 Standard Test Vow

| Field | Value |
|---|---|
| Title | Find the Lost Caravan |
| Rank | Dangerous |
| Type | Inciting incident vow |
| Status | Active |
| Initial progress | 0 ticks |

## 10.3 Standard Test Track

| Field | Value |
|---|---|
| Title | Journey to Frostwood |
| Type | Journey |
| Rank | Formidable |
| Initial progress | 0 ticks |

## 10.4 Standard Test Oracle Content

Use only approved or project-original test oracle content in automated tests. If official oracle entries are not approved for the build under test, use placeholder project-original entries with clear `project_original` provenance.

---

# 11. Entry Criteria

A feature is ready for QA when:

| ID | Entry Criterion |
|---|---|
| EC-01 | User story or requirement IDs are linked to the feature. |
| EC-02 | Acceptance criteria are written and testable. |
| EC-03 | Must-have requirements are implemented or documented as not yet ready. |
| EC-04 | Test data or seed data exists where needed. |
| EC-05 | Content-bearing UI has source/provenance assigned. |
| EC-06 | Known limitations are documented. |
| EC-07 | Build is installable/runnable in the agreed test environment. |

---

# 12. Exit Criteria

A feature passes QA when:

| ID | Exit Criterion |
|---|---|
| XC-01 | All Must acceptance criteria for the feature pass. |
| XC-02 | No blocker or critical defects remain open. |
| XC-03 | High defects are fixed or explicitly accepted by the product owner. |
| XC-04 | Regression smoke tests for affected areas pass. |
| XC-05 | Content/licensing checks pass for all content exposed by the feature. |
| XC-06 | Accessibility and responsive checks pass at MVP baseline. |
| XC-07 | The feature does not require out-of-scope MVP capabilities. |

---

# 13. Release Candidate Acceptance Gates

The MVP may be considered release-candidate ready only when all gates below pass or are explicitly waived by the product owner with documented risk.

| Gate | Name | Acceptance Criteria |
|---|---|---|
| GATE-01 | Scope Gate | All Must MVP features are implemented or formally descoped; no excluded feature is required for the MVP flow. |
| GATE-02 | Solo Play Loop Gate | A tester can complete the core solo play loop without external core-tracking tools. |
| GATE-03 | Rules Gate | Action rolls, progress rolls, oracle rolls, matches, progress math, and momentum behavior pass deterministic tests. |
| GATE-04 | Persistence Gate | Character, vow, tracker, oracle/journal outputs, and journal data persist reliably after close/reopen. |
| GATE-05 | UX Gate | First character, first vow, roll, oracle, progress, and journal actions are discoverable without deep navigation. |
| GATE-06 | Accessibility Gate | Keyboard navigation, labels, focus states, and readable layout pass baseline checks. |
| GATE-07 | Content Gate | Content inventory, source categories, attribution, and unofficial disclaimer are present. |
| GATE-08 | Licensing Gate | Unknown/restricted bundled content is absent or blocked; commercial release constraints are enforced. |
| GATE-09 | Data Safety Gate | Destructive actions require confirmation; local storage limitations are clear if applicable. |
| GATE-10 | Known Limitations Gate | Limitations and deferred items are documented for testers/users. |

---

# 14. Global MVP Acceptance Criteria

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-GEN-001 | The app allows a solo player to create or resume a playable Ironsworn session workspace. | Must |
| AC-GEN-002 | The MVP includes the five baseline feature areas: character sheet, move roller, momentum/progress trackers, oracle tables, and vow journal. | Must |
| AC-GEN-003 | The app supports a basic play loop: review state, roll, interpret result, update progress/state, consult oracle, write journal note. | Must |
| AC-GEN-004 | The app preserves player interpretation and does not require AI or automated story generation. | Must |
| AC-GEN-005 | The app saves and restores user-created play data during normal use. | Must |
| AC-GEN-006 | The app clearly distinguishes approved bundled content from user-authored content where relevant. | Must |
| AC-GEN-007 | The app does not require maps, live multiplayer, marketplace, monetization, native apps, or a full rules compendium for MVP acceptance. | Must |
| AC-GEN-008 | Known limitations are documented in the release candidate. | Must |

---

# 15. Feature-Level Acceptance Criteria

## 15.1 Character Sheet

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-CHAR-001 | A user can create a new character from an empty state. | Must |
| AC-CHAR-002 | A user can enter and edit name, concept, Edge, Heart, Iron, Shadow, and Wits. | Must |
| AC-CHAR-003 | A user can track Health, Spirit, and Supply from 0 to 5. | Must |
| AC-CHAR-004 | A user can track current Momentum, Momentum Max, and Momentum Reset. | Must |
| AC-CHAR-005 | The app prevents normal momentum controls from going below -6 or above current max momentum. | Must |
| AC-CHAR-006 | A user can mark and unmark MVP debilities. | Must |
| AC-CHAR-007 | If derived momentum values are implemented, debility changes update or prompt update of Momentum Max and Momentum Reset. | Should |
| AC-CHAR-008 | A user can record bonds, experience, asset references, equipment, and character notes if implemented for MVP. | Should |
| AC-CHAR-009 | A user can reopen the app and see the same character values after save/reload. | Must |
| AC-CHAR-010 | Character deletion or archival requires explicit confirmation. | Should |

## 15.2 Move Roller

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-ROLL-001 | A user can make an action roll using one d6 action die and two d10 challenge dice. | Must |
| AC-ROLL-002 | A user can select a stat or enter a stat value and add modifiers. | Must |
| AC-ROLL-003 | The app calculates and displays action score, including cap at 10. | Must |
| AC-ROLL-004 | The app classifies action roll results as strong hit, weak hit, or miss using strict greater-than comparison. | Must |
| AC-ROLL-005 | Ties favor challenge dice. | Must |
| AC-ROLL-006 | The app detects challenge-dice matches. | Must |
| AC-ROLL-007 | The app applies negative momentum cancellation for action rolls when applicable. | Must |
| AC-ROLL-008 | The app offers momentum burn only when eligible and never burns automatically. | Must |
| AC-ROLL-009 | When the user confirms momentum burn, eligible challenge dice are canceled and momentum resets. | Must |
| AC-ROLL-010 | A user can make a progress roll using challenge dice against filled progress boxes, with momentum ignored. | Must |
| AC-ROLL-011 | A user can make a d100 oracle roll. | Must |
| AC-ROLL-012 | Roll results show enough detail for verification: dice, inputs, score/result, match status, and burn details if applicable. | Must |
| AC-ROLL-013 | The app does not automatically apply full move consequences or write narrative outcomes. | Must |

## 15.3 Momentum and Progress Trackers

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-TRK-001 | A user can create, edit, archive/delete, and view progress tracks. | Must |
| AC-TRK-002 | Progress tracks support vow, journey, combat, bond, and custom types where exposed. | Must |
| AC-TRK-003 | A standard progress track displays 10 boxes and supports partial ticks. | Must |
| AC-TRK-004 | A user can manually add and remove ticks or boxes. | Must |
| AC-TRK-005 | A user can assign rank: troublesome, dangerous, formidable, extreme, or epic. | Must |
| AC-TRK-006 | Rank-based mark-progress helpers apply the correct tick/box amount if implemented. | Should |
| AC-TRK-007 | Progress score for progress rolls counts only fully filled boxes. | Must |
| AC-TRK-008 | Progress changes can include optional notes if implemented. | Should |
| AC-TRK-009 | Track state persists after save/reload. | Must |

## 15.4 Oracle Tables

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-ORC-001 | A user can make a yes/no oracle roll with selectable odds if approved content is included. | Must |
| AC-ORC-002 | A user can roll a d100 oracle result from 1 to 100. | Must |
| AC-ORC-003 | A user can browse approved oracle tables. | Must |
| AC-ORC-004 | A table roll displays the result range and prompt/result for approved content. | Must |
| AC-ORC-005 | Oracle results show source/provenance where relevant. | Must |
| AC-ORC-006 | A user can save or copy oracle results to the journal if implemented. | Should |
| AC-ORC-007 | If no approved oracle tables are available, the app displays a clear empty-state explanation. | Must |
| AC-ORC-008 | The app does not present generated/custom/user-authored oracle text as official content. | Must |

## 15.5 Vow Journal

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-VOW-001 | A user can create a vow with title, description, and rank. | Must |
| AC-VOW-002 | A vow has a status such as active, fulfilled, forsaken, or archived. | Must |
| AC-VOW-003 | A vow has or links to a vow progress track. | Must |
| AC-VOW-004 | A user can mark vow progress. | Must |
| AC-VOW-005 | A user can add milestone notes with date/time or session context. | Must |
| AC-VOW-006 | A user can mark a vow fulfilled or forsaken and record outcome notes. | Must |
| AC-VOW-007 | Background vow and inciting incident markers are supported if implemented. | Should |
| AC-VOW-008 | Vow and milestone data persist after save/reload. | Must |

## 15.6 Session Journal and Roll History

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-JRN-001 | A user can create a freeform session journal entry. | Must |
| AC-JRN-002 | A user can edit saved journal entries. | Must |
| AC-JRN-003 | Journal entries are shown in a usable chronological or reverse-chronological order. | Should |
| AC-JRN-004 | A journal entry can link to a vow, progress track, roll, or oracle result if implemented. | Should |
| AC-JRN-005 | Roll/oracle outputs can be saved into the journal if implemented. | Should |
| AC-JRN-006 | Journal entries persist after save/reload. | Must |

## 15.7 Persistence and Data Management

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-DATA-001 | Character data is saved and restored during normal close/reopen. | Must |
| AC-DATA-002 | Vows and progress tracks are saved and restored. | Must |
| AC-DATA-003 | Journal entries are saved and restored. | Must |
| AC-DATA-004 | Roll/oracle history is saved and restored if persistent history is implemented. | Should |
| AC-DATA-005 | The app has a defined persistence approach before implementation is considered complete. | Must |
| AC-DATA-006 | If local-first, the app communicates browser/device storage limitations. | Should |
| AC-DATA-007 | Destructive actions require confirmation. | Should |
| AC-DATA-008 | Export includes schema version and created/exported timestamps if export is implemented. | Should |

## 15.8 Onboarding and Navigation

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-ONB-001 | A new user can identify how to create a first character. | Must |
| AC-ONB-002 | A new user can identify how to create or add a vow. | Should |
| AC-ONB-003 | A new user can find roll, oracle, track, and journal functions without deep navigation. | Should |
| AC-ONB-004 | Starting value hints are available if onboarding helpers are implemented. | Should |
| AC-ONB-005 | Returning users can resume the last campaign/session state. | Should |

## 15.9 UX / Accessibility / Responsive Behavior

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-UX-001 | Core flows are usable at desktop width. | Must |
| AC-UX-002 | Core flows are usable at mobile width. | Should |
| AC-UX-003 | Keyboard users can reach and operate core controls. | Should |
| AC-UX-004 | Form fields and controls have meaningful labels. | Should |
| AC-UX-005 | Focus state is visible for keyboard navigation. | Should |
| AC-UX-006 | Error, empty, and confirmation states are clear. | Must |
| AC-UX-007 | The app avoids deep navigation for common session actions. | Must |

## 15.10 Content and Licensing

| ID | Acceptance Criterion | Priority |
|---|---|---|
| AC-LIC-001 | Every bundled official or third-party content item has source, license, and approval status in the content inventory. | Must |
| AC-LIC-002 | Bundled content uses allowed source categories and does not ship `unknown` or `restricted` content. | Must |
| AC-LIC-003 | Official/SRD/custom/user-authored provenance is visible internally and where relevant in the UI. | Must |
| AC-LIC-004 | Attribution and license notices are present before external testing or public release. | Must |
| AC-LIC-005 | The app includes an unofficial-product disclaimer. | Must |
| AC-LIC-006 | Rulebook artwork, official icons, official page layout, and trade dress are not reused unless separately cleared. | Must |
| AC-LIC-007 | No monetization, ads, paid access, subscriptions, or gated content are present before commercial-compatible content review. | Must |
| AC-LIC-008 | Release mode gates block incompatible content for public free, commercial, and open-source releases. | Must |

---

# 16. Detailed Acceptance Test Scenarios

## 16.1 Character Sheet Scenarios

### AC-TC-CHAR-001: Create First Character

**Priority:** Must  
**Covers:** AC-CHAR-001 to AC-CHAR-004, AC-DATA-001

**Given** a new user opens the app with no saved character  
**When** they create a character named "Asha Test-Bearer" with standard stats and starting tracks  
**Then** the character is created  
**And** the character sheet displays name, stats, Health, Spirit, Supply, Momentum, Momentum Max, and Momentum Reset.

### AC-TC-CHAR-002: Edit and Reload Character

**Priority:** Must  
**Covers:** AC-CHAR-002 to AC-CHAR-009, AC-DATA-001

**Given** an existing saved character  
**When** the user changes Health to 4, Spirit to 3, Supply to 2, Momentum to 5, and adds a character note  
**And** the user closes and reopens the app  
**Then** all changed values and notes are restored.

### AC-TC-CHAR-003: Momentum Bounds

**Priority:** Must  
**Covers:** AC-CHAR-005

**Given** a character with Momentum Max 10  
**When** the user tries to increase Momentum above 10 using normal controls  
**Then** the app prevents or corrects the value to 10  
**And** when the user tries to reduce Momentum below -6  
**Then** the app prevents or corrects the value to -6.

### AC-TC-CHAR-004: Debility Toggle and Derived Momentum

**Priority:** Should  
**Covers:** AC-CHAR-006, AC-CHAR-007

**Given** a character has no debilities and derived momentum is enabled  
**When** the user marks one debility  
**Then** Momentum Max becomes or is suggested as 9  
**And** Momentum Reset becomes or is suggested as 1  
**When** the user marks a second debility  
**Then** Momentum Max becomes or is suggested as 8  
**And** Momentum Reset becomes or is suggested as 0.

---

## 16.2 Move Roller Scenarios

### AC-TC-ROLL-001: Strong Hit Action Roll

**Priority:** Must  
**Covers:** AC-ROLL-001 to AC-ROLL-004

**Given** deterministic dice are set to action die 5 and challenge dice 4 and 7  
**And** the selected stat is 2  
**And** adds are 1  
**When** the user makes an action roll  
**Then** the action score is 8  
**And** the result is a strong hit.

### AC-TC-ROLL-002: Weak Hit Action Roll

**Priority:** Must  
**Covers:** AC-ROLL-004

**Given** deterministic dice are set to action die 3 and challenge dice 4 and 8  
**And** the selected stat is 2  
**And** adds are 0  
**When** the user makes an action roll  
**Then** the action score is 5  
**And** the result is a weak hit.

### AC-TC-ROLL-003: Miss Action Roll

**Priority:** Must  
**Covers:** AC-ROLL-004

**Given** deterministic dice are set to action die 2 and challenge dice 5 and 7  
**And** the selected stat is 2  
**And** adds are 0  
**When** the user makes an action roll  
**Then** the action score is 4  
**And** the result is a miss.

### AC-TC-ROLL-004: Tie Favors Challenge Dice

**Priority:** Must  
**Covers:** AC-ROLL-005

**Given** deterministic dice are set to action die 3 and challenge dice 5 and 3  
**And** the selected stat is 2  
**And** adds are 0  
**When** the user makes an action roll  
**Then** the action score is 5  
**And** the action score does not beat challenge die 5  
**And** the result is a weak hit because it beats only challenge die 3.

### AC-TC-ROLL-005: Action Score Cap

**Priority:** Must  
**Covers:** AC-ROLL-003

**Given** deterministic dice are set to action die 6 and challenge dice 8 and 9  
**And** the selected stat is 3  
**And** adds are 3  
**When** the user makes an action roll  
**Then** the raw score is 12  
**And** the final action score is capped at 10  
**And** the result is a strong hit.

### AC-TC-ROLL-006: Challenge Dice Match

**Priority:** Must  
**Covers:** AC-ROLL-006

**Given** deterministic dice are set to action die 4 and challenge dice 7 and 7  
**And** the selected stat is 3  
**When** the user makes an action roll  
**Then** the app flags a challenge-dice match  
**And** the result classification still follows normal comparison.

### AC-TC-ROLL-007: Negative Momentum Cancellation

**Priority:** Must  
**Covers:** AC-ROLL-007

**Given** the character's current Momentum is -4  
**And** deterministic dice are set to action die 4 and challenge dice 3 and 6  
**And** the selected stat is 2  
**And** adds are 0  
**When** the user makes an action roll  
**Then** the action die contribution is canceled  
**And** the final action score is 2  
**And** the app clearly shows that negative momentum changed the score.

### AC-TC-ROLL-008: Momentum Burn Cancels One Challenge Die

**Priority:** Must  
**Covers:** AC-ROLL-008, AC-ROLL-009

**Given** the character's current Momentum is +6  
**And** Momentum Reset is +2  
**And** deterministic dice are set to action die 2 and challenge dice 5 and 8  
**And** the selected stat is 2  
**And** adds are 0  
**When** the user makes an action roll  
**Then** the initial action score is 4  
**And** the initial result is a miss  
**And** the app offers momentum burn because challenge die 5 is lower than Momentum 6  
**When** the user confirms burn  
**Then** challenge die 5 is canceled  
**And** the final result is a weak hit  
**And** current Momentum resets to +2.

### AC-TC-ROLL-009: Momentum Burn Cancels Both Challenge Dice

**Priority:** Must  
**Covers:** AC-ROLL-008, AC-ROLL-009

**Given** the character's current Momentum is +8  
**And** Momentum Reset is +2  
**And** deterministic dice are set to action die 1 and challenge dice 5 and 7  
**And** the selected stat is 2  
**And** adds are 0  
**When** the user makes an action roll  
**And** confirms momentum burn  
**Then** both challenge dice are canceled  
**And** the final result is a strong hit  
**And** current Momentum resets to +2.

### AC-TC-ROLL-010: Momentum Burn Does Not Cancel Equal Challenge Die

**Priority:** Must  
**Covers:** AC-ROLL-008, AC-ROLL-009

**Given** the character's current Momentum is +6  
**And** deterministic dice are set to action die 2 and challenge dice 6 and 8  
**And** the selected stat is 2  
**When** the user makes an action roll  
**Then** challenge die 6 is not eligible for cancellation because it is equal to Momentum 6  
**And** challenge die 8 is not eligible  
**And** the app does not offer momentum burn.

### AC-TC-ROLL-011: Progress Roll Ignores Momentum

**Priority:** Must  
**Covers:** AC-ROLL-010

**Given** a progress track has 6 full boxes and 2 additional ticks  
**And** the character has Momentum +10  
**And** deterministic challenge dice are 5 and 7  
**When** the user makes a progress roll  
**Then** the progress score is 6  
**And** the partial ticks do not count  
**And** momentum burn is not available  
**And** the result is a weak hit.

### AC-TC-ROLL-012: Oracle d100 Roll Range

**Priority:** Must  
**Covers:** AC-ROLL-011, AC-ORC-002

**Given** the user opens the oracle roller  
**When** the user rolls a d100 oracle result repeatedly or uses deterministic values  
**Then** every result is an integer from 1 through 100  
**And** a percentile equivalent of 00 is displayed and stored consistently as 100.

---

## 16.3 Progress Track Scenarios

### AC-TC-TRK-001: Create Progress Track

**Priority:** Must  
**Covers:** AC-TRK-001 to AC-TRK-005

**Given** a user is on the Tracks screen  
**When** they create a Journey track named "Journey to Frostwood" with rank Formidable  
**Then** the track is created  
**And** it displays 10 boxes  
**And** the rank is shown as Formidable.

### AC-TC-TRK-002: Add and Remove Ticks

**Priority:** Must  
**Covers:** AC-TRK-003, AC-TRK-004

**Given** an active progress track with 0 ticks  
**When** the user adds 5 ticks  
**Then** the track displays 1 full box and 1 partial tick  
**When** the user removes 1 tick  
**Then** the track displays exactly 1 full box.

### AC-TC-TRK-003: Progress Score Counts Full Boxes Only

**Priority:** Must  
**Covers:** AC-TRK-007

**Given** a progress track has 26 ticks  
**When** the app calculates progress score  
**Then** the progress score is 6  
**And** the remaining 2 ticks do not count toward the progress roll score.

### AC-TC-TRK-004: Rank-Based Mark Progress Helper

**Priority:** Should  
**Covers:** AC-TRK-006

**Given** rank-based helpers are implemented  
**When** the user chooses "mark progress" for each rank  
**Then** Troublesome adds 12 ticks  
**And** Dangerous adds 8 ticks  
**And** Formidable adds 4 ticks  
**And** Extreme adds 2 ticks  
**And** Epic adds 1 tick.

---

## 16.4 Oracle Scenarios

### AC-TC-ORC-001: Yes/No Oracle Result

**Priority:** Must if yes/no oracle is included  
**Covers:** AC-ORC-001

**Given** the user opens the yes/no oracle  
**When** they choose 50/50 odds  
**And** the deterministic d100 result is 51  
**Then** the answer is Yes  
**And** the result can be interpreted manually by the user.

### AC-TC-ORC-002: Oracle Table Roll with Approved Content

**Priority:** Must  
**Covers:** AC-ORC-003 to AC-ORC-005

**Given** at least one approved oracle table is available  
**When** the user selects that table and rolls d100  
**Then** the app displays the matching range and result prompt  
**And** the oracle table source/provenance is visible.

### AC-TC-ORC-003: No Approved Oracle Tables Empty State

**Priority:** Must  
**Covers:** AC-ORC-007

**Given** no approved oracle tables are bundled in the build  
**When** the user opens Oracle Tables  
**Then** the app displays an empty-state explanation  
**And** the app does not display unapproved official oracle content.

### AC-TC-ORC-004: Save Oracle Result to Journal

**Priority:** Should  
**Covers:** AC-ORC-006, AC-JRN-005

**Given** the user has rolled an oracle result  
**When** they select Save to Journal  
**Then** a journal entry or journal link is created  
**And** the saved entry includes the oracle result, date/time, and source/provenance where relevant.

---

## 16.5 Vow Journal Scenarios

### AC-TC-VOW-001: Create Vow

**Priority:** Must  
**Covers:** AC-VOW-001 to AC-VOW-003

**Given** a user is on Play, Tracks, or Journal  
**When** they create a vow titled "Find the Lost Caravan" with rank Dangerous  
**Then** the vow is saved as active  
**And** it has or links to a Dangerous vow progress track.

### AC-TC-VOW-002: Add Milestone and Progress

**Priority:** Must  
**Covers:** AC-VOW-004, AC-VOW-005

**Given** an active vow exists  
**When** the user adds a milestone note "Found the first broken wheel"  
**And** marks progress  
**Then** the milestone is saved with date/time or session context  
**And** the vow progress track is updated.

### AC-TC-VOW-003: Fulfill or Forsake Vow

**Priority:** Must  
**Covers:** AC-VOW-006

**Given** an active vow exists  
**When** the user marks it fulfilled or forsaken  
**Then** the app requests outcome notes or confirmation  
**And** the vow status changes  
**And** the outcome note is saved.

---

## 16.6 Journal Scenarios

### AC-TC-JRN-001: Create and Edit Journal Entry

**Priority:** Must  
**Covers:** AC-JRN-001, AC-JRN-002, AC-JRN-006

**Given** a user is in an active session  
**When** they create a journal note  
**And** later edit the note  
**And** close and reopen the app  
**Then** the edited journal entry is restored.

### AC-TC-JRN-002: Journal Entry Linked to Vow

**Priority:** Should  
**Covers:** AC-JRN-004

**Given** a vow exists  
**When** the user creates a journal entry and links it to that vow  
**Then** the vow detail view shows or can access the linked journal entry.

---

## 16.7 Persistence Scenarios

### AC-TC-DATA-001: Close and Reopen App

**Priority:** Must  
**Covers:** AC-DATA-001 to AC-DATA-003

**Given** a user has created a character, vow, progress track, and journal entry  
**When** they close and reopen the app  
**Then** the app restores the same character, vow, progress track, and journal entry.

### AC-TC-DATA-002: Confirm Destructive Action

**Priority:** Should  
**Covers:** AC-DATA-007

**Given** a user has a saved character or vow  
**When** they select delete/archive  
**Then** the app requires confirmation  
**And** canceling the confirmation leaves the record unchanged.

### AC-TC-DATA-003: JSON Export

**Priority:** Should if export is implemented  
**Covers:** AC-DATA-008

**Given** export is implemented  
**When** the user exports their workspace  
**Then** the export includes app name, schema version, exported timestamp, workspace/campaign data, user-created characters, vows, progress tracks, and journal entries  
**And** official content is included only if licensing review approves it.

---

## 16.8 UX and Onboarding Scenarios

### AC-TC-UX-001: First Launch Empty State

**Priority:** Must  
**Covers:** AC-ONB-001, AC-UX-006

**Given** a new user opens the app  
**When** no saved data exists  
**Then** the app shows a clear Create Character action  
**And** the user is not dropped into an empty dashboard without guidance.

### AC-TC-UX-002: Resume Session Dashboard

**Priority:** Should  
**Covers:** AC-ONB-005, AC-UX-007

**Given** saved data exists  
**When** the user opens the app  
**Then** the app resumes or clearly offers to resume the last campaign/session  
**And** active character state, vows/tracks, and journal context are visible or one interaction away.

### AC-TC-UX-003: Mobile Core Flow

**Priority:** Should  
**Covers:** AC-UX-002

**Given** the app is opened at mobile width  
**When** the user creates a journal entry, makes an action roll, and marks progress  
**Then** all controls remain reachable and readable  
**And** no core action requires horizontal scrolling.

---

## 16.9 Content and Licensing Scenarios

### AC-TC-LIC-001: Content Inventory Completeness

**Priority:** Must  
**Covers:** AC-LIC-001 to AC-LIC-003

**Given** a release candidate build contains bundled move, oracle, asset, help, label, or third-party content  
**When** the content inventory is reviewed  
**Then** every bundled content item has source category, source title, author/source, license, approval status, and release compatibility  
**And** no bundled content has unresolved `unknown` or `restricted` status.

### AC-TC-LIC-002: Attribution and Disclaimer

**Priority:** Must  
**Covers:** AC-LIC-004, AC-LIC-005

**Given** the app is prepared for external testing or public release  
**When** the reviewer opens the About/Legal area  
**Then** required attribution and license notices are present  
**And** an unofficial-product disclaimer is visible.

### AC-TC-LIC-003: No Unapproved Official Visual Assets

**Priority:** Must  
**Covers:** AC-LIC-006

**Given** the release candidate UI is reviewed  
**When** screenshots, icons, images, textures, and branding are inspected  
**Then** the app does not reuse rulebook artwork, official icons, official page layout, or trade dress unless separately cleared and documented.

### AC-TC-LIC-004: No Monetization Before Approval

**Priority:** Must  
**Covers:** AC-LIC-007

**Given** commercial-compatible content review is incomplete  
**When** the app is reviewed  
**Then** there are no payments, subscriptions, ads, paid unlocks, gated content, sponsorship-driven screens, or commercial marketplace flows.

---

# 17. Rules Engine Test Matrix

| Test ID | Inputs | Expected Result | Priority |
|---|---|---|---|
| RUT-DICE-001 | Roll d6 1,000 times or inject values 1-6 | All generated values are integers 1-6; all injected valid values accepted. | Must |
| RUT-DICE-002 | Roll challenge dice 1,000 times or inject values 1-10 | All generated values are integers 1-10; invalid manual values rejected if manual entry exists. | Must |
| RUT-DICE-003 | Roll d100 1,000 times or inject values 1-100 | All generated values are integers 1-100; 00 equivalent handled as 100. | Must |
| RUT-ACT-001 | Score 8 vs challenge 4,7 | Strong hit. | Must |
| RUT-ACT-002 | Score 5 vs challenge 4,8 | Weak hit. | Must |
| RUT-ACT-003 | Score 4 vs challenge 5,7 | Miss. | Must |
| RUT-ACT-004 | Score 5 vs challenge 5,3 | Weak hit; tie does not beat 5. | Must |
| RUT-ACT-005 | Raw score 12 | Final action score 10. | Must |
| RUT-ACT-006 | Challenge dice 7,7 | Match true. | Must |
| RUT-MOM-001 | Momentum -4, action die 4, stat 2 | Action die canceled; score uses stat/add only. | Must |
| RUT-MOM-002 | Momentum -4, action die 3 | No cancellation. | Must |
| RUT-MOM-003 | Momentum +6, challenge 5,8 | Burn can cancel 5 only. | Must |
| RUT-MOM-004 | Momentum +6, challenge 6,8 | Burn cannot cancel equal or higher dice. | Must |
| RUT-MOM-005 | Momentum +8, challenge 5,7 | Burn can cancel both dice; final strong hit. | Must |
| RUT-MOM-006 | Burn confirmed, reset +2 | Current momentum becomes +2. | Must |
| RUT-PROG-001 | Track ticks 26 | Progress score 6. | Must |
| RUT-PROG-002 | Progress score 6 vs challenge 5,7 | Weak hit. | Must |
| RUT-PROG-003 | Progress roll with momentum +10 | Momentum ignored; burn unavailable. | Must |
| RUT-ORC-001 | Yes/no likely odds, d100 26 | Yes if approved odds table is implemented. | Must if included |
| RUT-ORC-002 | Yes/no likely odds, d100 25 | No if approved odds table is implemented. | Must if included |
| RUT-VAL-001 | Add ticks above 40 | Track clamps at 40 or rejects with clear validation. | Must |
| RUT-VAL-002 | Momentum below -6 through normal controls | Rejected/clamped; user informed where appropriate. | Must |
| RUT-HIST-001 | Completed roll saved | Saved roll record preserves dice, inputs, initial result, final result, match, and burn details if any. | Should |

---

# 18. Persistence and Data Safety Test Matrix

| Test ID | Scenario | Expected Result | Priority |
|---|---|---|---|
| DST-001 | Save character and reload | Same character values restored. | Must |
| DST-002 | Save vow and reload | Same vow, rank, status, progress, and milestones restored. | Must |
| DST-003 | Save progress track and reload | Same track type, rank, ticks, status, and notes restored. | Must |
| DST-004 | Save journal and reload | Same note content and links restored. | Must |
| DST-005 | Save roll/oracle to journal and reload | Saved summary remains linked or visible. | Should |
| DST-006 | Browser refresh during editing | Data is preserved if autosave exists, or unsaved-change warning appears if manual save exists. | Must |
| DST-007 | Local-first storage warning | User is informed data is device/browser-local and may need export/backup. | Should if local-first |
| DST-008 | Delete character/vow/track | Confirmation required; cancel preserves record. | Should |
| DST-009 | Archive record | Archived record is hidden from active view but recoverable if archive exists. | Should |
| DST-010 | Export JSON | Includes schema version, exportedAt, workspace, campaign, user-created data, and allowed content metadata. | Should if export exists |

---

# 19. UX, Accessibility, and Responsive Test Matrix

| Test ID | Scenario | Expected Result | Priority |
|---|---|---|---|
| UAT-UX-001 | First launch | Clear Create Character action visible. | Must |
| UAT-UX-002 | Return user launch | Resume path or Play dashboard visible. | Should |
| UAT-UX-003 | Make action roll | Form fits in compact panel/modal; result details visible. | Must |
| UAT-UX-004 | Momentum burn prompt | Burn requires explicit user action and explains eligible dice. | Must |
| UAT-UX-005 | Progress roll | UI displays progress score and makes clear momentum is ignored. | Must |
| UAT-UX-006 | Oracle result | Copy/save actions visible where implemented; provenance visible. | Should |
| UAT-UX-007 | Journal note | Entry can be created quickly without complex categorization. | Must |
| UAT-A11Y-001 | Keyboard navigation | User can tab through and activate main controls. | Should |
| UAT-A11Y-002 | Focus state | Visible focus indicator appears on interactive controls. | Should |
| UAT-A11Y-003 | Labels | Inputs and controls have meaningful labels. | Should |
| UAT-A11Y-004 | Error states | Invalid inputs show understandable messages. | Must |
| UAT-RESP-001 | Desktop width | Three-zone or equivalent layout usable. | Must |
| UAT-RESP-002 | Tablet width | Navigation and primary actions remain usable. | Should |
| UAT-RESP-003 | Mobile width | Core flows do not require horizontal scrolling. | Should |

---

# 20. Content and Licensing Test Matrix

| Test ID | Scenario | Expected Result | Priority |
|---|---|---|---|
| CLT-001 | Content inventory review | All bundled official/third-party content has source, license, author, source date/version, and approval status. | Must |
| CLT-002 | Source category review | No bundled content is `unknown` or `restricted` in release candidate. | Must |
| CLT-003 | Provenance UI | Oracle tables and asset/reference areas show official/SRD/custom/user-authored source where relevant. | Must |
| CLT-004 | Attribution screen | Required attribution, license names, and source notes are present. | Must |
| CLT-005 | Unofficial disclaimer | App states it is not official or endorsed by Tomkin Press. | Must |
| CLT-006 | Visual asset review | No unapproved rulebook artwork, official icons, sheet layout, page textures, or trade dress. | Must |
| CLT-007 | Full rulebook replacement check | App does not include extensive copied book sections or unapproved full move/asset text. | Must |
| CLT-008 | Oracle data review | Each bundled oracle table and row has approval or is project-original. | Must if oracles bundled |
| CLT-009 | Export content review | Export does not redistribute unapproved official content text. | Should if export exists |
| CLT-010 | Monetization review | No ads, payments, subscriptions, paid gates, or sponsorship placements before commercial-compatible review. | Must |
| CLT-011 | Public release gate | Public free release has content + legal review where required. | Must before public release |
| CLT-012 | Commercial release gate | Commercial release uses commercial-compatible content or has separate permission/legal approval. | Must before commercial release |

---

# 21. Regression and Smoke Test Set

Run this set before every release candidate and after changes to core mechanics, storage, or navigation.

| ID | Smoke Test | Expected Result |
|---|---|---|
| SMK-001 | Open app with no data | Welcome/create character path appears. |
| SMK-002 | Create character | Character appears with entered stats/tracks. |
| SMK-003 | Save/reload character | Character persists. |
| SMK-004 | Make strong-hit action roll using deterministic dice | Correct result shown. |
| SMK-005 | Make weak-hit action roll using deterministic dice | Correct result shown. |
| SMK-006 | Make miss action roll using deterministic dice | Correct result shown. |
| SMK-007 | Detect match | Match indicator shown. |
| SMK-008 | Burn momentum when eligible | Final result changes correctly and momentum resets. |
| SMK-009 | Create vow | Vow appears with rank and progress. |
| SMK-010 | Mark progress | Track ticks/boxes update. |
| SMK-011 | Make progress roll | Score uses full boxes only and ignores momentum. |
| SMK-012 | Roll oracle d100 | Result is 1-100. |
| SMK-013 | Create journal entry | Entry saves and displays. |
| SMK-014 | Save roll/oracle to journal if implemented | Saved entry/link appears. |
| SMK-015 | Reload all data | Character, vow, track, and journal persist. |
| SMK-016 | Open About/Legal | Attribution/disclaimer present. |
| SMK-017 | Content release check | No unknown/restricted bundled content. |

---

# 22. Playtest / UAT Plan

## 22.1 Goal

Validate whether the MVP is useful for a real solo Ironsworn session and whether the app reduces friction compared to using a rulebook, spreadsheet, dice roller, and separate notes.

## 22.2 Participants

Recommended initial closed playtest:

| Group | Count | Notes |
|---|---:|---|
| Product owner / internal tester | 1-2 | Validate expected flow and acceptance criteria. |
| Experienced Ironsworn solo player | 2-3 | Validate rules expectations and play speed. |
| New or low-experience Ironsworn player | 1-2 | Validate onboarding and discoverability. |

## 22.3 Playtest Script

Each tester should attempt:

1. Open the app as a new user.
2. Create a character.
3. Add a background or active vow.
4. Make at least three action rolls.
5. Burn momentum once if eligible, or use deterministic/manual test mode if available.
6. Create at least one progress track and mark progress.
7. Make one progress roll.
8. Roll or browse one oracle result.
9. Save a roll or oracle result to the journal if supported.
10. Add at least two freeform journal entries.
11. Close and reopen the app.
12. Confirm that state is restored.
13. Note any moment where the app slowed play or forced an unwanted interpretation.

## 22.4 Playtest Success Questions

| Question | Success Signal |
|---|---|
| Could the tester complete a basic solo play loop? | Yes without external core tracking tools. |
| Did the app reduce bookkeeping? | Tester reports less friction than separate tools. |
| Were rolls understandable? | Tester can explain strong/weak/miss, match, and burn result. |
| Was journaling fast enough? | Tester records notes without disrupting play. |
| Was content provenance/disclaimer visible enough? | Tester/reviewer can find About/Legal and source labels. |
| Did the app preserve fiction-first play? | Tester does not feel the app wrote the story for them. |
| Was any excluded feature required? | No. |

## 22.5 UAT Exit Criteria

| ID | Criterion |
|---|---|
| UAT-XC-001 | At least one complete solo playtest session passes the full script. |
| UAT-XC-002 | No blocker/critical defects remain. |
| UAT-XC-003 | Rules-engine test failures are fixed or release-blocking. |
| UAT-XC-004 | Data loss issues are fixed before external playtest. |
| UAT-XC-005 | Content/licensing gates pass before external distribution. |
| UAT-XC-006 | Product owner accepts known limitations. |

---

# 23. Defect Severity and Triage

| Severity | Definition | Examples | Release impact |
|---|---|---|---|
| Blocker | Prevents app from running or blocks all core play. | App cannot load; character cannot be created; data cannot save at all. | Must fix before QA/playtest continues. |
| Critical | Breaks a Must feature or risks data/licensing failure. | Wrong action-roll classification; journal data loss; unapproved official content in release build. | Must fix before release candidate. |
| High | Major usability or workflow failure with workaround. | Momentum burn prompt incorrect but manual correction possible; mobile flow unusable for one major feature. | Fix or product-owner waiver required. |
| Medium | Noticeable issue that does not block core MVP. | Confusing empty state; minor layout issue; non-critical validation message. | Fix if time allows; document if deferred. |
| Low | Cosmetic or minor polish issue. | Minor spacing issue; non-blocking text inconsistency. | Can defer. |

## 23.1 Triage Priorities

1. Data loss and persistence defects.
2. Rules calculation defects.
3. Licensing/content release defects.
4. Core flow blockers.
5. Accessibility barriers.
6. Usability friction.
7. Cosmetic polish.

---

# 24. Traceability Matrix

| Source area | Acceptance / test coverage |
|---|---|
| MVP baseline features | AC-GEN-002; feature sections 15.1 to 15.5; smoke tests SMK-002 to SMK-014. |
| Solo-first play loop | AC-GEN-001, AC-GEN-003; AC-TC-UX-001; Playtest Script. |
| Character Sheet | AC-CHAR series; AC-TC-CHAR series; DST-001. |
| Move Roller | AC-ROLL series; AC-TC-ROLL series; RUT-ACT and RUT-MOM tests. |
| Momentum / Progress Trackers | AC-TRK series; AC-TC-TRK series; RUT-PROG tests. |
| Oracle Tables | AC-ORC series; AC-TC-ORC series; RUT-ORC tests; CLT-008. |
| Vow Journal | AC-VOW series; AC-TC-VOW series; DST-002. |
| Session Journal | AC-JRN series; AC-TC-JRN series; DST-004 and DST-005. |
| Persistence / Data Model | AC-DATA series; DST matrix; GATE-04 and GATE-09. |
| UX Flow / Wireframes | AC-ONB and AC-UX series; UAT-UX and UAT-RESP matrices. |
| Rules Engine | RUT matrix; GATE-03; AC-TC-ROLL series. |
| Content & Licensing | AC-LIC series; CLT matrix; GATE-07 and GATE-08. |
| MVP exclusions | AC-GEN-007; GATE-01; Out of Scope section. |
| Playtest validation | Playtest / UAT Plan; UAT exit criteria. |

---

# 25. Open Questions

| ID | Question | Owner | Impact |
|---|---|---|---|
| OQ-001 | Will MVP persistence be local-first, account-based, server-backed, or hybrid/local-first with export? | Product / Architecture | Affects persistence, privacy, and multi-device tests. |
| OQ-002 | Will manual dice entry be included in MVP? | Product | Affects test cases for physical dice users and validation. |
| OQ-003 | Will roll history persist across sessions or remain current-session only? | Product / Data | Affects persistence scope and journal linkage tests. |
| OQ-004 | Which oracle tables are approved for MVP release? | Content reviewer | Affects oracle test fixtures and content gates. |
| OQ-005 | Which move names or summaries are approved for display? | Content reviewer | Affects move roller labels and help text testing. |
| OQ-006 | Will JSON export be included in MVP v0.1 or deferred? | Product | Affects data safety and release readiness. |
| OQ-007 | What exact browser/device support is required for the first closed playtest? | Product / QA | Affects test environment coverage. |
| OQ-008 | What is the minimum accessibility target for public release? | Product / UX | Affects accessibility acceptance threshold. |
| OQ-009 | Who signs off on content/legal review before public release? | Product | Affects release gate ownership. |

---

# 26. Approval

| Role | Name | Decision | Date | Notes |
|---|---|---|---|---|
| Product Owner | TBD | Pending | TBD |  |
| Developer Lead | TBD | Pending | TBD |  |
| QA / Tester | TBD | Pending | TBD |  |
| UX Reviewer | TBD | Pending | TBD |  |
| Content / Licensing Reviewer | TBD | Pending | TBD |  |
| Legal Reviewer, if needed | TBD | Pending | TBD |  |

---

# Appendix A: Minimal Release Candidate Checklist

Use this short checklist when preparing an MVP release candidate.

- [ ] All Must MVP features are implemented or formally descoped.
- [ ] Character creation, editing, and reload pass.
- [ ] Vow creation, progress, milestone, and outcome flows pass.
- [ ] Action roll deterministic tests pass.
- [ ] Progress roll deterministic tests pass.
- [ ] Oracle roll tests pass.
- [ ] Momentum burn and negative momentum tests pass.
- [ ] Journal create/edit/reload tests pass.
- [ ] Core flows pass at desktop width.
- [ ] Core flows pass at mobile width or mobile limitation is documented.
- [ ] No blocker/critical defects remain.
- [ ] Content inventory is complete.
- [ ] Attribution and unofficial disclaimer are present.
- [ ] No unknown/restricted bundled content ships.
- [ ] No monetization exists unless commercial-compatible content review is complete.
- [ ] Known limitations are documented.
- [ ] Product owner approves release candidate.

---

# Appendix B: Suggested Automated Test Tags

| Tag | Use |
|---|---|
| `unit:rules` | Dice, action roll, progress roll, momentum, oracle calculations. |
| `unit:domain` | Entity validation, progress ticks, source categories, export shape. |
| `component:character` | Character sheet controls and validation. |
| `component:roll` | Roll panel and result display. |
| `component:track` | Progress track display and editing. |
| `component:oracle` | Oracle table browse and result display. |
| `component:journal` | Journal editor and links. |
| `integration:persistence` | Save/reload and data lifecycle. |
| `integration:journal-link` | Roll/oracle/vow saved to journal. |
| `e2e:play-loop` | Full solo play loop. |
| `review:licensing` | Content inventory, attribution, disclaimers. |
| `a11y:baseline` | Keyboard, labels, focus, responsive checks. |
