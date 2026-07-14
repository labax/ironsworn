# Ironsworn Digital Companion

## v0.2 — Solo Campaign Depth: Business and Scope Addendum

*Version 0.2 | Draft | Prepared for the Ironsworn Project*

| Field | Value |
|---|---|
| Document owner | Product Owner / Project Lead |
| Parent document | Ironsworn Digital Companion Business Requirements Document v0.1 |
| Target release | v0.2 — Solo Campaign Depth |
| Primary audience | Product owner, developer, UX designer, QA/tester, content/licensing reviewer, early playtesters |
| Status | Draft for review |

---

## 1. Purpose

This document defines the business objectives, release boundaries, success measures, constraints, and approval criteria for **v0.2 — Solo Campaign Depth**.

It supplements the existing Business Requirements Document v0.1 and does not replace it. The product vision, primary audience, fiction-first principles, licensing position, and overall product boundaries established for the MVP remain in force unless this addendum explicitly changes them.

The purpose of v0.2 is to convert the completed MVP from a collection of usable session tools into a dependable companion for **long-running, multi-session solo campaigns**.

---

## 2. Release Context

The MVP establishes the core Ironsworn play loop:

- Create and manage a character.
- Roll moves and progress rolls.
- Track momentum and progress.
- Consult approved oracle content.
- Manage vows.
- Record journal entries and roll history.
- Save and resume core application state.

The next business risk is no longer whether the individual tools work. The risk is whether players can trust the application with an ongoing campaign over days, weeks, or months.

Long-running solo play introduces needs that are not fully addressed by an MVP optimized around one active play state:

- Separating one campaign from another.
- Understanding what happened in the previous session.
- Starting, pausing, resuming, and closing sessions deliberately.
- Finding older journal entries, rolls, oracle results, vows, and tracks.
- Protecting local campaign data against browser, device, or user error.
- Recovering safely from invalid, outdated, or corrupted saved data.
- Correcting recent state changes without obscuring what happened.

v0.2 addresses those needs without expanding into a rules compendium, custom-content platform, cloud service, or multiplayer application.

---

## 3. Business Rationale

### 3.1 User value

Solo campaigns accumulate high-value personal data: characters, vows, notes, discoveries, progress, and session history. Losing or mixing this data would undermine confidence in the product even if the individual gameplay tools are otherwise correct.

v0.2 should provide enough campaign organization and data safety that a player can rely on the companion as their primary digital campaign record.

### 3.2 Product value

This release validates whether the product can retain users beyond initial experimentation. A player who successfully resumes an ongoing campaign is more likely to continue using the application than a player who treats it as a temporary dice roller or character sheet.

The release also establishes the campaign and session foundations needed by later roadmap milestones:

- v0.3 rules and content depth.
- v0.4 custom content and house-rule profiles.
- v0.5 shared and cooperative campaigns.

### 3.3 Risk reduction

The milestone reduces the following product risks:

- Data loss or accidental destructive actions.
- Campaign records being mixed together.
- Stored data becoming unusable after schema changes.
- Players being unable to reconstruct recent events.
- Local-first storage limitations being unclear.
- Later features being built on an unstable campaign container.

---

## 4. Release Vision

> Enable a solo Ironsworn player to maintain, pause, resume, review, back up, and recover a multi-session campaign with confidence.

The application should feel like a lightweight play companion, not an administrative database. Campaign and session structure should support play continuity while remaining unobtrusive during active play.

---

## 5. Business Objectives

| ID | Objective | Business rationale |
|---|---|---|
| V2-BO-01 | Support ongoing solo campaigns | Demonstrate that the product is useful beyond a single session or test character. |
| V2-BO-02 | Improve continuity between sessions | Help returning players understand the current state and recent fiction quickly. |
| V2-BO-03 | Protect campaign data | Reduce the risk and impact of local storage loss, invalid imports, destructive actions, and migrations. |
| V2-BO-04 | Separate campaigns cleanly | Allow multiple campaigns without cross-contamination of characters, vows, tracks, rolls, or notes. |
| V2-BO-05 | Make history navigable | Give players practical access to prior sessions and recent campaign activity. |
| V2-BO-06 | Prepare future releases | Establish stable campaign, session, migration, and backup boundaries for later content and co-op work. |
| V2-BO-07 | Preserve product focus | Improve depth and reliability without adding a VTT, AI narration, real-time multiplayer, or a complete rules library. |

---

## 6. Target Users

### 6.1 Primary user

**Returning solo campaign player**

A player who has already created a character and is using the application across multiple play sessions. Their primary needs are continuity, confidence, organization, and recovery.

### 6.2 Secondary users

| User | Need in v0.2 |
|---|---|
| New solo player | Begin with a clear default campaign and understand how sessions are saved. |
| Existing MVP user | Migrate current local data safely into the v0.2 campaign structure. |
| Playtester | Create repeatable campaigns, reset test state safely, and export evidence when reporting defects. |
| Product owner / QA | Verify long-running use, migration behavior, and release readiness. |

### 6.3 Deferred users

Co-op players, guided-play groups, campaign spectators, and public content creators remain future users. v0.2 may prepare compatible data structures, but it does not deliver their complete workflows.

---

## 7. Business Requirements

| ID | Requirement | Priority | Acceptance signal |
|---|---|---:|---|
| V2-BR-01 | The product shall allow a player to create and maintain more than one separate campaign. | Must | Records from one campaign are not shown or modified in another campaign. |
| V2-BR-02 | The product shall identify one active campaign and allow the player to switch campaigns deliberately. | Must | The active campaign is visible and switching requires an explicit action. |
| V2-BR-03 | The product shall support a session lifecycle suitable for starting, resuming, pausing, completing, and reviewing solo play sessions. | Must | Sessions have clear state and retain their dates, notes, rolls, and linked activity. |
| V2-BR-04 | The product shall provide useful context when the player returns to a campaign. | Must | The player can see recent activity, the last session, and current active work without searching manually. |
| V2-BR-05 | The product shall preserve character, vow, tracker, roll, oracle, journal, campaign, and session data across ordinary application restarts. | Must | Reloading the application restores the same campaign state. |
| V2-BR-06 | The product shall provide complete campaign backup export. | Must | A versioned export contains the records needed to reconstruct the selected campaign or workspace scope. |
| V2-BR-07 | The product shall validate an imported backup before replacing or merging current data. | Must | Invalid imports make no changes to valid existing data. |
| V2-BR-08 | The product shall support documented schema migration from supported earlier saves. | Must | Existing MVP data is migrated or rejected with a clear recovery path. |
| V2-BR-09 | The product shall provide safe handling for missing, invalid, or corrupted stored data. | Must | The user receives a clear error, preserves recoverable data, and is not forced into silent data loss. |
| V2-BR-10 | Destructive campaign actions shall require explicit confirmation and identify their consequences. | Must | Archive, delete, restore, overwrite, and reset actions cannot occur accidentally. |
| V2-BR-11 | The product should provide a practical way to correct or reverse recent manual state changes where feasible. | Should | A user can recover from a mistaken tracker or status update without editing unrelated records. |
| V2-BR-12 | The product should improve filtering and chronological navigation for journal and history records. | Should | A user can locate records by campaign, session, type, date, or linked object where supported. |
| V2-BR-13 | The product shall communicate local-first storage limitations and backup responsibilities clearly. | Must | The user can find a plain-language explanation of where data is stored and how to protect it. |
| V2-BR-14 | The product shall remain usable on supported desktop and mobile browser layouts. | Must | Core campaign and session workflows pass the agreed responsive and accessibility checks. |
| V2-BR-15 | The release shall not introduce monetization or new unapproved bundled Ironsworn content. | Must | Content and licensing release gates continue to pass. |

---

## 8. Included Scope

### 8.1 Campaign management

- Campaign list and active-campaign selection.
- Create, rename, duplicate where approved, archive, restore, and delete campaign workflows.
- Campaign title, description or premise, status, creation date, and last activity.
- Separation of all campaign-owned records.
- Migration of the existing default campaign into the visible campaign model.

### 8.2 Session management

- Start a new session.
- Resume an in-progress session.
- Pause or leave an in-progress session safely.
- Complete a session with an optional title and summary.
- View prior sessions chronologically.
- Link journal entries, rolls, oracle results, and significant activity to a session.

### 8.3 Continuity and history

- Last-session summary or equivalent returning-player context.
- Recent campaign activity.
- Improved chronological journal/history navigation.
- Filters for common history types.
- Clear active vows and tracks when resuming play.

### 8.4 Data safety

- Versioned campaign or workspace export.
- Import preview and validation.
- Explicit restore or replacement confirmation.
- Schema migration from supported v0.1 data.
- Corrupted-save handling and recovery guidance.
- Safe reset behavior limited to application-owned storage.
- Destructive-action safeguards.

### 8.5 Quality and release readiness

- Responsive and accessibility hardening.
- Visual-consistency remediation affecting campaign-depth workflows.
- Regression coverage for multi-session use.
- Closed playtest focused on continuing campaigns.

---

## 9. Out of Scope

The following are not required for v0.2:

- Complete move-reference catalogue.
- Structured official asset catalogue.
- Automated asset effects or reminders.
- Full Ironlands world or foe compendium.
- Custom move, asset, or oracle authoring.
- Community content packs.
- Account registration or authentication unless separately approved.
- Cloud synchronization or cross-device sync.
- Shared campaigns or real-time multiplayer.
- Invitations, roles, presence, or conflict resolution between users.
- AI-generated session summaries, recaps, narration, or advice.
- Maps, tokens, tactical boards, initiative systems, or other VTT features.
- Public marketplace, payments, subscriptions, advertising, or donor-only benefits.

---

## 10. Success Measures

### 10.1 Release acceptance measures

| ID | Measure | Target |
|---|---|---|
| V2-SM-01 | Multi-session campaign completion | A tester can run, close, and resume one campaign across at least three sessions. |
| V2-SM-02 | Campaign separation | No cross-campaign data leakage occurs in acceptance testing. |
| V2-SM-03 | Backup reliability | A valid exported backup can restore an equivalent campaign state. |
| V2-SM-04 | Import safety | Invalid or incompatible imports do not overwrite the current valid save. |
| V2-SM-05 | Migration safety | Supported v0.1 saves migrate without losing required records. |
| V2-SM-06 | Return-to-play speed | A returning tester can identify the active campaign, recent session context, and next likely action without external notes. |
| V2-SM-07 | Data-loss defects | No open blocker or critical data-loss defects at release approval. |
| V2-SM-08 | Responsive usability | Core campaign and session workflows pass desktop and mobile acceptance checks. |

### 10.2 Playtest indicators

The closed playtest should collect:

- Whether players trusted the application with campaign notes.
- Whether the last-session and recent-activity views were useful.
- Whether campaign switching was understandable.
- Whether backup and restore were discoverable and confidence-inspiring.
- Whether session management added useful structure without excessive administration.
- Whether players still needed external tools for core campaign continuity.

---

## 11. Assumptions

- The application remains local-first for v0.2 unless a separate architecture decision changes this.
- Existing MVP domain objects already belong, explicitly or implicitly, to a default campaign.
- One active campaign and one active session at a time are sufficient for the v0.2 interface.
- The application can add visible multiple-campaign support without requiring authentication.
- Existing rules calculations and content libraries do not require major expansion in this milestone.
- The player owns responsibility for narrative interpretation and session summaries.
- Exported data may contain private campaign notes and should be treated as sensitive user data.

---

## 12. Dependencies

- Completed and stable MVP feature set.
- Reliable local persistence abstraction.
- Existing Campaign and Session domain foundations.
- Stable IDs for characters, vows, tracks, journal entries, rolls, and oracle results.
- Existing backup/export groundwork where already implemented.
- Resolution of release-blocking onboarding and data-loss defects.
- Content provenance and licensing release gate.

---

## 13. Constraints

- The release must not silently discard unsupported or invalid data.
- The release must not use indiscriminate browser-storage deletion such as clearing an entire origin.
- The release must not require a network connection for ordinary play if the product remains local-first.
- The release must avoid introducing complex campaign-administration workflows that interrupt play.
- The release must preserve user-authored content separately from bundled content.
- The release must not imply cloud backup when only local export is provided.

---

## 14. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Migration loses or mislinks existing data | Critical loss of player trust | Versioned migrations, pre-migration snapshot, deterministic tests, and recovery path. |
| Campaign records leak across campaigns | Confusing or destructive state changes | Enforce campaign ownership in queries, services, UI state, and tests. |
| Import overwrites valid data | Permanent user data loss | Validate first, preview changes, require confirmation, and retain current data on failure. |
| Session management feels bureaucratic | Reduced usability during play | Keep titles and summaries optional; automate timestamps and links where safe. |
| Activity history grows without limit | Performance and navigation issues | Use pagination, bounded recent views, filtering, and archive strategy. |
| Local-first limitations are misunderstood | Users expect cloud recovery | Clear storage notice, visible backup guidance, and no misleading sync language. |
| Scope expands into cloud or multiplayer | Delays and architecture churn | Maintain explicit v0.2 exclusions and roadmap separation. |

---

## 15. Release Approach

Recommended delivery sequence:

1. Stabilize current MVP data ownership and release-blocking defects.
2. Expose and complete the campaign domain boundary.
3. Add the session lifecycle and session-linked records.
4. Add returning-player context and history navigation.
5. Complete versioned backup export and validated restore.
6. Add migration, corrupted-save recovery, and destructive-action safeguards.
7. Complete responsive, accessibility, and regression hardening.
8. Run a closed multi-session campaign playtest.

---

## 16. Business Acceptance Criteria

The milestone may be accepted when:

- All Must business requirements are implemented or formally descoped with documented risk.
- A player can create and maintain multiple separate campaigns.
- A player can start, resume, complete, and review sessions.
- Existing supported MVP data migrates safely.
- Valid backup export and restore pass acceptance testing.
- Invalid imports leave current data unchanged.
- Destructive actions require explicit confirmation.
- Returning-player context is present and useful in playtesting.
- Core workflows pass responsive and accessibility checks.
- No blocker or critical data-loss defects remain open.
- Content provenance, attribution, unofficial-product, and licensing gates continue to pass.

---

## 17. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Product Owner |  | Pending |  |
| Development Lead |  | Pending |  |
| QA / Test Lead |  | Pending |  |
| UX Reviewer |  | Pending |  |
| Content / Licensing Reviewer |  | Pending |  |
