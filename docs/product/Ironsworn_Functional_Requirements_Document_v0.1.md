# Functional Requirements Document

## Ironsworn Digital Companion

*Version 0.1 | Draft | Prepared for the Ironsworn Project*

| Field | Value |
|---|---|
| Document owner | Product Owner / Project Lead |
| Related documents | Business Requirements Document v0.1; MVP Scope Document v0.1; future PRD; future Rules Engine Requirements; future Data Model / Domain Model Specification; future UX Flow / Wireframe Requirements; future Acceptance Criteria / Test Plan |
| Product scope | Solo-first Ironsworn digital companion MVP |
| MVP baseline | Character sheet, move roller, momentum/progress trackers, oracle tables, vow journal |
| Intended audience | Product owner, developer, UX designer, QA/tester, content/licensing reviewer |
| Status | Draft for review |

---

# Contents

1. Purpose
2. Source Basis
3. Product Context
4. Functional Scope
5. Users and Permissions
6. Functional Assumptions
7. Priority Definitions
8. Functional Requirement Summary
9. Detailed Functional Requirements
   - Character Sheet
   - Move Roller
   - Momentum and Progress Trackers
   - Oracle Tables
   - Vow Journal
   - Session Journal and Roll History
   - Persistence and Data Management
   - Onboarding and Workspace Navigation
   - Content Provenance and Licensing Support
   - Import / Export
10. Cross-Feature Behavior
11. MVP Exclusions
12. Traceability Matrix
13. Acceptance Criteria Summary
14. Open Questions
15. Approval

---

# 1. Purpose

This Functional Requirements Document defines what the Ironsworn Digital Companion MVP must do from the user's perspective. It translates the approved business direction and MVP scope into testable functional requirements for design, implementation, QA, and content review.

The document focuses on observable product behavior. It does not define the final technical architecture, database schema, UI wireframes, infrastructure, or complete rules-engine algorithms. Those details should be covered in supporting technical and UX documents.

The MVP is a lightweight companion for Ironsworn play. It should help a solo-first player manage character state, rolls, momentum, progress, oracle prompts, vows, and journal notes without replacing the tabletop roleplaying experience or the player's interpretation of the fiction.

---

# 2. Source Basis

This document is based on:

- The Ironsworn Digital Companion Business Requirements Document v0.1.
- The Ironsworn Digital Companion MVP Scope Document v0.1.
- The Ironsworn Rulebook by Shawn Tomkin.
- The agreed MVP baseline: character sheet, move roller, momentum/progress trackers, oracle tables, and vow journal.

Important content note: Ironsworn text is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International. The MVP must maintain content provenance and must not proceed to public or commercial release without content and licensing review.

---

# 3. Product Context

The Ironsworn Digital Companion is intended to reduce bookkeeping and reference friction during play. A user should be able to open the app, create or resume a character, see the current state of play, make rolls, consult approved oracle content, update progress, and record what happened.

The MVP is solo-first. Co-op and guided play are future considerations, but the data and workflows should not permanently block later support for multiple characters, campaigns, or shared progress.

The app is a companion, not a replacement for the game. It should assist with dice, tracking, and notes while preserving fiction-first play and user interpretation.

---

# 4. Functional Scope

## 4.1 In Scope for MVP

| Area | In-scope behavior |
|---|---|
| Character Sheet | Create, edit, save, and resume a character with core sheet state. |
| Move Roller | Resolve action rolls, progress rolls, oracle rolls, result classification, matches, and momentum burn workflow. |
| Momentum / Progress Trackers | Track momentum, max/reset values, debility effects, vow progress, journey/combat/custom progress, and bond progress. |
| Oracle Tables | Roll yes/no oracle and approved d100 tables; browse approved tables; save outputs to notes where supported. |
| Vow Journal | Create vows, assign ranks, mark progress, log milestones, track status, and record outcomes. |
| Journal | Capture session notes and optionally save roll/oracle outputs. |
| Persistence | Save and restore character, vows, tracks, journal entries, and relevant session state. |
| Onboarding | Provide a basic path to first character and first vow creation. |
| Content Provenance | Identify official, SRD-derived, original, user-authored, and future custom content. |

## 4.2 Out of Scope for MVP

| Area | Excluded behavior |
|---|---|
| Full VTT | Maps, tokens, tactical boards, fog of war, scene boards. |
| Multiplayer | Real-time shared campaigns, invitations, live co-op sync. |
| AI | AI GM, AI oracle interpretation, AI-authored session prose, automated story generation. |
| Marketplace | Paid content, asset store, community content marketplace. |
| Full Rules Compendium | Complete rulebook replacement or extensive copied rulebook prose. |
| Full Asset Automation | Official asset database with automated effects for every asset. |
| Native Apps | iOS/Android app store release. |
| Monetization | Payments, subscriptions, ads, or gated content before licensing approval. |

---

# 5. Users and Permissions

## 5.1 MVP User Types

| User Type | MVP Role | Permission Summary |
|---|---|---|
| Solo Player | Primary user | Create, edit, save, and delete their own local/account data. |
| New Player | Primary/secondary user | Use onboarding, starting value helpers, and simplified workspace flows. |
| Product Owner / Tester | Review role outside product auth | Validate flows, requirements coverage, and acceptance criteria. |
| Content/Licensing Reviewer | Review role outside product auth | Verify content source, attribution, and permitted use. |

## 5.2 Permission Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| PERM-01 | The MVP shall allow a single user to manage their own character, vow, track, oracle, and journal data. | Must | The user can create, edit, and save all MVP data without needing another user role. |
| PERM-02 | The MVP shall not require administrative roles for normal solo play. | Must | All core MVP play actions are available to the player. |
| PERM-03 | If accounts are implemented, the MVP shall restrict user-created data to the owning authenticated user. | Must if account-based | One user cannot access another user's private character or journal data. |
| PERM-04 | If local-only persistence is implemented, the MVP shall clearly indicate that data is stored locally on the user's device/browser. | Should if local-first | The user can understand the storage limitation before relying on it for campaign notes. |

---

# 6. Functional Assumptions

| ID | Assumption |
|---|---|
| FA-01 | The first MVP will be a responsive web application unless changed by the PRD. |
| FA-02 | The MVP is optimized for one player managing one active solo session. |
| FA-03 | Users are expected to own or access the Ironsworn rules separately; the app does not need to reproduce the full rulebook. |
| FA-04 | Official content inclusion is limited to content approved by the content/licensing reviewer. |
| FA-05 | Rules automation should support user decisions, not fully automate narrative consequences. |
| FA-06 | Exact data storage method is unresolved and must be finalized in architecture/data-model work. |
| FA-07 | Asset handling in MVP is lightweight unless licensing and scope decisions approve structured asset content. |

---

# 7. Priority Definitions

| Priority | Meaning |
|---|---|
| Must | Required for MVP release candidate unless explicitly descoped by product decision. |
| Should | Important for usability or quality, but the MVP can still be validated without it if deferred. |
| Could | Useful enhancement if time allows. |
| Won't | Explicitly excluded from MVP v0.1. |

---

# 8. Functional Requirement Summary

| Feature Area | Requirement IDs | MVP Priority |
|---|---|---|
| Character Sheet | CHAR-01 to CHAR-24 | Must / Should |
| Move Roller | ROLL-01 to ROLL-29 | Must / Should |
| Momentum and Progress Trackers | TRK-01 to TRK-30 | Must / Should |
| Oracle Tables | ORC-01 to ORC-18 | Must / Should |
| Vow Journal | VOW-01 to VOW-23 | Must / Should |
| Session Journal and Roll History | JRN-01 to JRN-17 | Must / Should |
| Persistence and Data Management | DATA-01 to DATA-18 | Must / Should |
| Onboarding and Workspace Navigation | ONB-01 to ONB-13 | Should / Could |
| Content Provenance and Licensing Support | LIC-01 to LIC-13 | Must / Should |
| Import / Export | EXP-01 to EXP-08 | Could / Should before public release |

---

# 9. Detailed Functional Requirements

## 9.1 Character Sheet

### Goal

Allow the user to create, view, edit, save, and resume a digital Ironsworn character with the core state needed for MVP solo play.

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CHAR-01 | The system shall allow the user to create a new character. | Must | A user can start from an empty state and save a new character record. |
| CHAR-02 | The system shall allow the user to enter and edit character name. | Must | Character name can be created, changed, saved, and displayed. |
| CHAR-03 | The system shall allow the user to enter and edit a short character concept or description. | Should | Character description persists after save/reopen. |
| CHAR-04 | The system shall support the five core stats: Edge, Heart, Iron, Shadow, and Wits. | Must | Each stat is visible and editable. |
| CHAR-05 | The system shall allow stat values from 0 to 5 for flexibility, while providing MVP guidance for the standard starting distribution. | Should | User can enter normal starting values and is not blocked if using a variant. |
| CHAR-06 | The system should provide a helper to assign the standard starting stat distribution of 3, 2, 2, 1, 1. | Should | User can quickly apply or reference standard starting values. |
| CHAR-07 | The system shall support Health as an editable status track from 0 to 5. | Must | User can increase/decrease Health within allowed range. |
| CHAR-08 | The system shall support Spirit as an editable status track from 0 to 5. | Must | User can increase/decrease Spirit within allowed range. |
| CHAR-09 | The system shall support Supply as an editable status track from 0 to 5. | Must | User can increase/decrease Supply within allowed range. |
| CHAR-10 | The system shall support current Momentum as an editable value from -6 to the character's current max momentum. | Must | User can adjust momentum and the app prevents values below -6 or above max. |
| CHAR-11 | The system shall support Max Momentum as a visible and editable value. | Must | Max Momentum is shown and can be manually corrected if needed. |
| CHAR-12 | The system shall support Momentum Reset as a visible and editable value. | Must | Reset value is shown and can be manually corrected if needed. |
| CHAR-13 | The system shall support standard debility categories: conditions, banes, and burdens. | Must | User can mark and unmark debilities. |
| CHAR-14 | The system shall include MVP debility labels for Wounded, Shaken, Unprepared, Encumbered, Maimed, Corrupted, Cursed, and Tormented if approved by licensing review. | Must | All MVP debilities are selectable or represented without relying on external notes. |
| CHAR-15 | The system should automatically recalculate Max Momentum and Momentum Reset based on marked debilities, while allowing manual override. | Should | Marking a debility updates derived values or clearly prompts the user to update them. |
| CHAR-16 | The system shall support Bonds as a progress-style tracker or as editable bond progress plus notes. | Must | User can mark bond progress and record bond-related notes. |
| CHAR-17 | The system shall allow the user to record up to three starting/background bonds during character setup. | Should | User can enter starting bonds and see them in the character sheet. |
| CHAR-18 | The system shall support Experience as an editable numeric or tick-based field. | Should | User can record earned and spent experience. |
| CHAR-19 | The system shall allow the user to record asset references as simple text entries or lightweight structured records. | Should | User can list selected assets without requiring full official asset-card automation. |
| CHAR-20 | The system shall allow the user to mark whether an asset reference is user-entered, official reference, or custom/future content. | Should | Asset entries show source/provenance when applicable. |
| CHAR-21 | The system shall allow the user to record important equipment and freeform character notes. | Should | Equipment/notes persist after save/reopen. |
| CHAR-22 | The system shall allow character edits without forcing a strict linear character creation process. | Must | User can return to any character field and update it. |
| CHAR-23 | The system shall allow the user to delete or archive a character only after confirmation. | Should | Deleting/archiving requires an explicit confirmation action. |
| CHAR-24 | The system shall clearly show unsaved changes or automatically save changes according to the chosen persistence design. | Must | User is not left uncertain whether character changes were saved. |

### Notes

- Automated asset effects are outside MVP unless separately approved.
- Exact data types and validation rules belong in the Data Model / Domain Model Specification.

---

## 9.2 Move Roller

### Goal

Allow the user to resolve the main Ironsworn roll types quickly and consistently: action rolls, progress rolls, and oracle rolls.

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| ROLL-01 | The system shall provide an action roll function. | Must | User can initiate an action roll from the roll workspace. |
| ROLL-02 | The action roll shall generate one d6 action die and two d10 challenge dice. | Must | Roll output displays action die and both challenge dice. |
| ROLL-03 | The action roll shall allow the user to select a stat or enter a stat value. | Must | User can roll using Edge, Heart, Iron, Shadow, Wits, or manual value. |
| ROLL-04 | The action roll shall allow the user to enter adds or bonuses. | Must | User can enter a positive, zero, or negative add value before rolling. |
| ROLL-05 | The system shall calculate action score as action die plus selected stat/value plus adds, subject to the action score cap. | Must | Output displays the computed action score. |
| ROLL-06 | The system shall cap action score at 10. | Must | Action score above 10 is displayed/resolved as 10. |
| ROLL-07 | The system shall classify action roll results as strong hit, weak hit, or miss by comparing action score to each challenge die. | Must | Result classification matches the dice comparison. |
| ROLL-08 | The system shall treat ties as favoring the challenge dice. | Must | An action score equal to a challenge die does not beat that die. |
| ROLL-09 | The system shall detect challenge-dice matches on action rolls. | Must | Matching challenge dice are flagged as a match. |
| ROLL-10 | The system shall display a match prompt that indicates a possible twist, complication, or opportunity without writing the fiction for the user. | Should | User sees a match indicator and interpretation reminder. |
| ROLL-11 | The system shall support negative momentum cancellation when current momentum is negative and its absolute value matches the action die. | Must | The action die is excluded from action score when negative momentum applies. |
| ROLL-12 | The system shall clearly display when negative momentum changed the action score. | Must | User can see that the action die was canceled. |
| ROLL-13 | The system shall identify when positive momentum burn is available after an action roll. | Must | If current momentum can cancel at least one challenge die, the user is offered the option to burn. |
| ROLL-14 | The system shall not burn momentum automatically. | Must | User must explicitly choose to burn momentum. |
| ROLL-15 | When the user burns momentum, the system shall cancel challenge dice lower than current momentum and recalculate the result. | Must | Result changes only according to eligible canceled challenge dice. |
| ROLL-16 | The system shall use strict comparison for momentum burn eligibility: challenge dice lower than current momentum may be canceled. | Must | Challenge dice equal to momentum are not canceled. |
| ROLL-17 | After burning momentum, the system shall reset current momentum to the character's current Momentum Reset value. | Must | Momentum updates after burn confirmation. |
| ROLL-18 | The system shall support progress rolls. | Must | User can initiate a progress roll from a progress track or roll workspace. |
| ROLL-19 | A progress roll shall roll only two d10 challenge dice and compare them against the selected progress score. | Must | No d6 action die is rolled for progress rolls. |
| ROLL-20 | A progress roll shall ignore momentum and shall not allow momentum burn. | Must | Momentum controls are disabled or absent for progress rolls. |
| ROLL-21 | A progress roll shall classify the result as strong hit, weak hit, or miss. | Must | Classification follows progress score versus challenge dice. |
| ROLL-22 | A progress roll shall detect challenge-dice matches. | Must | Matching challenge dice are flagged. |
| ROLL-23 | The system shall support a d100 oracle roll. | Must | User can generate a value from 1 to 100 or equivalent 00 handling. |
| ROLL-24 | The system shall support yes/no oracle odds if approved content is included. | Must | User can select odds and receive yes/no result plus match indicator if applicable. |
| ROLL-25 | The system should allow manual dice entry for users who roll physical dice. | Could | User can input dice values and receive the same result classification. |
| ROLL-26 | The system should allow the user to associate a roll with a move name or custom label. | Should | Roll history can show what the roll was for. |
| ROLL-27 | The system should allow the user to save a roll result to the journal. | Should | Roll output can be converted into a journal entry or attached to one. |
| ROLL-28 | The system should keep a current-session roll history. | Should | User can view recent rolls during the session. |
| ROLL-29 | The system shall preserve user interpretation by displaying mechanical results without forcing narrative consequences. | Must | Results show dice/outcome and optional prompts, not automated story narration. |

### Notes

- Exact dice algorithms and edge cases should be finalized in the Rules Engine Requirements document.
- Full automated move consequence handling is outside MVP.

---

## 9.3 Momentum and Progress Trackers

### Goal

Provide reliable visual and editable tracking for momentum and progress-based Ironsworn challenges.

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| TRK-01 | The system shall display current momentum in the main play workspace or character summary. | Must | User can see current momentum without opening a deep settings screen. |
| TRK-02 | The system shall allow manual momentum increase and decrease. | Must | User can adjust momentum after move outcomes. |
| TRK-03 | The system shall prevent momentum from dropping below -6. | Must | Attempting to reduce below -6 is blocked or prompts an appropriate rules reminder. |
| TRK-04 | The system shall prevent momentum from exceeding current Max Momentum. | Must | Attempting to raise above max is blocked or corrected. |
| TRK-05 | The system shall display Momentum Reset and Max Momentum values. | Must | User can see both values when managing momentum. |
| TRK-06 | The system should update Momentum Reset and Max Momentum based on debility count. | Should | Derived values update after debility changes. |
| TRK-07 | The system should prompt the user when a momentum loss would occur at minimum momentum. | Should | User is reminded to resolve the setback manually instead of silently ignoring the loss. |
| TRK-08 | The system shall allow the user to create progress tracks. | Must | User can create a new track from the Tracks workspace. |
| TRK-09 | The system shall support progress track types: vow, journey, combat, bond, and custom. | Must | User can distinguish different progress uses. |
| TRK-10 | The system shall allow the user to assign a title/name to each progress track. | Must | Track title is visible and editable. |
| TRK-11 | The system shall allow rank selection for vow, journey, combat, and custom progress tracks. | Must | User can select troublesome, dangerous, formidable, extreme, or epic. |
| TRK-12 | The system shall not require rank for bond progress tracks. | Should | Bond progress can be tracked without rank. |
| TRK-13 | The system shall represent each progress track as 10 progress boxes with 4 ticks per box, or an equivalent clear digital representation. | Must | User can see full boxes and partial ticks. |
| TRK-14 | The system shall allow progress to be edited by ticks. | Must | User can add/remove individual ticks. |
| TRK-15 | The system shall allow progress to be edited by full boxes where appropriate. | Must | User can add/remove full progress boxes. |
| TRK-16 | The system shall calculate progress score from fully filled boxes only for progress rolls. | Must | Partial boxes do not count toward progress score. |
| TRK-17 | The system should provide a mark-progress helper based on rank. | Should | User can apply standard progress per rank without manually counting ticks. |
| TRK-18 | The system shall allow the user to perform a progress roll from a selected progress track. | Must | Progress roll uses selected track's current filled boxes. |
| TRK-19 | The system shall allow progress tracks to be active, completed, failed/forsaken, or archived. | Should | User can change track status and filter inactive tracks. |
| TRK-20 | The system shall allow progress notes for a track. | Should | User can store context for why progress changed. |
| TRK-21 | The system shall allow progress events to be timestamped or ordered. | Should | User can review progress history. |
| TRK-22 | The system shall allow deletion of progress tracks only after confirmation. | Should | User must confirm destructive deletion. |
| TRK-23 | The system shall allow a vow's progress track to appear in both the Vow Journal and the Track workspace. | Must | Vow progress is not duplicated inconsistently. |
| TRK-24 | The system shall support generic journey and combat tracks even when not attached to a vow. | Must | User can create temporary challenge tracks. |
| TRK-25 | The system shall allow the user to clear or reset a progress track after confirmation. | Should | Track reset requires explicit confirmation. |
| TRK-26 | The system should provide a compact summary of active tracks. | Should | User can identify active vows/challenges at a glance. |
| TRK-27 | The system shall preserve manual control and not force automatic progress changes after a roll. | Must | User decides when to mark progress. |
| TRK-28 | The system should support track sorting by type, status, and updated date. | Could | User can organize tracks. |
| TRK-29 | The system shall persist all track state. | Must | Track state remains after close/reopen. |
| TRK-30 | The system should support a shared-supply note or reminder for future co-op compatibility without implementing live co-op. | Could | The data model/UX does not hard-block later shared resource handling. |

---

## 9.4 Oracle Tables

### Goal

Give the user quick access to approved oracle results for solo inspiration, while preserving user interpretation and licensing constraints.

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| ORC-01 | The system shall provide an Oracle workspace. | Must | User can navigate to oracle tools from primary navigation. |
| ORC-02 | The system shall support a yes/no oracle roll with selectable odds if approved. | Must | User can select odds and receive a yes/no result. |
| ORC-03 | The system shall detect matches on oracle rolls when applicable. | Must | Matching oracle dice are flagged as a possible extreme result or twist. |
| ORC-04 | The system shall provide a d100 roll tool independent of any table. | Must | User can roll d100 even when not selecting a table. |
| ORC-05 | The system shall allow browsing of approved oracle tables. | Must | User can view available oracle table names. |
| ORC-06 | The system shall allow rolling on an approved oracle table. | Must | User receives a result matching the rolled range. |
| ORC-07 | The system shall display the roll value, matched result, table name, and source/provenance label. | Must | Oracle result includes enough context to save or audit. |
| ORC-08 | The system shall distinguish official/SRD-derived oracle content from user-authored or custom content. | Must | Source labels are visible to users/reviewers. |
| ORC-09 | The system shall not include unapproved oracle table text or copied rulebook prose. | Must | Content inventory confirms included tables are approved. |
| ORC-10 | The system should allow saving an oracle result to the journal. | Should | User can save result without manual retyping. |
| ORC-11 | The system should allow linking an oracle result to a vow, progress track, or session note. | Should | Saved oracle entries can be associated with context. |
| ORC-12 | The system should allow copying oracle results to clipboard. | Could | User can copy result text. |
| ORC-13 | The system shall avoid generating narrative interpretation automatically. | Must | Oracle output remains a prompt/result for user interpretation. |
| ORC-14 | The system should show a short reminder that oracles are inspiration, not mandatory outcomes. | Should | UI supports fiction-first play. |
| ORC-15 | The system should support search/filter over oracle tables if more than a small set is included. | Could | User can find a table by name or category. |
| ORC-16 | The system shall persist saved oracle results when added to journal/history. | Must | Saved oracle result remains after close/reopen. |
| ORC-17 | The system should support custom oracle tables in the data model, even if the authoring UI is deferred. | Could | Future custom content is not blocked. |
| ORC-18 | The system shall maintain an oracle content inventory for licensing review. | Must | Reviewer can identify each included table's source and license status. |

---

## 9.5 Vow Journal

### Goal

Make vows central to the MVP by allowing users to create, track, progress, and resolve vows with narrative notes.

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| VOW-01 | The system shall allow the user to create a vow. | Must | User can create a vow with at least title and rank. |
| VOW-02 | The system shall allow the user to enter a vow title. | Must | Vow title is visible in the Vow Journal and track summary. |
| VOW-03 | The system shall allow the user to enter a vow description. | Must | Vow description persists after save/reopen. |
| VOW-04 | The system shall allow rank selection for a vow. | Must | User can choose troublesome, dangerous, formidable, extreme, or epic. |
| VOW-05 | The system shall create or associate a progress track for each vow. | Must | Vow includes editable progress. |
| VOW-06 | The system shall allow the user to mark vow progress by ticks or boxes. | Must | User can update vow progress. |
| VOW-07 | The system shall allow the user to mark a vow as background vow. | Should | Background vow marker is visible. |
| VOW-08 | The system shall allow the user to mark a vow as inciting incident vow. | Should | Inciting incident marker is visible. |
| VOW-09 | The system shall allow vow status values: active, fulfilled, forsaken, and archived. | Must | User can update vow status. |
| VOW-10 | The system shall allow the user to add milestone entries to a vow. | Must | Milestone entry can be created and shown under the vow. |
| VOW-11 | A milestone entry shall support date/time, title or short label, and note text. | Must | User can record what happened when progress was marked. |
| VOW-12 | The system should optionally apply progress when adding a milestone. | Should | User can add note and progress in one flow. |
| VOW-13 | The system shall allow the user to record fulfillment notes. | Must | User can mark fulfilled and store outcome notes. |
| VOW-14 | The system shall allow the user to record forsaking notes. | Must | User can mark forsaken and store outcome notes. |
| VOW-15 | The system shall allow the user to perform a progress roll for a vow. | Must | Vow progress roll uses current filled boxes and ignores momentum. |
| VOW-16 | The system should allow the user to save the vow progress roll result to the vow record or journal. | Should | Roll result can be associated with the vow. |
| VOW-17 | The system shall allow multiple active vows. | Must | User can create more than one active vow. |
| VOW-18 | The system shall not require one vow to be resolved before another can be created. | Must | App supports concurrent vows. |
| VOW-19 | The system should show active vows in the main workspace/dashboard. | Should | User can see current vows quickly. |
| VOW-20 | The system should allow vow sorting/filtering by status, rank, or updated date. | Could | User can organize vow list. |
| VOW-21 | The system shall allow deleting a vow only after confirmation. | Should | Destructive action requires explicit confirmation. |
| VOW-22 | The system shall persist vow data, progress, milestones, and notes. | Must | Vow state remains after close/reopen. |
| VOW-23 | The system shall preserve user interpretation and not auto-write vow outcomes. | Must | The user records fulfillment/forsaking details manually. |

---

## 9.6 Session Journal and Roll History

### Goal

Allow the user to record narrative continuity and preserve useful roll/oracle context during solo play.

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| JRN-01 | The system shall provide a Journal workspace. | Must | User can navigate to session notes. |
| JRN-02 | The system shall allow creating freeform journal entries. | Must | User can create and save a text note. |
| JRN-03 | A journal entry shall support title or first-line summary, body text, and created/updated timestamp. | Must | Entry displays enough metadata to review later. |
| JRN-04 | The system should allow linking a journal entry to a vow. | Should | Entry can be associated with a selected vow. |
| JRN-05 | The system should allow linking a journal entry to a progress track. | Should | Entry can be associated with journey/combat/custom track. |
| JRN-06 | The system should allow saving action roll results into the journal. | Should | Roll details can be added to an entry. |
| JRN-07 | The system should allow saving progress roll results into the journal. | Should | Progress roll details can be added to an entry. |
| JRN-08 | The system should allow saving oracle results into the journal. | Should | Oracle output can be added to an entry. |
| JRN-09 | The system should maintain a current-session roll history. | Should | User can see recent rolls without saving every roll as a journal entry. |
| JRN-10 | Roll history entries shall include roll type, dice values, result classification, match status, and timestamp. | Should | History provides enough context to audit recent rolls. |
| JRN-11 | The system should allow converting a roll history item into a journal entry. | Could | User can promote a roll to permanent notes. |
| JRN-12 | The system should allow editing journal entries after creation. | Must | User can correct or expand notes. |
| JRN-13 | The system should allow deleting journal entries only after confirmation. | Should | Destructive deletion requires confirmation. |
| JRN-14 | The system should allow searching journal entries by text. | Could | User can find notes later. |
| JRN-15 | The system should allow filtering journal entries by vow, track, or date. | Could | User can review related notes. |
| JRN-16 | The system shall persist journal entries. | Must | Notes remain after close/reopen. |
| JRN-17 | The system shall not automatically generate narrative journal prose. | Must | User-authored notes remain user-authored. |

---

## 9.7 Persistence and Data Management

### Goal

Prevent loss of user-created character, vow, progress, oracle, and journal data during normal use.

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| DATA-01 | The system shall save character data. | Must | Character state remains after close/reopen. |
| DATA-02 | The system shall save vow data. | Must | Vows, ranks, progress, status, and notes remain after close/reopen. |
| DATA-03 | The system shall save progress track data. | Must | Track type, rank, progress, status, and notes remain after close/reopen. |
| DATA-04 | The system shall save journal entries. | Must | Journal entries remain after close/reopen. |
| DATA-05 | The system shall save saved oracle results when added to journal/history. | Must | Saved oracle context remains after close/reopen. |
| DATA-06 | The system should save current-session roll history if roll history is implemented. | Should | Recent roll history is retained according to chosen session behavior. |
| DATA-07 | The system shall provide clear save behavior: autosave, manual save, or both. | Must | User understands when data is saved. |
| DATA-08 | The system shall protect against accidental destructive deletion through confirmation dialogs. | Should | Delete/clear actions require confirmation. |
| DATA-09 | The system shall handle failed save operations with a visible error message. | Must | User is informed when data could not be saved. |
| DATA-10 | The system shall handle failed load operations with a visible error message and recovery guidance. | Must | User is not left with silent missing data. |
| DATA-11 | The system should maintain created and updated timestamps for primary records. | Should | Character, vow, track, and journal records can show updated date. |
| DATA-12 | The system should preserve stable identifiers for primary records. | Should | Future linking/export/import can reference records safely. |
| DATA-13 | The system shall avoid overwriting user notes without confirmation. | Must | Edits or imports do not silently replace existing notes. |
| DATA-14 | The system should support data backup or export before public release. | Should | User has a path to preserve campaign data outside the app. |
| DATA-15 | The system shall define whether persistence is local-first, account-based, or server-backed before development begins. | Must | Implementation has a documented persistence decision. |
| DATA-16 | The system shall treat user-created journal and campaign data as private application data. | Must | Private notes are not publicly exposed by default. |
| DATA-17 | The system should support migration/versioning strategy for stored data if the product schema changes. | Should | Future releases can avoid breaking existing data. |
| DATA-18 | The system shall include persistence scenarios in the acceptance test plan. | Must | QA can verify save/reopen and failure scenarios. |

---

## 9.8 Onboarding and Workspace Navigation

### Goal

Help a new or returning user quickly reach the core solo play loop.

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| ONB-01 | The system should provide a first-use empty state that directs the user to create a character. | Should | New user can identify first action. |
| ONB-02 | The system should provide starting value hints during character creation. | Should | User can identify standard starting tracks and stat distribution. |
| ONB-03 | The system should provide a first-vow prompt or empty state after character creation. | Should | User can identify where to add a vow. |
| ONB-04 | The system should provide primary navigation for Character, Roll, Tracks, Oracles, and Journal. | Should | User can access all MVP areas from top-level navigation. |
| ONB-05 | The system should provide a compact dashboard or summary view for active character, active vows, momentum, and recent notes if UX design supports it. | Could | User can see current play state in one place. |
| ONB-06 | The system shall allow returning users to resume their latest character/session state. | Must | Reopening the app returns user to saved state or a clear selection screen. |
| ONB-07 | The system should display helpful empty states for no vows, no tracks, no journal entries, and no oracle history. | Should | Empty pages provide a clear next action. |
| ONB-08 | The system should avoid blocking users behind mandatory tutorials. | Should | User can skip guidance and use the app directly. |
| ONB-09 | The system should use plain language labels for core actions. | Should | New users can understand create, roll, mark progress, save to journal. |
| ONB-10 | The system shall not present the MVP as a complete rulebook replacement. | Must | UI/legal copy positions the app as a companion. |
| ONB-11 | The system should be responsive enough for desktop and mobile browser use. | Should | Main workflows are usable on common viewport sizes. |
| ONB-12 | The system should support keyboard navigation for core forms and controls. | Should | User can tab through and activate primary controls. |
| ONB-13 | The system should avoid deep navigation for roll, oracle, progress, and journal actions. | Should | Core actions are reachable within one or two interactions from primary workspace. |

---

## 9.9 Content Provenance and Licensing Support

### Goal

Ensure all official or rules-derived content used in the MVP is traceable and reviewable before release.

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| LIC-01 | The system shall maintain a content inventory for official, SRD-derived, original, and user-authored content used in-product. | Must | Reviewer can inspect a list of included content sources. |
| LIC-02 | The system shall display attribution and license notices as required by content review. | Must | App includes visible or accessible attribution. |
| LIC-03 | The system shall not include rulebook artwork unless rights are explicitly cleared. | Must | No unapproved rulebook art is bundled. |
| LIC-04 | The system shall distinguish official/SRD-derived content from user-authored notes. | Must | Content source/provenance is visible or auditable. |
| LIC-05 | The system shall avoid copying extensive rulebook prose unless approved. | Must | Move/oracle text strategy passes licensing review. |
| LIC-06 | The system shall prefer concise original UI wording or approved SRD text for move summaries. | Should | UX copy avoids unnecessary rulebook reproduction. |
| LIC-07 | The system shall allow content reviewers to identify which oracle tables are included. | Must | Oracle content inventory includes table names and sources. |
| LIC-08 | The system shall allow content reviewers to identify which move names/summaries are included. | Must | Move content inventory includes included labels/text. |
| LIC-09 | The system shall not include monetization features before licensing path approval. | Must | No payments, subscriptions, ads, or gated official content in MVP. |
| LIC-10 | The system should include an About / Credits / Licenses view. | Should | User can access product and license information. |
| LIC-11 | The system shall mark user-created notes and custom content as user-authored. | Must | User notes are not confused with official content. |
| LIC-12 | The system should support future replacement or editing of rules/oracle data without code changes. | Should | Content can be updated through data files/configuration. |
| LIC-13 | The system shall block public release until content/licensing review is complete. | Must | Release checklist includes content review gate. |

---

## 9.10 Import / Export

### Goal

Provide or prepare for a way to preserve user-created data outside the application.

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| EXP-01 | The system should define the MVP export decision before release candidate. | Should | Product decision states whether export is included or deferred. |
| EXP-02 | If export is included, the system shall allow exporting user-created character data. | Could | User can download character data. |
| EXP-03 | If export is included, the system shall allow exporting vow and progress data. | Could | User can download vow/track data. |
| EXP-04 | If export is included, the system shall allow exporting journal entries. | Could | User can download session notes. |
| EXP-05 | If export is included, the system should support JSON export for machine-readable backup. | Could | Exported JSON can be inspected and re-imported later. |
| EXP-06 | If export is included, the system should support Markdown export for human-readable notes. | Could | User can download readable journal/vow notes. |
| EXP-07 | If import is included, the system shall prevent imports from silently overwriting existing data. | Could | Import requires confirmation and/or creates separate records. |
| EXP-08 | The system shall not export official licensed content in a way that violates the approved content strategy. | Must if export exists | Exported data respects content/licensing review. |

---

# 10. Cross-Feature Behavior

## 10.1 Save-to-Journal Behavior

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| X-01 | The system should allow action roll results to be saved to the journal. | Should | Saved entry includes dice, result, match status, and optional user note. |
| X-02 | The system should allow progress roll results to be saved to the relevant vow/track journal context. | Should | Saved entry is linked to selected vow/track where applicable. |
| X-03 | The system should allow oracle results to be saved to the journal. | Should | Saved entry includes oracle table/name, roll, result, source label, and note. |
| X-04 | The system should allow milestone creation from a vow progress update. | Should | User can record narrative reason for progress. |
| X-05 | The system shall avoid automatic narrative writing when saving mechanical results. | Must | Saved entries contain mechanics plus user-authored interpretation only. |

## 10.2 Manual Override Behavior

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| X-06 | The system shall allow manual correction of character and tracker values. | Must | User can fix values after house rules, mistakes, or physical play. |
| X-07 | The system should warn but not permanently block non-standard values if variant play is allowed by product decision. | Should | User can use variants without fighting the app. |
| X-08 | The system shall preserve user control over when consequences are applied. | Must | Move outcomes do not automatically reduce health/spirit/supply unless user confirms. |

## 10.3 Future Compatibility

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| X-09 | The MVP data model should not assume only one character can ever exist. | Should | Future multi-character/campaign support is not blocked. |
| X-10 | The MVP data model should not assume all play is permanently solo. | Should | Future co-op/guided extensions are possible. |
| X-11 | The MVP content model should support official, custom, and user-authored content categories. | Should | Future custom oracle/move content is not blocked. |

---

# 11. MVP Exclusions

The following items are explicitly excluded from the Functional Requirements for MVP v0.1:

| ID | Exclusion | Reason |
|---|---|---|
| EX-01 | Full virtual tabletop | Outside companion scope and increases complexity. |
| EX-02 | Real-time multiplayer synchronization | Future feature; MVP is solo-first. |
| EX-03 | AI GM or AI-authored story output | Conflicts with MVP focus and fiction-first interpretation. |
| EX-04 | Full official asset-card automation | Requires larger rules/data/licensing effort. |
| EX-05 | Complete move compendium with copied official prose | Requires content/licensing decision. |
| EX-06 | Full campaign wiki, NPC graph, relationship map, or timeline | Advanced campaign management is post-MVP. |
| EX-07 | Native mobile apps | Responsive web is sufficient for MVP unless changed. |
| EX-08 | Monetization | Blocked until licensing path is approved. |
| EX-09 | Rulebook artwork reuse | Requires explicit rights clearance. |
| EX-10 | Automated application of every move consequence | Too rules-heavy for v0.1 and may undermine player control. |

---

# 12. Traceability Matrix

| MVP / Business Area | Functional Requirements |
|---|---|
| Character Sheet | CHAR-01 to CHAR-24; DATA-01; ONB-01 to ONB-03 |
| Move Roller | ROLL-01 to ROLL-29; JRN-06 to JRN-11 |
| Momentum and Progress Trackers | TRK-01 to TRK-30; ROLL-18 to ROLL-22 |
| Oracle Tables | ORC-01 to ORC-18; LIC-01 to LIC-13 |
| Vow Journal | VOW-01 to VOW-23; JRN-01 to JRN-17 |
| Basic Persistence | DATA-01 to DATA-18 |
| Basic Onboarding | ONB-01 to ONB-13 |
| Licensing / Provenance | LIC-01 to LIC-13; EXP-08 |
| Export Decision | EXP-01 to EXP-08 |
| Fiction-first / Companion Positioning | ROLL-29; ORC-13; VOW-23; JRN-17; ONB-10; X-05; X-08 |

---

# 13. Acceptance Criteria Summary

The Functional Requirements Document is satisfied for MVP release candidate when:

1. A user can create, edit, save, close, reopen, and resume a character with core sheet values.
2. A user can record stats, health, spirit, supply, momentum, debilities, bonds, experience, asset references, and equipment/notes.
3. A user can create and manage vows with rank, progress, milestones, status, and outcome notes.
4. A user can create and manage generic progress tracks for journey, combat, bond, or custom use.
5. A user can perform action rolls with dice display, action score, result classification, match detection, negative momentum handling, and optional momentum burn.
6. A user can perform progress rolls from progress tracks, with momentum ignored.
7. A user can perform d100 oracle rolls and yes/no oracle rolls where approved.
8. A user can browse and roll on approved oracle tables with source/provenance visible.
9. A user can write freeform journal notes and save selected roll/oracle outputs where implemented.
10. The app preserves fiction-first play by supporting interpretation rather than writing automated narrative outcomes.
11. User-created data persists reliably during normal use.
12. Destructive actions require confirmation.
13. Official/SRD-derived content is inventoried, attributed, and reviewable.
14. No excluded MVP feature is required to complete the core solo play loop.

---

# 14. Open Questions

| ID | Question | Owner | Needed By |
|---|---|---|---|
| OQ-FR-01 | Will the MVP use local-only storage, accounts, or server-backed persistence? | Product / Tech | Before implementation |
| OQ-FR-02 | Which exact oracle tables are approved for v0.1? | Product / Licensing | Before oracle implementation |
| OQ-FR-03 | Will move names only be included, or will the MVP include move summaries? | Product / Licensing / UX | Before move roller UX copy |
| OQ-FR-04 | Should negative momentum cancellation be implemented in MVP or deferred to Rules Engine v0.2? | Product / Rules | Before roll implementation |
| OQ-FR-05 | Should asset references be free text only, or lightweight structured records? | Product / UX | Before character sheet implementation |
| OQ-FR-06 | Is export required for MVP release candidate or only before public release? | Product / Tech | Before release plan |
| OQ-FR-07 | Should roll history persist beyond the current session? | Product / UX | Before journal implementation |
| OQ-FR-08 | Should users be allowed to maintain multiple characters in MVP? | Product | Before data model |
| OQ-FR-09 | Will there be a formal campaign object in MVP, or will the first version be character-centered? | Product / Tech | Before data model |
| OQ-FR-10 | What is the approved terminology strategy for official content vs original app wording? | Licensing / UX | Before content entry |
| OQ-FR-11 | Should progress helper buttons auto-apply rank-based progress, or only suggest values? | Product / UX | Before tracker implementation |
| OQ-FR-12 | Should physical/manual dice entry be included in MVP? | Product | Before roll implementation |

---

# 15. Approval

This Functional Requirements Document is approved when the project owner confirms that:

- The listed functional areas match the MVP baseline.
- The Must / Should / Could priorities are acceptable.
- The requirements are detailed enough for UX design, data modeling, rules-engine requirements, and acceptance test planning.
- The exclusions are acceptable for MVP v0.1.
- Open questions are ready for decision in the PRD, Rules Engine Requirements, Data Model Specification, or UX Flow Requirements.

| Role | Name / Signature | Date |
|---|---|---|
| Product Owner |  |  |
| Technical Lead |  |  |
| UX Lead |  |  |
| QA Lead |  |  |
| Content/Licensing Reviewer |  |  |

---

# Appendix A: Requirement ID Prefixes

| Prefix | Area |
|---|---|
| PERM | Users and permissions |
| CHAR | Character sheet |
| ROLL | Move roller and dice resolution |
| TRK | Momentum and progress trackers |
| ORC | Oracle tables |
| VOW | Vow journal |
| JRN | Session journal and roll history |
| DATA | Persistence and data management |
| ONB | Onboarding and workspace navigation |
| LIC | Content provenance and licensing support |
| EXP | Import/export |
| X | Cross-feature behavior |
| EX | Exclusions |
| OQ-FR | Open questions |

# Appendix B: Suggested Next Documents

1. Rules Engine Requirements — exact dice, momentum, progress, move-result, and oracle mechanics.
2. Data Model / Domain Model Specification — character, vow, track, journal, roll, oracle, source/provenance entities.
3. UX Flow / Wireframe Requirements — screen layout and task flows for character creation, rolling, tracking, oracles, and journaling.
4. Content & Licensing Requirements — approved text/data sources, attribution, prohibited content, and release gates.
5. Acceptance Criteria / Test Plan — test cases mapped to requirement IDs.
