# MVP Scope Document

## Ironsworn Digital Companion

*Version 0.1 | Draft | Prepared for the Ironsworn Project*

| Field | Value |
|---|---|
| Document owner | Product Owner / Project Lead |
| Related documents | Business Requirements Document v0.1; future PRD; future Rules Engine Requirements; future Data Model / Domain Model Specification |
| MVP baseline | Character sheet, move roller, momentum/progress trackers, oracle tables, vow journal |
| Primary audience | Product owner, developer, UX designer, QA/tester, content/licensing reviewer |
| Status | Draft for review |

## 1. Purpose

This document defines the minimum viable product scope for the Ironsworn Digital Companion. It translates the business direction into a bounded release that can be designed, built, tested, and playtested without expanding into a full virtual tabletop, campaign platform, or automated game master.

The MVP should allow a solo-first Ironsworn player to create or resume a character, manage essential play state, roll moves, consult oracles, track vows and progress, and keep a basic session journal.

## 2. Source Basis

This MVP scope is based on:

- The existing Ironsworn Digital Companion BRD v0.1.
- The agreed project MVP baseline: character sheet, move roller, momentum/progress trackers, oracle tables, and vow journal.
- The Ironsworn rulebook concepts most relevant to digital play support: solo/co-op/guided modes, character sheet state, action rolls, progress rolls, momentum, progress tracks, oracles, vows, bonds, assets, and fiction-first play.

## 3. MVP Goal

Deliver a lightweight, usable companion application that reduces bookkeeping and reference friction during a solo Ironsworn session while preserving player interpretation and fiction-first play.

The MVP succeeds when a player can run a basic solo play loop from character setup through vows, rolls, oracle prompts, progress updates, and journal entries without relying on spreadsheets or disconnected note tools for core tracking.

## 4. MVP Principles

| ID | Principle | Meaning for MVP |
|---|---|---|
| MP-01 | Solo-first | Optimize the first release for one player managing one active session. |
| MP-02 | Companion, not replacement | The app supports play but does not replace player interpretation or the rulebook. |
| MP-03 | Fiction-first | Move and oracle outputs should prompt interpretation, not over-automate story decisions. |
| MP-04 | Rules-aware, not rules-heavy | Automate dice and tracking where useful, but avoid building every edge case in v0.1. |
| MP-05 | Persistent and safe | Character state and journal content must survive normal app closure/reopen. |
| MP-06 | Extensible foundation | Data structures should not block future campaigns, multiple characters, co-op support, or custom tables. |
| MP-07 | Licensing-conscious | Official content usage must be tracked, attributed, and reviewed before public release. |

## 5. Target Users for MVP

| User Type | MVP Priority | Primary Need |
|---|---:|---|
| Solo Player | Primary | Run a session with character state, rolls, oracles, vows, and notes in one workspace. |
| New Player | Secondary | Create a character and perform common play actions without being overwhelmed. |
| Co-op Player | Later | Reuse some tools locally, but real shared-state support is outside MVP. |
| Guided Player / GM | Later | Use references and trackers manually, but GM-specific workflows are outside MVP. |

## 6. MVP User Journey

The MVP should support this core journey:

1. The user opens the app.
2. The user creates a character or resumes an existing one.
3. The user reviews current stats, tracks, vows, and notes.
4. The user records a background vow or active vow.
5. The user makes a move roll and sees the result classification.
6. The user optionally burns momentum when eligible.
7. The user records progress, milestones, or consequences.
8. The user rolls or browses an oracle result when inspiration is needed.
9. The user records journal notes tied to the session, vow, move, or oracle result.
10. The user closes the app and later returns with state preserved.

## 7. MVP Feature Set

| ID | Feature | MVP Status | Summary |
|---|---|---|---|
| MVP-01 | Character Sheet | Must Have | Create, edit, save, and resume a character with core Ironsworn sheet state. |
| MVP-02 | Move Roller | Must Have | Resolve action, progress, and oracle rolls with clear results. |
| MVP-03 | Momentum and Progress Trackers | Must Have | Track momentum and progress for vows and challenges. |
| MVP-04 | Oracle Tables | Must Have | Roll or browse approved oracle tables and record outputs. |
| MVP-05 | Vow Journal | Must Have | Track vows, milestones, notes, and outcomes. |
| MVP-06 | Basic Persistence | Must Have | Save and reload user-created data. |
| MVP-07 | Basic Onboarding | Should Have | Help the user create a first character and start play. |
| MVP-08 | Export | Could Have | Export character/journal data if time allows; otherwise defer. |

## 8. Detailed Feature Scope

### 8.1 MVP-01: Character Sheet

**Goal:** Allow the user to create and maintain a digital character sheet for solo play.

#### Included

| ID | Scope Item | Priority |
|---|---|---|
| CS-01 | Character name and short description/concept. | Must |
| CS-02 | Core stats: Edge, Heart, Iron, Shadow, Wits. | Must |
| CS-03 | Status tracks: Health, Spirit, Supply. | Must |
| CS-04 | Momentum values: current momentum, max momentum, reset value. | Must |
| CS-05 | Debilities: conditions, banes, burdens. | Must |
| CS-06 | Bonds tracker and bond notes. | Must |
| CS-07 | Experience tracking. | Should |
| CS-08 | Asset references as simple text entries or lightweight structured records. | Should |
| CS-09 | Important equipment/notes as free text. | Should |
| CS-10 | Default starting values helper. | Should |

#### Excluded from MVP

- Full asset card database with all official text unless licensing review approves it.
- Automated asset rule application.
- Character portraits or token art.
- Multiple character parties with shared live state.
- Advanced validation for every possible rules edge case.

#### Acceptance Criteria

- A user can create a character and save it.
- A user can reopen the app and see the same character values.
- A user can manually adjust stats, tracks, momentum, debilities, bonds, experience, and notes.
- Starting values can be entered without requiring external spreadsheets.

---

### 8.2 MVP-02: Move Roller

**Goal:** Let the user resolve the main Ironsworn roll types quickly and accurately enough for MVP playtesting.

#### Included

| ID | Scope Item | Priority |
|---|---|---|
| MR-01 | Action roll: one d6 action die plus two d10 challenge dice. | Must |
| MR-02 | Stat/add input for action score. | Must |
| MR-03 | Strong hit / weak hit / miss classification. | Must |
| MR-04 | Challenge dice match detection. | Must |
| MR-05 | Action score cap handling. | Must |
| MR-06 | Optional momentum burn decision after roll when eligible. | Must |
| MR-07 | Momentum reset after burn. | Must |
| MR-08 | Progress roll against filled progress boxes. | Must |
| MR-09 | Oracle d100 roll. | Must |
| MR-10 | Roll history for the current session. | Should |
| MR-11 | Copy/save roll result to journal. | Should |

#### Excluded from MVP

- Full automated move text library unless approved by content/licensing review.
- Automatic application of every move consequence.
- Automatic asset modifiers.
- AI interpretation of roll outcomes.
- Shared dice rolls for multiplayer.

#### Acceptance Criteria

- A user can make an action roll and see dice, action score, and result classification.
- A user can see when challenge dice match.
- A user can choose whether to burn momentum when eligible.
- A user can make a progress roll where momentum is ignored.
- A user can make a d100 oracle roll.

---

### 8.3 MVP-03: Momentum and Progress Trackers

**Goal:** Provide reliable visual and editable tracking for momentum and progress-based challenges.

#### Included

| ID | Scope Item | Priority |
|---|---|---|
| PT-01 | Current momentum tracker from minimum to maximum supported values. | Must |
| PT-02 | Momentum max and reset values. | Must |
| PT-03 | Manual momentum increase/decrease controls. | Must |
| PT-04 | Vow progress tracks. | Must |
| PT-05 | Generic progress tracks for journey, combat, and custom challenge use. | Must |
| PT-06 | Rank field: troublesome, dangerous, formidable, extreme, epic. | Must |
| PT-07 | Tick/box-based progress editing. | Must |
| PT-08 | Progress status: active, completed, failed/forsaken, archived. | Should |
| PT-09 | Simple progress event notes. | Should |

#### Excluded from MVP

- Tactical combat map or initiative board.
- Automated journey waypoint generator.
- Automated enemy packs and foe database.
- Shared co-op progress synchronization.

#### Acceptance Criteria

- A user can create, edit, and delete a progress track.
- A user can assign a rank to a progress track.
- A user can mark progress in ticks or boxes.
- A user can perform a progress roll using the current track state.
- A user can distinguish vow progress from journey/combat/custom progress.

---

### 8.4 MVP-04: Oracle Tables

**Goal:** Give the player quick access to oracle results for solo inspiration without replacing interpretation.

#### Included

| ID | Scope Item | Priority |
|---|---|---|
| OT-01 | Basic Ask-the-Oracle style yes/no odds roll. | Must |
| OT-02 | D100 oracle roller. | Must |
| OT-03 | Browse a limited approved set of oracle tables. | Must |
| OT-04 | Display result range and prompt/result. | Must |
| OT-05 | Copy/save result to journal. | Should |
| OT-06 | Content source/provenance label for official vs custom/future content. | Must |

#### Excluded from MVP

- Custom oracle authoring UI.
- Large community oracle library.
- AI-generated oracle interpretation.
- Unauthorized reproduction of rulebook-only tables or prose.

#### Acceptance Criteria

- A user can choose yes/no odds and roll an answer.
- A user can roll on at least one approved oracle table.
- A user can browse available oracle tables.
- A user can save an oracle result into the journal or copy it manually.
- The app clearly indicates the source/provenance of oracle content.

---

### 8.5 MVP-05: Vow Journal

**Goal:** Make vows and narrative continuity central to the MVP workspace.

#### Included

| ID | Scope Item | Priority |
|---|---|---|
| VJ-01 | Create a vow with title, description, and rank. | Must |
| VJ-02 | Track vow status: active, fulfilled, forsaken, archived. | Must |
| VJ-03 | Vow progress track. | Must |
| VJ-04 | Milestone entries with date/time and note. | Must |
| VJ-05 | Outcome notes for fulfilled or forsaken vows. | Must |
| VJ-06 | Link journal entries to vows. | Should |
| VJ-07 | Background vow and inciting incident markers. | Should |
| VJ-08 | Session-level journal entries. | Must |
| VJ-09 | Save roll/oracle outputs into journal. | Should |

#### Excluded from MVP

- Rich campaign wiki.
- NPC relationship graph.
- Timeline visualization.
- Quest outline generator.
- AI-authored session prose.

#### Acceptance Criteria

- A user can create and update at least one vow.
- A user can assign a rank and mark vow progress.
- A user can add milestone notes.
- A user can mark a vow as fulfilled or forsaken and record outcome notes.
- A user can create freeform session journal entries.

---

### 8.6 MVP-06: Basic Persistence

**Goal:** Prevent loss of character, vow, progress, oracle, and journal data during normal use.

#### Included

| ID | Scope Item | Priority |
|---|---|---|
| BP-01 | Save character state. | Must |
| BP-02 | Save vows and progress tracks. | Must |
| BP-03 | Save journal entries. | Must |
| BP-04 | Save current session roll/oracle history if implemented. | Should |
| BP-05 | Basic data backup/export decision before public release. | Should |

#### Implementation Note

The MVP Scope Document does not decide whether persistence is local-first, account-based, or server-backed. That decision belongs in the PRD, technical architecture, and data model documents.

#### Acceptance Criteria

- A user can close and reopen the app without losing saved character and journal data.
- The MVP has a defined persistence approach before implementation begins.
- Data loss scenarios are covered in the acceptance test plan.

---

### 8.7 MVP-07: Basic Onboarding

**Goal:** Reduce first-use friction enough for playtesting.

#### Included

| ID | Scope Item | Priority |
|---|---|---|
| ON-01 | Create-first-character entry path. | Should |
| ON-02 | Starting value hints. | Should |
| ON-03 | First vow prompt or empty state guidance. | Should |
| ON-04 | Short explanation of the five workspace areas. | Could |

#### Excluded from MVP

- Full tutorial campaign.
- Rulebook replacement guide.
- Interactive rules lessons.
- Automated character builder with full assets and world truths.

#### Acceptance Criteria

- A new user can identify where to create a character.
- A new user can identify where to add a vow.
- A new user can find roll, oracle, tracker, and journal functions without deep navigation.

## 9. MVP Workspace Structure

The MVP should use a compact workspace rather than a sprawling campaign manager.

Recommended primary navigation:

1. **Character** — sheet state, assets references, bonds, debilities, notes.
2. **Roll** — action roll, progress roll, oracle roll, recent results.
3. **Tracks** — vows, journeys, combat/custom progress, momentum controls.
4. **Oracles** — yes/no oracle and approved tables.
5. **Journal** — session notes, vow notes, saved rolls/oracles.

A single dashboard may combine summaries from these areas if UX design supports it.

## 10. Explicit MVP Out of Scope

The following are intentionally excluded from MVP v0.1:

| Area | Excluded Capability |
|---|---|
| VTT | Maps, tokens, tactical grids, fog of war, scene boards. |
| Multiplayer | Real-time shared campaigns, live co-op synchronization, user invitations. |
| AI | AI GM, automated story authoring, AI move interpretation, AI oracle narration. |
| Marketplace | Paid content, community content marketplace, asset-card store. |
| Full rules compendium | Complete rulebook replacement or extensive copied prose. |
| Full official asset database | Structured automation for every official asset. |
| Mobile app stores | Native iOS/Android app submission. |
| Monetization | Payments, subscriptions, gated content, or ads before licensing approval. |
| Advanced campaign management | NPC database, relationship graph, region map, world truth builder, timeline. |

## 11. MVP Release Candidate Definition

The MVP may be considered release-candidate ready when:

1. All Must Have scope items are implemented or intentionally descoped by product decision.
2. A solo playtest can complete the core user journey without external tracking tools.
3. Character, vow, tracker, oracle, and journal data persist reliably.
4. Action rolls, progress rolls, oracle rolls, matches, and momentum burn workflow pass test cases.
5. Content provenance is documented.
6. Attribution and license notices are present where required.
7. No excluded feature is required for the MVP acceptance flow.
8. Known limitations are documented.

## 12. MVP Acceptance Test Scenarios

### Scenario 1: First Character Setup

**Given** a new user opens the app  
**When** they create a character and enter core sheet values  
**Then** the character is saved and visible after reopening the app.

### Scenario 2: First Vow

**Given** a user has a saved character  
**When** they create a vow with a rank and description  
**Then** the vow appears as an active progress track with journal support.

### Scenario 3: Action Roll

**Given** a user is in the roll workspace  
**When** they make an action roll with a stat/add value  
**Then** the app displays action die, challenge dice, action score, result classification, and match status.

### Scenario 4: Momentum Burn

**Given** a user has positive momentum and an eligible roll result  
**When** they choose to burn momentum  
**Then** the app recalculates the result and resets momentum appropriately.

### Scenario 5: Progress Roll

**Given** a user has a progress track with filled boxes  
**When** they make a progress roll  
**Then** the app compares progress against challenge dice and ignores momentum.

### Scenario 6: Oracle Result to Journal

**Given** a user rolls on an approved oracle table  
**When** they choose to save the result  
**Then** the oracle result is added to the journal or linked note area.

### Scenario 7: Session Resume

**Given** a user has updated character state, vow progress, and journal notes  
**When** they close and reopen the app  
**Then** the same state is restored.

## 13. MVP Success Metrics

| ID | Metric | Target Signal |
|---|---|---|
| SM-01 | Activation | A new playtester creates a character and a first vow in one session. |
| SM-02 | Core utility | A playtester uses at least three of the five core MVP features in a session. |
| SM-03 | Roll confidence | A playtester can complete an action roll and progress roll without external help. |
| SM-04 | Solo flow | A playtester can run a basic solo scene using the MVP workspace. |
| SM-05 | Return use | A playtester returns to the same character or vow journal after initial use. |
| SM-06 | Scope control | MVP ships without full VTT, multiplayer, AI GM, marketplace, or monetization. |
| SM-07 | Compliance readiness | Official content used in-product is inventoried and reviewable. |

## 14. Prioritization Summary

### Must Have

- Character sheet core state.
- Action roll, progress roll, oracle roll.
- Result classification and challenge-dice match detection.
- Momentum tracking and momentum burn workflow.
- Vow and generic progress trackers.
- Oracle access for approved content.
- Vow journal and session notes.
- Persistent storage.
- Licensing/provenance awareness.

### Should Have

- Roll/oracle save-to-journal.
- Simple asset references.
- Basic onboarding and starting value hints.
- Roll history.
- Export decision before public release.

### Could Have

- Markdown/JSON export.
- Dashboard summary.
- Custom progress track templates.
- Lightweight keyboard shortcuts.

### Won't Have in MVP

- Full VTT.
- Real-time multiplayer.
- AI GM or AI narration.
- Marketplace.
- Native mobile release.
- Monetization.
- Full automated official content database.

## 15. Dependencies

| ID | Dependency | Impact |
|---|---|---|
| DEP-01 | PRD | Confirms product behavior, personas, UX direction, and release assumptions. |
| DEP-02 | Rules Engine Requirements | Defines exact roll, momentum, progress, and move behavior. |
| DEP-03 | Data Model / Domain Model Specification | Defines character, vow, journal, oracle, and progress entities. |
| DEP-04 | UX Flow / Wireframe Requirements | Defines screen structure and task flows. |
| DEP-05 | Content & Licensing Requirements | Defines permitted official content, attribution, and release constraints. |
| DEP-06 | Acceptance Criteria / Test Plan | Converts this MVP scope into testable release gates. |

## 16. Risks and Mitigations

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R-01 | Scope creep | MVP becomes too large to validate quickly. | Enforce explicit out-of-scope list and Must/Should/Could priorities. |
| R-02 | Licensing uncertainty | Public release may be blocked. | Inventory content and prefer SRD-approved or original wording until review. |
| R-03 | Rules errors | Players lose trust in dice/tracker behavior. | Create Rules Engine Requirements and test cases before implementation. |
| R-04 | Poor journaling flow | Solo players may continue using generic notes instead. | Make save-to-journal and vow linking fast. |
| R-05 | Data loss | Campaign notes are emotionally valuable and hard to recreate. | Prioritize persistence tests and consider export/backup before public release. |
| R-06 | Over-automation | App undermines fiction-first play. | Keep interpretation user-led and make automation confirmable/manual where appropriate. |
| R-07 | New-user overwhelm | First-time users may abandon before play. | Provide simple onboarding and minimal default workspace. |

## 17. Open Questions

| ID | Question | Owner | Needed By |
|---|---|---|---|
| OQ-01 | Is the first MVP local-first, account-based, or server-backed? | Product / Tech | Before data model |
| OQ-02 | Which exact oracle tables may be included in v0.1? | Content/Licensing | Before implementation |
| OQ-03 | Are move names only enough, or will the MVP include move summaries? | Product / Licensing | Before UX copy |
| OQ-04 | Are assets simple notes, structured references, or excluded beyond free text? | Product | Before character sheet design |
| OQ-05 | Is export required for MVP release candidate or deferred to post-MVP? | Product / Tech | Before release planning |
| OQ-06 | Will the MVP be private/internal only or public playtest? | Product | Before licensing review |
| OQ-07 | What platform is assumed: responsive web, PWA, desktop wrapper, or other? | Product / Tech | Before PRD completion |

## 18. Approval Criteria

This MVP Scope Document is approved when the project owner confirms:

- The five baseline MVP features are correct.
- The Must Have / Should Have / Could Have priorities are acceptable.
- The explicit out-of-scope list is acceptable.
- The MVP acceptance scenarios are sufficient to guide the test plan.
- The open questions are ready to be resolved in the PRD and supporting requirements documents.

| Role | Name / Signature | Date |
|---|---|---|
| Product Owner |  |  |
| Technical Lead |  |  |
| UX Lead |  |  |
| Content/Licensing Reviewer |  |  |

## Appendix A: MVP-to-Document Traceability

| MVP Area | Next Supporting Document |
|---|---|
| Character Sheet | Functional Requirements Specification; Data Model Specification; UX Flow Requirements |
| Move Roller | Rules Engine Requirements; Acceptance Criteria / Test Plan |
| Momentum / Progress Trackers | Rules Engine Requirements; Data Model Specification |
| Oracle Tables | Content & Licensing Requirements; Rules Engine Requirements |
| Vow Journal | Functional Requirements Specification; Data Model Specification; UX Flow Requirements |
| Persistence | Non-Functional Requirements; Data Model Specification; Acceptance Criteria / Test Plan |
