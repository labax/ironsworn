# Rules Engine Requirements

## Ironsworn Digital Companion

*Version 0.1 | Draft | Prepared for the Ironsworn Project*

| Field | Value |
|---|---|
| Document owner | Product Owner / Project Lead |
| Related documents | Business Requirements Document v0.1; MVP Scope Document v0.1; Functional Requirements Document v0.1; future Data Model / Domain Model Specification; future UX Flow / Wireframe Requirements; future Acceptance Criteria / Test Plan |
| Product scope | Solo-first Ironsworn digital companion MVP |
| MVP baseline | Character sheet, move roller, momentum/progress trackers, oracle tables, vow journal |
| Intended audience | Product owner, developer, QA/tester, UX designer, content/licensing reviewer |
| Status | Draft for review |

---

# Contents

1. Purpose
2. Source Basis
3. Rules Engine Context
4. Rules Engine Scope
5. Rules Engine Principles
6. Priority Definitions
7. Requirement Summary
8. Detailed Rules Engine Requirements
   - Core Dice Service
   - Action Roll Resolution
   - Momentum Rules
   - Progress Track Rules
   - Progress Roll Resolution
   - Oracle Roll Resolution
   - Move Metadata and Move Resolution Support
   - Character State and Derived Values
   - Asset and Modifier Handling
   - Roll Result Records and History
   - Validation, Error Handling, and Manual Overrides
   - Content Provenance and Licensing Support
9. Calculation Reference
10. MVP Test Cases
11. Traceability Matrix
12. MVP Acceptance Criteria
13. Open Questions
14. Approval

---

# 1. Purpose

This Rules Engine Requirements document defines the deterministic game-mechanics behavior required for the Ironsworn Digital Companion MVP. It specifies how the application should calculate and present dice rolls, action-roll outcomes, progress-roll outcomes, momentum behavior, progress-track state, oracle rolls, rule-adjacent validation, and rules-related history.

The document is narrower than the Functional Requirements Document. It does not define every user-facing screen, database schema, UI layout, persistence architecture, or full content library. It defines the rules logic that the application must implement or deliberately leave under user control.

The MVP rules engine must support a solo-first Ironsworn play loop while preserving fiction-first play. It should calculate mechanical outcomes accurately, explain enough for the user to understand the result, and avoid replacing the player’s interpretation of the story.

---

# 2. Source Basis

This document is based on:

- The Ironsworn Rulebook by Shawn Tomkin.
- The Ironsworn Digital Companion Business Requirements Document v0.1.
- The Ironsworn Digital Companion MVP Scope Document v0.1.
- The Ironsworn Digital Companion Functional Requirements Document v0.1.
- The agreed MVP baseline: character sheet, move roller, momentum/progress trackers, oracle tables, and vow journal.

Important licensing note: official Ironsworn text, move text, oracle tables, labels, and other rules content must be inventoried and reviewed before public release. The rules engine may implement mechanics and original UI wording, but reproduction of official prose and tables must follow the project’s Content & Licensing Requirements.

---

# 3. Rules Engine Context

The Ironsworn Digital Companion is not a full virtual tabletop, automated GM, or rulebook replacement. Its rules engine exists to support the MVP by providing:

- Dice generation and roll classification.
- Momentum calculation and burn support.
- Progress-track calculation and progress-roll support.
- Oracle roll support.
- Basic move metadata support where approved.
- Rules-safe history records that can be saved to journal entries.
- Validation and guardrails for common mistakes.

The engine should support play without forcing automated outcomes. Many Ironsworn consequences are intentionally interpreted by the player, GM, or group. The MVP should expose prompts, reminders, and structured state changes, while leaving narrative decisions and most move consequences under user control.

---

# 4. Rules Engine Scope

## 4.1 In Scope for MVP

| Area | In-scope rules behavior |
|---|---|
| Dice | d6 action die, d10 challenge dice, d100 oracle rolls, optional manual dice entry, testable deterministic dice injection. |
| Action Rolls | Action score calculation, action score cap, challenge dice comparison, strong/weak/miss result classification, tie handling, match detection. |
| Momentum | Momentum range, max/reset values, negative momentum cancellation, optional momentum burn, reset after burn, minimum/max validation. |
| Progress Tracks | 10 boxes, 4 ticks per box, rank-based progress helpers, bond progress, progress score calculation. |
| Progress Rolls | Challenge-dice-only roll against filled progress boxes; momentum ignored; match detection. |
| Oracles | d100 roll, yes/no oracle odds, table range lookup for approved oracle content, match detection where applicable. |
| Moves | Lightweight move metadata and roll type handling; no full automated move library unless content/licensing approves. |
| State Rules | Derived momentum values from debilities; health/spirit/supply limits; user-confirmed state changes. |
| History | Structured roll result records suitable for current-session history and optional journal saving. |
| Provenance | Source/provenance flags for official, SRD-derived, original, user-authored, or custom content. |

## 4.2 Out of Scope for MVP

| Area | Excluded rules behavior |
|---|---|
| Full Move Automation | Automatic application of all move consequences, choices, harm, stress, supply, experience, or debility effects. |
| Full Official Move Library | Complete official move text or complete rulebook reproduction unless licensing review approves it. |
| Full Asset Automation | Automatic asset modifiers, rerolls, companion moves, ritual effects, and conditional asset rules. |
| AI Interpretation | AI-written fiction, AI GM decisions, AI oracle interpretation, automated story consequences. |
| Multiplayer Rules | Real-time shared rolls, co-op turn coordination, shared party state synchronization. |
| Tactical Combat | Grid, map, token, range, initiative board, or enemy AI automation. |
| Full Campaign Engine | World truth automation, NPC relationship graph, quest outline generation, timeline engine. |

---

# 5. Rules Engine Principles

| ID | Principle | Meaning for the engine |
|---|---|---|
| REP-01 | Deterministic calculations | Given the same inputs, every calculation must return the same result. |
| REP-02 | Transparent results | Dice, modifiers, caps, cancellations, and final classification must be visible or inspectable. |
| REP-03 | User-confirmed consequences | The engine should not silently apply major state changes unless the user confirms or the behavior is clearly configured. |
| REP-04 | Fiction-first support | Results should prompt interpretation, not produce mandatory narrative text. |
| REP-05 | Manual override | Users should be able to correct state for house rules, mistakes, physical dice, or variants. |
| REP-06 | Rules-aware, not rules-heavy | Automate high-confidence calculations; defer edge-case narrative judgments to the user. |
| REP-07 | Testability | All rules calculations must be unit-testable without UI dependencies. |
| REP-08 | Extensibility | Rules objects should support later custom moves, custom oracles, assets, and co-op support without redesigning the core engine. |
| REP-09 | Licensing-conscious content | Mechanics may be implemented, but official text and table content must be tracked and approved before release. |

---

# 6. Priority Definitions

| Priority | Meaning |
|---|---|
| Must | Required for MVP release candidate unless explicitly descoped by product decision. |
| Should | Important for MVP quality or usability, but may be deferred if documented. |
| Could | Useful enhancement if time allows. |
| Won’t | Explicitly excluded from MVP v0.1. |

---

# 7. Requirement Summary

| Module | Requirement IDs | MVP Priority |
|---|---|---|
| Core Dice Service | RER-DICE-01 to RER-DICE-14 | Must / Should |
| Action Roll Resolution | RER-ACT-01 to RER-ACT-20 | Must / Should |
| Momentum Rules | RER-MOM-01 to RER-MOM-22 | Must / Should |
| Progress Track Rules | RER-TRK-01 to RER-TRK-24 | Must / Should |
| Progress Roll Resolution | RER-PROG-01 to RER-PROG-12 | Must |
| Oracle Roll Resolution | RER-ORC-01 to RER-ORC-18 | Must / Should |
| Move Metadata and Resolution Support | RER-MOVE-01 to RER-MOVE-18 | Must / Should |
| Character State and Derived Values | RER-CHAR-01 to RER-CHAR-18 | Must / Should |
| Asset and Modifier Handling | RER-ASSET-01 to RER-ASSET-10 | Should / Could |
| Roll Result Records and History | RER-HIST-01 to RER-HIST-14 | Must / Should |
| Validation, Error Handling, and Manual Overrides | RER-VAL-01 to RER-VAL-18 | Must / Should |
| Content Provenance and Licensing Support | RER-LIC-01 to RER-LIC-12 | Must / Should |

---

# 8. Detailed Rules Engine Requirements

## 8.1 Core Dice Service

### Goal

Provide reliable dice generation, manual dice support, and deterministic test hooks for every rules calculation.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-DICE-01 | The engine shall support rolling one six-sided action die with possible values 1 to 6. | Must | Generated action die is always an integer from 1 through 6. |
| RER-DICE-02 | The engine shall support rolling two ten-sided challenge dice with possible values 1 to 10. | Must | Generated challenge dice are always integers from 1 through 10. |
| RER-DICE-03 | The engine shall support rolling two ten-sided oracle dice as a d100 result from 1 to 100. | Must | Oracle result is always an integer from 1 through 100. |
| RER-DICE-04 | The engine shall define how a 00/0 oracle result is represented internally. | Must | A percentile result equivalent to 00 is stored and displayed consistently as 100. |
| RER-DICE-05 | The engine shall expose dice values in each roll result object. | Must | Roll history can show the exact dice rolled. |
| RER-DICE-06 | The engine shall support deterministic dice injection for automated tests. | Must | Unit tests can pass fixed dice values without relying on randomness. |
| RER-DICE-07 | The engine should support manual dice entry for users who roll physical dice. | Should | User-entered dice values resolve with the same rules as generated dice. |
| RER-DICE-08 | The engine shall validate manual action die values. | Must if manual dice is implemented | Values outside 1 to 6 are rejected or corrected with a clear validation message. |
| RER-DICE-09 | The engine shall validate manual challenge die values. | Must if manual dice is implemented | Values outside 1 to 10 are rejected or corrected with a clear validation message. |
| RER-DICE-10 | The engine shall validate manual oracle result values. | Must if manual dice is implemented | Values outside 1 to 100 are rejected or corrected with a clear validation message. |
| RER-DICE-11 | The engine should record whether dice were generated by the app or manually entered. | Should | Roll result record includes `rollSource: generated` or `rollSource: manual`. |
| RER-DICE-12 | The engine shall not reroll dice automatically after displaying a result. | Must | A completed roll remains stable in history unless the user explicitly makes a new roll. |
| RER-DICE-13 | The engine should be isolated from UI rendering. | Should | Dice functions can be tested without loading UI components. |
| RER-DICE-14 | The engine should allow future custom dice adapters without changing existing roll result formats. | Could | A future random provider can be swapped without breaking saved roll records. |

---

## 8.2 Action Roll Resolution

### Goal

Resolve Ironsworn action rolls accurately and transparently.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-ACT-01 | The engine shall support an action roll using one d6 action die and two d10 challenge dice. | Must | Action roll returns action die, two challenge dice, action score, and result classification. |
| RER-ACT-02 | The engine shall accept a selected stat value or manually entered stat value. | Must | Roll can use Edge, Heart, Iron, Shadow, Wits, or a manual value. |
| RER-ACT-03 | The engine shall accept an adds/modifier value. | Must | Adds are included in action score calculation. |
| RER-ACT-04 | The engine shall calculate base action score as action die plus stat plus adds before caps or cancellations. | Must | Calculation details are preserved in the result object. |
| RER-ACT-05 | The engine shall cap final action score at 10. | Must | Any score above 10 is resolved as 10. |
| RER-ACT-06 | The engine shall compare final action score separately against each challenge die. | Must | Result object records whether each challenge die was beaten. |
| RER-ACT-07 | The engine shall use strict greater-than comparison. | Must | Equal action score and challenge die counts as not beating that challenge die. |
| RER-ACT-08 | The engine shall classify a strong hit when the action score beats both challenge dice. | Must | Result classification is `strong_hit`. |
| RER-ACT-09 | The engine shall classify a weak hit when the action score beats exactly one challenge die. | Must | Result classification is `weak_hit`. |
| RER-ACT-10 | The engine shall classify a miss when the action score beats neither challenge die. | Must | Result classification is `miss`. |
| RER-ACT-11 | The engine shall detect challenge dice matches. | Must | Result object includes `isMatch: true` when both challenge dice are equal. |
| RER-ACT-12 | The engine should include a match severity hint based on the roll result and matched value. | Should | UI can show a twist/opportunity reminder on a strong hit match and complication reminder on a miss match. |
| RER-ACT-13 | The engine shall apply negative momentum cancellation before final action score comparison when applicable. | Must | When current momentum is negative and its absolute value equals the action die, the action die contribution is canceled. |
| RER-ACT-14 | The engine shall preserve both pre-cancellation and post-cancellation calculation details. | Must | User can see that negative momentum changed the result. |
| RER-ACT-15 | The engine shall evaluate momentum burn eligibility after the initial action roll result is calculated. | Must | User can be offered burn only after seeing initial result. |
| RER-ACT-16 | The engine shall not burn momentum automatically. | Must | User must explicitly confirm momentum burn. |
| RER-ACT-17 | The engine shall be able to calculate a post-burn action result without mutating state until burn is confirmed. | Must | UI can preview or confirm the changed result safely. |
| RER-ACT-18 | The engine shall preserve initial result and final result when momentum is burned. | Must | Roll history can show initial result and burned result. |
| RER-ACT-19 | The engine should support a move label or custom roll label on an action roll. | Should | Roll history can show what move or action the roll represented. |
| RER-ACT-20 | The engine shall not automatically apply move consequences after classifying the roll. | Must | User remains responsible for choosing and applying consequences. |

---

## 8.3 Momentum Rules

### Goal

Implement Ironsworn momentum behavior for tracking, negative momentum, momentum burn, and derived momentum values.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-MOM-01 | The engine shall support current momentum as a signed integer value. | Must | Momentum can be stored and displayed as negative, zero, or positive. |
| RER-MOM-02 | The engine shall enforce minimum momentum of -6. | Must | Momentum cannot be reduced below -6 through normal controls. |
| RER-MOM-03 | The engine shall support max momentum. | Must | Momentum increase cannot exceed current max momentum through normal controls. |
| RER-MOM-04 | The engine shall support momentum reset value. | Must | Momentum can be reset to the stored reset value after a burn. |
| RER-MOM-05 | The engine shall default new characters to current momentum +2, max momentum +10, and reset +2 unless a variant is selected. | Should | Character creation helper can initialize these values. |
| RER-MOM-06 | The engine shall calculate derived max momentum as 10 minus the count of marked debilities, unless manual override is enabled. | Should | Marking one debility derives max momentum 9; two debilities derives max momentum 8. |
| RER-MOM-07 | The engine shall calculate derived momentum reset as +2 with no debilities, +1 with one debility, and 0 with more than one debility, unless manual override is enabled. | Should | Reset value changes according to debility count. |
| RER-MOM-08 | The engine shall clamp current momentum down to max momentum when max momentum decreases below current momentum. | Should | If current momentum is +10 and max becomes +9, current momentum becomes +9 or user is prompted to confirm. |
| RER-MOM-09 | The engine shall apply negative momentum cancellation during action rolls only. | Must | Negative momentum does not affect progress rolls or oracle rolls. |
| RER-MOM-10 | Negative momentum cancellation shall occur when current momentum is less than 0 and the absolute value of current momentum equals the action die value. | Must | Current momentum -4 and action die 4 cancels the action die. |
| RER-MOM-11 | When negative momentum cancellation applies, the action die contribution shall be treated as 0 for the action score. | Must | Score uses stat plus adds, then cap if needed. |
| RER-MOM-12 | Momentum burn shall be available only when current momentum is positive. | Must | Zero or negative momentum cannot be burned. |
| RER-MOM-13 | Momentum burn shall be available only for action rolls. | Must | Progress and oracle rolls cannot burn momentum. |
| RER-MOM-14 | Momentum burn shall cancel each challenge die that is lower than current momentum. | Must | Challenge die 5 is canceled by momentum 6; challenge die 6 is not canceled by momentum 6. |
| RER-MOM-15 | If momentum burn cancels both challenge dice, the post-burn result shall be a strong hit. | Must | Burned result classification is `strong_hit`. |
| RER-MOM-16 | If momentum burn cancels exactly one challenge die, the remaining challenge die shall determine whether the post-burn result is a weak hit or miss. | Must | If the remaining die is not beaten, result is weak hit; if already beaten, result may become strong hit based on the two comparisons. |
| RER-MOM-17 | Momentum burn shall not change whether the challenge dice are a match. | Must | Match status remains based on original challenge dice. |
| RER-MOM-18 | After confirmed momentum burn, current momentum shall reset to the character’s current momentum reset value. | Must | Momentum state updates after burn confirmation. |
| RER-MOM-19 | The engine should prompt the user when a momentum loss would occur while current momentum is already at minimum. | Should | User receives a reminder to resolve the appropriate setback manually. |
| RER-MOM-20 | The engine shall allow manual momentum adjustments for move outcomes and narrative costs. | Must | User can increase or decrease momentum within min/max limits. |
| RER-MOM-21 | The engine should support a calculation explanation for momentum burn. | Should | Result can show which challenge dice were canceled and why. |
| RER-MOM-22 | The engine shall not automatically decide when the player should burn momentum. | Must | User choice is required. |

---

## 8.4 Progress Track Rules

### Goal

Provide a consistent model for vow, journey, combat, bond, and custom progress tracks.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-TRK-01 | The engine shall represent a standard progress track as 10 boxes. | Must | Each progress track has a maximum of 10 full boxes. |
| RER-TRK-02 | The engine shall represent each progress box as 4 ticks. | Must | A full track contains 40 ticks. |
| RER-TRK-03 | The engine shall store progress internally as ticks or an equivalent precise value. | Must | Partial progress is not lost. |
| RER-TRK-04 | The engine shall support progress track types: vow, journey, combat, bond, and custom. | Must | Track type is stored and available to UI. |
| RER-TRK-05 | The engine shall support challenge ranks for vow, journey, combat, and custom tracks. | Must | Supported ranks are troublesome, dangerous, formidable, extreme, and epic. |
| RER-TRK-06 | The engine shall not require a challenge rank for bond progress tracks. | Should | Bond track can exist without rank. |
| RER-TRK-07 | The engine shall support manual add/remove tick operations. | Must | User can adjust progress one tick at a time. |
| RER-TRK-08 | The engine shall support manual add/remove full-box operations. | Must | User can adjust progress one full box at a time. |
| RER-TRK-09 | The engine shall clamp standard progress track values between 0 and 40 ticks unless a manual override mode is used. | Must | Normal controls cannot set progress below 0 or above 40 ticks. |
| RER-TRK-10 | The engine shall calculate fully filled progress boxes as floor(totalTicks / 4). | Must | 27 ticks produces a progress score of 6, not 6.75 or 7. |
| RER-TRK-11 | The engine shall calculate progress score from fully filled boxes only. | Must | Partial boxes do not count on progress rolls. |
| RER-TRK-12 | The engine should provide a rank-based mark-progress helper. | Should | User can apply the correct tick amount for the track rank. |
| RER-TRK-13 | The rank helper shall add 12 ticks for troublesome challenges. | Should | Troublesome mark progress equals 3 full boxes. |
| RER-TRK-14 | The rank helper shall add 8 ticks for dangerous challenges. | Should | Dangerous mark progress equals 2 full boxes. |
| RER-TRK-15 | The rank helper shall add 4 ticks for formidable challenges. | Should | Formidable mark progress equals 1 full box. |
| RER-TRK-16 | The rank helper shall add 2 ticks for extreme challenges. | Should | Extreme mark progress equals 2 ticks. |
| RER-TRK-17 | The rank helper shall add 1 tick for epic challenges. | Should | Epic mark progress equals 1 tick. |
| RER-TRK-18 | The bond progress helper shall add 1 tick unless a specific move or future rule says otherwise. | Should | Bond mark progress equals 1 tick. |
| RER-TRK-19 | The engine should support a multiplier for harm or repeated progress applications. | Could | Inflicting 2 harm against a dangerous foe may apply the dangerous progress helper twice if user chooses. |
| RER-TRK-20 | The engine shall not automatically mark progress after a successful move unless the user confirms. | Must | Roll classification does not silently change track progress. |
| RER-TRK-21 | The engine shall support track status values: active, completed, failed/forsaken, and archived. | Should | Track status can be stored and filtered. |
| RER-TRK-22 | The engine should support progress event records. | Should | Progress changes can be linked to a timestamp, note, vow, move, or roll. |
| RER-TRK-23 | The engine shall allow a vow to own or reference one progress track. | Must | Vow progress and track progress do not diverge. |
| RER-TRK-24 | The engine should support future shared progress tracks for co-op without requiring MVP synchronization. | Could | Track ownership model does not prevent future multi-character access. |

---

## 8.5 Progress Roll Resolution

### Goal

Resolve progress rolls for vows, journeys, combat, bonds, epilogues, and custom progress moves.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-PROG-01 | The engine shall support a progress roll using two d10 challenge dice. | Must | Progress roll returns two challenge dice and result classification. |
| RER-PROG-02 | The engine shall not roll an action die for progress rolls. | Must | No d6 action die appears in progress roll result. |
| RER-PROG-03 | The engine shall calculate progress score from the selected track’s fully filled boxes. | Must | Progress score equals floor(totalTicks / 4). |
| RER-PROG-04 | The engine shall compare progress score separately against each challenge die. | Must | Result object records whether each die was beaten. |
| RER-PROG-05 | The engine shall use strict greater-than comparison for progress rolls. | Must | Equal progress score and challenge die counts as not beating that die. |
| RER-PROG-06 | The engine shall classify a strong hit when progress score beats both challenge dice. | Must | Result classification is `strong_hit`. |
| RER-PROG-07 | The engine shall classify a weak hit when progress score beats exactly one challenge die. | Must | Result classification is `weak_hit`. |
| RER-PROG-08 | The engine shall classify a miss when progress score beats neither challenge die. | Must | Result classification is `miss`. |
| RER-PROG-09 | The engine shall detect challenge dice matches on progress rolls. | Must | Match flag is true when challenge dice are equal. |
| RER-PROG-10 | The engine shall ignore momentum on progress rolls. | Must | Negative momentum does not cancel anything; positive momentum cannot be burned. |
| RER-PROG-11 | The engine shall preserve the selected track reference in the roll result. | Must | Roll history shows which track was rolled. |
| RER-PROG-12 | The engine shall not automatically resolve vow, journey, combat, or epilogue consequences after a progress roll. | Must | User records the outcome manually. |

---

## 8.6 Oracle Roll Resolution

### Goal

Support oracle rolls, yes/no odds, and approved oracle table lookup without replacing player interpretation.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-ORC-01 | The engine shall support a standalone d100 oracle roll. | Must | User can generate a value from 1 to 100 without choosing a table. |
| RER-ORC-02 | The engine shall support yes/no oracle odds if approved content is included. | Must | User can select an odds category and get yes/no output. |
| RER-ORC-03 | The engine shall support the yes/no odds categories: almost certain, likely, 50/50, unlikely, and small chance if approved. | Must if yes/no oracle is implemented | All odds categories are selectable. |
| RER-ORC-04 | The yes/no oracle shall return yes for almost certain odds on results 11 or greater. | Must if yes/no oracle is implemented | Result 10 returns no; result 11 returns yes. |
| RER-ORC-05 | The yes/no oracle shall return yes for likely odds on results 26 or greater. | Must if yes/no oracle is implemented | Result 25 returns no; result 26 returns yes. |
| RER-ORC-06 | The yes/no oracle shall return yes for 50/50 odds on results 51 or greater. | Must if yes/no oracle is implemented | Result 50 returns no; result 51 returns yes. |
| RER-ORC-07 | The yes/no oracle shall return yes for unlikely odds on results 76 or greater. | Must if yes/no oracle is implemented | Result 75 returns no; result 76 returns yes. |
| RER-ORC-08 | The yes/no oracle shall return yes for small chance odds on results 91 or greater. | Must if yes/no oracle is implemented | Result 90 returns no; result 91 returns yes. |
| RER-ORC-09 | The engine shall detect matches on oracle dice where dice-level data is available. | Must | Oracle result can indicate a matched pair such as 7 and 7. |
| RER-ORC-10 | The engine should display a reminder that an oracle match can indicate an extreme result or twist. | Should | UI can show a non-authoritative interpretation prompt. |
| RER-ORC-11 | The engine shall support rolling on approved oracle tables. | Must | d100 result maps to a table entry by inclusive range. |
| RER-ORC-12 | Oracle table ranges shall be validated for overlap. | Must | Overlapping ranges produce content validation errors. |
| RER-ORC-13 | Oracle table ranges should be validated for coverage according to table configuration. | Should | A full d100 table should cover 1 to 100 unless intentionally partial. |
| RER-ORC-14 | Oracle table lookup shall return roll value, matched range, result label/text, table identifier, and provenance. | Must | Saved oracle result can be audited. |
| RER-ORC-15 | The engine shall distinguish official/SRD-derived oracle content from user-authored or custom content. | Must | Oracle result records include provenance. |
| RER-ORC-16 | The engine shall not automatically write narrative interpretation for oracle results. | Must | Output remains a prompt or answer for user interpretation. |
| RER-ORC-17 | The engine should support custom oracle table data structures even if custom table authoring UI is deferred. | Could | Future custom tables can reuse existing lookup logic. |
| RER-ORC-18 | The engine shall not include unapproved oracle table content. | Must | Content inventory confirms inclusion status before release. |

---

## 8.7 Move Metadata and Move Resolution Support

### Goal

Support a lightweight, rules-aware move roller without requiring full move automation in MVP.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-MOVE-01 | The engine shall support move metadata records. | Must | A move can be represented by ID, name, category, roll type, and source/provenance. |
| RER-MOVE-02 | Move metadata shall support roll types: action, progress, oracle, and no-roll/manual. | Must | The roll workspace can choose the correct resolver. |
| RER-MOVE-03 | Action move metadata should support default stat or selectable stat options where approved. | Should | A move can preselect or suggest a stat without forcing it. |
| RER-MOVE-04 | Move metadata should support user-entered adds. | Should | User can add situational bonuses manually. |
| RER-MOVE-05 | Move metadata should support a short original summary or UI hint where licensing permits. | Should | UI can guide the user without copying unapproved prose. |
| RER-MOVE-06 | Move metadata shall support provenance labels. | Must | Move names/summaries can be traced to official, SRD-derived, original, or user/custom source. |
| RER-MOVE-07 | The engine shall allow a user to make an action roll without selecting an official move. | Must | Custom action labels are allowed. |
| RER-MOVE-08 | The engine shall allow a user to make a progress roll from a progress track without selecting an official progress move. | Must | Custom track progress rolls are supported. |
| RER-MOVE-09 | The engine shall not automatically trigger secondary moves such as consequence moves. | Must | Pay-the-price-style outcomes remain user-driven in MVP. |
| RER-MOVE-10 | The engine shall not automatically choose move outcome options. | Must | User decides which benefit, cost, or consequence applies. |
| RER-MOVE-11 | The engine should support optional user-selected outcome tags. | Could | User can tag a result as “mark progress,” “take momentum,” “suffer harm,” etc. without mandatory automation. |
| RER-MOVE-12 | The engine should support saving selected move outcome notes to the journal. | Should | Roll result can be saved with user notes. |
| RER-MOVE-13 | The engine shall support progress move metadata for vow, journey, combat, and epilogue-type resolutions if approved. | Should | Progress move labels can be associated with a progress roll. |
| RER-MOVE-14 | The engine shall allow future custom moves to use the same roll resolvers. | Could | Custom move metadata can point to action/progress/oracle roll types. |
| RER-MOVE-15 | The engine shall not include full official move text unless approved by content/licensing review. | Must | Content inventory confirms move text usage. |
| RER-MOVE-16 | The engine should support move category labels such as adventure, relationship, combat, suffer, quest, and fate where approved. | Should | Moves can be grouped without requiring full text. |
| RER-MOVE-17 | The engine shall not enforce that a move is fictionally triggered. | Must | The user decides whether fiction triggers a move. |
| RER-MOVE-18 | The engine should provide a “rules reminder only” mode for moves. | Could | UI can show mechanical notes without applying consequences. |

---

## 8.8 Character State and Derived Values

### Goal

Support core character values that interact with rules engine calculations.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-CHAR-01 | The engine shall support five core stats: Edge, Heart, Iron, Shadow, and Wits. | Must | Action roll can select any core stat. |
| RER-CHAR-02 | The engine should provide standard starting stat distribution guidance of 3, 2, 2, 1, 1. | Should | New character helper can validate or suggest standard values. |
| RER-CHAR-03 | The engine shall support Health as a value from 0 to 5. | Must | Health cannot be set outside range through normal controls. |
| RER-CHAR-04 | The engine shall support Spirit as a value from 0 to 5. | Must | Spirit cannot be set outside range through normal controls. |
| RER-CHAR-05 | The engine shall support Supply as a value from 0 to 5. | Must | Supply cannot be set outside range through normal controls. |
| RER-CHAR-06 | The engine shall support debility flags. | Must | Conditions, banes, and burdens can be marked/unmarked. |
| RER-CHAR-07 | The engine shall support Wounded, Shaken, Unprepared, Encumbered, Maimed, Corrupted, Cursed, and Tormented labels if approved. | Must | Debility options are available in character state. |
| RER-CHAR-08 | The engine should derive max momentum and reset momentum from debility count. | Should | Derived values update when debilities change. |
| RER-CHAR-09 | The engine should warn when the user attempts to increase Health while Wounded is marked. | Should | User receives a rule reminder or requires confirmation. |
| RER-CHAR-10 | The engine should warn when the user attempts to increase Spirit while Shaken is marked. | Should | User receives a rule reminder or requires confirmation. |
| RER-CHAR-11 | The engine should warn when the user attempts to increase Supply while Unprepared is marked. | Should | User receives a rule reminder or requires confirmation. |
| RER-CHAR-12 | The engine shall support Experience as an editable value or mark count. | Should | User can record earned/spent experience. |
| RER-CHAR-13 | The engine shall support bond progress using the progress track model. | Must | Bond progress can be rolled if epilogue-style progress is later supported. |
| RER-CHAR-14 | The engine should support multiple vows per character. | Must | Vow-related progress tracks can coexist. |
| RER-CHAR-15 | The engine shall not automatically apply harm, stress, supply loss, debilities, or experience unless user confirms. | Must | Roll result does not silently mutate character state. |
| RER-CHAR-16 | The engine should support state snapshots for undo or audit. | Could | User can recover from accidental rule-state changes. |
| RER-CHAR-17 | The engine shall allow manual correction of character state. | Must | User can fix values after mistakes, house rules, or physical-table play. |
| RER-CHAR-18 | The engine should be compatible with future campaign or multi-character ownership. | Could | Character state is not hard-coded as the only possible root object. |

---

## 8.9 Asset and Modifier Handling

### Goal

Support lightweight asset references and manual modifier input without full asset automation in MVP.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-ASSET-01 | The engine shall allow manual adds/modifiers on action rolls. | Must | User can enter asset, circumstance, or move bonuses manually. |
| RER-ASSET-02 | The engine should allow users to label the source of an add/modifier. | Should | Roll detail can show “+1 asset” or user-entered note. |
| RER-ASSET-03 | The engine shall not automatically apply official asset modifiers in MVP unless separately approved. | Must | Asset text does not silently change rolls. |
| RER-ASSET-04 | The engine should support lightweight asset reference records. | Should | Character can list asset names or references without automation. |
| RER-ASSET-05 | Asset references shall include provenance where applicable. | Should | Official, custom, and user-authored asset references are distinguishable. |
| RER-ASSET-06 | The engine should support future asset effect hooks. | Could | Future automation can attach effects without changing action roll core logic. |
| RER-ASSET-07 | The engine should support future reroll mechanics as a distinct effect type. | Could | Rerolls are not confused with new independent rolls. |
| RER-ASSET-08 | The engine should support future companion health tracking separately from character health. | Could | Companion tracks can be added without changing core track model. |
| RER-ASSET-09 | The engine shall not reproduce full official asset-card text without licensing approval. | Must | Content inventory confirms asset content usage. |
| RER-ASSET-10 | The engine shall leave asset applicability to user judgment in MVP. | Must | User chooses when an asset or equipment affects a roll. |

---

## 8.10 Roll Result Records and History

### Goal

Create structured records for action rolls, progress rolls, oracle rolls, momentum burn, and journal linkage.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-HIST-01 | The engine shall produce a structured result object for every completed roll. | Must | UI and journal can consume the same result object. |
| RER-HIST-02 | A roll result shall include roll type. | Must | Type is action, progress, oracle, or custom/manual. |
| RER-HIST-03 | A roll result shall include timestamp. | Must | Roll history can be ordered. |
| RER-HIST-04 | A roll result shall include dice values. | Must | User can audit the roll. |
| RER-HIST-05 | A roll result shall include calculated scores where applicable. | Must | Action score or progress score is visible. |
| RER-HIST-06 | A roll result shall include result classification where applicable. | Must | Strong hit, weak hit, miss, yes/no, or table result is stored. |
| RER-HIST-07 | A roll result shall include match status where applicable. | Must | Match flag is available for action, progress, and oracle rolls. |
| RER-HIST-08 | A roll result shall include selected stat/adds for action rolls. | Must | Action roll can be reconstructed. |
| RER-HIST-09 | A roll result shall include selected track/progress score for progress rolls. | Must | Progress roll can be reconstructed. |
| RER-HIST-10 | A roll result shall include selected oracle table and matched range for table rolls. | Must | Oracle result can be audited. |
| RER-HIST-11 | A roll result shall preserve initial and post-burn result when momentum is burned. | Must | History shows both the original result and the changed result. |
| RER-HIST-12 | A roll result should include user notes. | Should | User can record interpretation or consequence. |
| RER-HIST-13 | A roll result should be attachable to a journal entry, vow, or progress event. | Should | Saved roll context is not lost. |
| RER-HIST-14 | Current-session roll history should be available even if not all rolls are saved permanently. | Should | User can review recent rolls during a session. |

---

## 8.11 Validation, Error Handling, and Manual Overrides

### Goal

Prevent common rules errors without blocking legitimate house rules, variants, or corrections.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-VAL-01 | The engine shall validate all dice values before calculation. | Must | Invalid values cannot produce a result. |
| RER-VAL-02 | The engine shall validate momentum against minimum and max values. | Must | Normal controls cannot exceed valid momentum bounds. |
| RER-VAL-03 | The engine shall validate progress ticks against track limits. | Must | Normal controls keep progress from 0 to 40 ticks. |
| RER-VAL-04 | The engine shall validate progress rank values. | Must | Invalid ranks are rejected. |
| RER-VAL-05 | The engine shall validate oracle table ranges. | Must | Invalid range definitions are rejected during content loading. |
| RER-VAL-06 | The engine shall fail safely when approved oracle content is unavailable. | Must | User can still use standalone d100 roll or receives a clear unavailable-content message. |
| RER-VAL-07 | The engine shall provide clear error messages for invalid manual input. | Must | User can understand and correct the issue. |
| RER-VAL-08 | The engine should support manual override mode for advanced users or house rules. | Should | User can intentionally bypass a validation after confirmation. |
| RER-VAL-09 | Manual override changes should be marked in history or state metadata. | Should | Later review can distinguish standard-rule changes from overrides. |
| RER-VAL-10 | The engine shall not silently discard partial progress ticks. | Must | Partial ticks persist and display. |
| RER-VAL-11 | The engine shall not silently ignore a failed momentum update. | Must | User is told when momentum is already at minimum or maximum. |
| RER-VAL-12 | The engine should support undo for recent state changes. | Could | Accidental changes can be reverted. |
| RER-VAL-13 | The engine shall keep calculations independent from local language display strings. | Should | Translations or wording changes do not break calculations. |
| RER-VAL-14 | The engine shall use stable internal IDs for ranks, roll types, outcomes, and track types. | Must | Saved records remain valid if display text changes. |
| RER-VAL-15 | The engine shall handle missing character state gracefully. | Must | User can still perform a manual/custom roll if no character is selected, where product UX allows. |
| RER-VAL-16 | The engine shall not require official content to perform core dice calculations. | Must | Action/progress/oracle dice can be rolled with original app wording. |
| RER-VAL-17 | The engine should expose calculation explanations for QA and debugging. | Should | Testers can see why a result was classified. |
| RER-VAL-18 | The engine shall log validation failures in a way suitable for debugging without storing sensitive journal content unnecessarily. | Should | Technical logs avoid private narrative text where possible. |

---

## 8.12 Content Provenance and Licensing Support

### Goal

Ensure that rules-related content used by the engine is traceable and reviewable.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| RER-LIC-01 | The engine shall support provenance metadata for move, oracle, rank, debility, and asset-related content. | Must | Content records can identify their source category. |
| RER-LIC-02 | Provenance values shall include at least official, SRD-derived, original-app-wording, user-authored, and custom/future. | Must | Content inventory can distinguish sources. |
| RER-LIC-03 | The engine shall allow mechanics to be implemented separately from display prose. | Must | Calculation code does not depend on copied rulebook text. |
| RER-LIC-04 | The engine shall not require official move prose to calculate rolls. | Must | User can roll with custom labels and manual inputs. |
| RER-LIC-05 | The engine shall not require official oracle prose to perform standalone d100 rolls. | Must | d100 tool works even if no table content is approved. |
| RER-LIC-06 | The engine shall support content IDs for oracle tables and entries. | Must | Table entries can be audited and updated. |
| RER-LIC-07 | The engine shall support source/version metadata for oracle tables. | Must | A table can identify source and version used. |
| RER-LIC-08 | The engine should support disabling unapproved content at build or runtime. | Should | Public builds can exclude content not cleared for release. |
| RER-LIC-09 | The engine shall not include rulebook artwork or image assets as rules content. | Must | Engine content package contains data only, not copied art. |
| RER-LIC-10 | The engine should support attribution metadata for official/SRD-derived content. | Should | UI/legal page can surface attribution from structured data. |
| RER-LIC-11 | The engine should support content migration if wording or content source changes after review. | Could | Existing user data can keep references even if display content changes. |
| RER-LIC-12 | The engine shall allow users to create their own notes and custom labels without labeling them as official content. | Must | User-authored content is distinct from official/SRD-derived content. |

---

# 9. Calculation Reference

## 9.1 Action Roll Algorithm

Inputs:

- `actionDie`: integer 1 to 6
- `challengeDieA`: integer 1 to 10
- `challengeDieB`: integer 1 to 10
- `stat`: integer, normally selected from character stats or manual value
- `adds`: integer, default 0
- `currentMomentum`: integer, normally -6 to max momentum

Process:

1. Start with `effectiveActionDie = actionDie`.
2. If `currentMomentum < 0` and `abs(currentMomentum) == actionDie`, set `effectiveActionDie = 0` and mark negative momentum cancellation.
3. Calculate `rawActionScore = effectiveActionDie + stat + adds`.
4. Calculate `actionScore = min(rawActionScore, 10)`.
5. Compare `actionScore > challengeDieA` and `actionScore > challengeDieB`.
6. If both comparisons are true, result is `strong_hit`.
7. If exactly one comparison is true, result is `weak_hit`.
8. If neither comparison is true, result is `miss`.
9. Set `isMatch = challengeDieA == challengeDieB`.
10. Evaluate momentum burn eligibility if `currentMomentum > 0` and at least one challenge die is lower than `currentMomentum`.

## 9.2 Momentum Burn Algorithm

Inputs:

- Completed action roll result.
- `currentMomentum > 0`.
- User confirmation to burn momentum.

Process:

1. Determine whether `challengeDieA < currentMomentum`.
2. Determine whether `challengeDieB < currentMomentum`.
3. Canceled challenge dice count as beaten for final classification.
4. Challenge dice not canceled retain their original comparison against the action score.
5. Reclassify result using the combination of canceled/beaten dice.
6. Preserve initial result, final result, canceled dice, and match status.
7. Set current momentum to the character’s momentum reset value.

## 9.3 Progress Track Calculation

Inputs:

- `totalTicks`: integer 0 to 40.

Process:

1. `filledBoxes = floor(totalTicks / 4)`.
2. `partialTicks = totalTicks % 4`.
3. `progressScore = filledBoxes`.
4. Use `progressScore` for progress rolls.

## 9.4 Rank-Based Mark Progress Helper

| Rank | Helper amount | Tick equivalent |
|---|---:|---:|
| Troublesome | 3 progress boxes | 12 ticks |
| Dangerous | 2 progress boxes | 8 ticks |
| Formidable | 1 progress box | 4 ticks |
| Extreme | 2 ticks | 2 ticks |
| Epic | 1 tick | 1 tick |
| Bond progress | 1 tick unless otherwise specified | 1 tick |

## 9.5 Progress Roll Algorithm

Inputs:

- `progressScore`: integer 0 to 10
- `challengeDieA`: integer 1 to 10
- `challengeDieB`: integer 1 to 10

Process:

1. Compare `progressScore > challengeDieA` and `progressScore > challengeDieB`.
2. If both comparisons are true, result is `strong_hit`.
3. If exactly one comparison is true, result is `weak_hit`.
4. If neither comparison is true, result is `miss`.
5. Set `isMatch = challengeDieA == challengeDieB`.
6. Ignore momentum entirely.

## 9.6 Yes/No Oracle Algorithm

Inputs:

- `oracleResult`: integer 1 to 100
- `odds`: one of almost certain, likely, 50/50, unlikely, small chance

Process:

| Odds | Yes threshold |
|---|---:|
| Almost certain | 11 or greater |
| Likely | 26 or greater |
| 50/50 | 51 or greater |
| Unlikely | 76 or greater |
| Small chance | 91 or greater |

Return `yes` if `oracleResult >= threshold`, otherwise `no`. If oracle dice are available and form a match, set `isMatch = true`.

---

# 10. MVP Test Cases

| ID | Requirement Area | Given | When | Then |
|---|---|---|---|---|
| TC-RER-001 | Action Roll | Action die 4, stat 2, adds 1, challenge dice 3 and 8 | Resolve action roll | Action score is 7; result is weak hit. |
| TC-RER-002 | Strong Hit | Action die 5, stat 3, adds 0, challenge dice 4 and 7 | Resolve action roll | Action score is 8; result is strong hit. |
| TC-RER-003 | Tie Handling | Action die 3, stat 2, adds 0, challenge dice 5 and 7 | Resolve action roll | Action score is 5; tie does not beat 5; result is miss. |
| TC-RER-004 | Action Score Cap | Action die 6, stat 3, adds 3, challenge dice 10 and 4 | Resolve action roll | Raw score is 12, capped score is 10; result is weak hit. |
| TC-RER-005 | Match Detection | Action score 8, challenge dice 7 and 7 | Resolve action roll | Result is strong hit with match. |
| TC-RER-006 | Negative Momentum | Current momentum -4, action die 4, stat 3, adds 0, challenge dice 3 and 5 | Resolve action roll | Action die is canceled; action score is 3; result is miss. |
| TC-RER-007 | Momentum Burn One Die | Current momentum +6, action score 4, challenge dice 5 and 8 | User burns momentum | Die 5 is canceled; final result is weak hit; momentum resets. |
| TC-RER-008 | Momentum Burn Both Dice | Current momentum +7, action score 4, challenge dice 5 and 6 | User burns momentum | Both dice are canceled; final result is strong hit; momentum resets. |
| TC-RER-009 | Burn Strictness | Current momentum +6, challenge dice 6 and 8 | Evaluate burn eligibility | Die 6 is not eligible because it is equal to momentum, not lower. |
| TC-RER-010 | Progress Score | Track has 27 ticks | Calculate progress score | Score is 6 filled boxes with 3 partial ticks. |
| TC-RER-011 | Progress Roll Tie | Progress score 6, challenge dice 4 and 6 | Resolve progress roll | Tie does not beat 6; result is weak hit. |
| TC-RER-012 | Momentum Ignored | Progress score 5, current momentum +10, challenge dice 6 and 7 | Resolve progress roll | Result is miss; momentum burn is unavailable. |
| TC-RER-013 | Rank Helper Troublesome | Empty track, rank troublesome | Apply mark-progress helper | Track gains 12 ticks. |
| TC-RER-014 | Rank Helper Epic | Empty track, rank epic | Apply mark-progress helper | Track gains 1 tick. |
| TC-RER-015 | Yes/No Oracle Almost Certain | Odds almost certain, oracle result 10 | Resolve oracle | Result is no. |
| TC-RER-016 | Yes/No Oracle Almost Certain Boundary | Odds almost certain, oracle result 11 | Resolve oracle | Result is yes. |
| TC-RER-017 | Yes/No Oracle Small Chance Boundary | Odds small chance, oracle result 91 | Resolve oracle | Result is yes. |
| TC-RER-018 | Oracle Table Lookup | Table has inclusive range 26-50 mapped to an approved result | Roll 33 | Engine returns the 26-50 result and table provenance. |
| TC-RER-019 | Momentum Max Derivation | One debility is marked | Calculate derived momentum values | Max momentum is 9 and reset is +1 unless overridden. |
| TC-RER-020 | Multiple Debilities Reset | Two debilities are marked | Calculate derived momentum reset | Momentum reset is 0 unless overridden. |
| TC-RER-021 | Progress Overfill Guard | Track has 39 ticks | Add 4 ticks with normal controls | Track clamps to 40 or asks user to confirm override. |
| TC-RER-022 | Invalid Dice | Manual action die value 7 | Resolve action roll | Engine rejects the input with a validation message. |
| TC-RER-023 | Missing Official Content | Oracle tables are disabled | User opens oracle tool | Standalone d100 roll still works or a clear unavailable-content message is shown. |
| TC-RER-024 | No Auto Consequence | Action roll resolves as miss | Result is displayed | Character health, spirit, supply, progress, and momentum are not changed unless user confirms. |

---

# 11. Traceability Matrix

| Rules Engine Area | Supports FRD / MVP Area | Notes |
|---|---|---|
| Core Dice Service | Move Roller; Oracle Tables | Enables generated and manual rolls. |
| Action Roll Resolution | Move Roller | Implements action score, hit classification, ties, match detection, negative momentum, and burn eligibility. |
| Momentum Rules | Character Sheet; Momentum Tracker; Move Roller | Supports current momentum, min/max/reset, debility-derived values, and burn workflow. |
| Progress Track Rules | Progress Trackers; Vow Journal | Supports vow, journey, combat, bond, and custom tracks. |
| Progress Roll Resolution | Move Roller; Vow Journal; Progress Trackers | Enables progress moves without momentum. |
| Oracle Resolution | Oracle Tables; Journal | Enables d100, yes/no odds, table lookup, source visibility, and save-to-journal. |
| Move Metadata | Move Roller; Content Provenance | Supports move-aware UX without full move automation. |
| Character Derived Values | Character Sheet; Momentum Tracker | Enables debility-related momentum derivation and status-track validation. |
| Asset/Modifier Handling | Character Sheet; Move Roller | Keeps asset effects manual in MVP while allowing future automation. |
| History Records | Roll History; Journal | Allows rolls and oracle results to be saved or audited. |
| Validation/Overrides | QA; Data Integrity | Prevents common rules errors while allowing manual correction. |
| Licensing Support | Content & Licensing Review | Keeps official/SRD-derived/user content distinguishable. |

---

# 12. MVP Acceptance Criteria

The Rules Engine Requirements are satisfied for MVP release candidate when:

1. Action rolls correctly generate or accept dice, calculate action score, cap the score at 10, apply negative momentum cancellation, classify strong hit / weak hit / miss, and detect matches.
2. Momentum burn is optional, user-confirmed, uses strict lower-than comparison, stores initial and post-burn results, and resets momentum after confirmation.
3. Progress tracks store boxes and ticks accurately, support rank-based progress helpers, calculate progress score from fully filled boxes only, and preserve partial ticks.
4. Progress rolls use challenge dice only, ignore momentum, classify results correctly, and detect matches.
5. Oracle rolls generate d100 values, support yes/no odds where approved, detect matches where dice data exists, and perform approved table lookup by inclusive ranges.
6. The engine exposes structured result objects for roll history and journal saving.
7. The engine avoids automatic narrative interpretation and does not silently apply major consequences.
8. Validation prevents invalid dice, invalid rank values, invalid progress ranges, invalid momentum bounds, and invalid oracle table ranges.
9. Manual override or correction is available where appropriate for house rules, physical dice, variants, or user mistakes.
10. Official, SRD-derived, original, custom, and user-authored content can be distinguished through provenance metadata.
11. All test cases in Section 10 pass or are explicitly descoped by product decision.
12. No out-of-scope MVP features are required to complete the core solo play loop.

---

# 13. Open Questions

| ID | Question | Owner | Needed By |
|---|---|---|---|
| OQ-RER-01 | Should manual physical dice entry be Must Have or Should Have for MVP? | Product / UX | Before roll UI implementation |
| OQ-RER-02 | Should debility-derived momentum values be automatically enforced or shown as suggestions with manual confirmation? | Product / Rules / UX | Before character sheet implementation |
| OQ-RER-03 | Should progress helper buttons directly apply rank progress or only show the amount for the user to confirm? | Product / UX | Before tracker implementation |
| OQ-RER-04 | Which official move names, move categories, and short summaries are approved for inclusion? | Product / Licensing | Before move metadata entry |
| OQ-RER-05 | Which oracle tables are approved for v0.1? | Product / Licensing | Before oracle implementation |
| OQ-RER-06 | Should yes/no oracle odds be implemented using official labels or original app wording? | Licensing / UX | Before oracle UX copy |
| OQ-RER-07 | Should roll history persist beyond the current session or remain temporary unless saved to journal? | Product / UX / Data | Before data model |
| OQ-RER-08 | Is a state undo feature required for MVP or deferred? | Product / Tech | Before implementation planning |
| OQ-RER-09 | Should the rules engine support house-rule profiles in MVP, or only manual override? | Product | Before implementation planning |
| OQ-RER-10 | Should companion health and companion endure-harm support be part of MVP v0.1 or deferred with assets? | Product / Scope | Before asset handling design |
| OQ-RER-11 | Should harm/stress/supply consequence helpers be implemented as non-automatic prompts in MVP? | Product / UX | Before tracker UX |
| OQ-RER-12 | What exact export format should include roll history and rules-state audit data if export is implemented? | Product / Tech | Before export decision |

---

# 14. Approval

This Rules Engine Requirements document is approved when the project owner confirms that:

- The rules engine scope matches the MVP baseline.
- The action roll, progress roll, oracle roll, momentum, and progress-track calculations are correct.
- The automation boundaries preserve fiction-first play.
- The requirements are detailed enough for implementation and unit test planning.
- The open questions are ready for product, UX, technical, and licensing decisions.

| Role | Name / Signature | Date |
|---|---|---|
| Product Owner |  |  |
| Technical Lead |  |  |
| QA Lead |  |  |
| UX Lead |  |  |
| Content/Licensing Reviewer |  |  |

---

# Appendix A: Suggested Internal Type Names

These names are suggestions for the future Data Model / Domain Model Specification. They are not final implementation decisions.

| Concept | Suggested type / enum |
|---|---|
| Roll type | `action`, `progress`, `oracle`, `manual` |
| Outcome | `strong_hit`, `weak_hit`, `miss`, `yes`, `no`, `table_result` |
| Track type | `vow`, `journey`, `combat`, `bond`, `custom` |
| Rank | `troublesome`, `dangerous`, `formidable`, `extreme`, `epic` |
| Content provenance | `official`, `srd_derived`, `original_app_wording`, `user_authored`, `custom` |
| Roll source | `generated`, `manual`, `test_injected` |
| Momentum burn status | `not_available`, `available`, `declined`, `burned` |
| Track status | `active`, `completed`, `failed_forsaken`, `archived` |
| Debility category | `condition`, `bane`, `burden` |

# Appendix B: Non-MVP Future Rules Engine Candidates

The following are likely future enhancements after the MVP validates the core solo flow:

- Structured official move library, if licensing permits.
- Optional move outcome assistants that suggest, but do not force, consequences.
- Asset effect automation and reroll support.
- Companion health and companion-specific suffer moves.
- Harm, stress, and supply consequence helpers.
- Initiative reminders for combat scenes.
- Custom move and custom oracle authoring UI.
- House-rule profiles.
- Shared co-op progress tracks and party supply handling.
- Persistent roll analytics for playtesting.
