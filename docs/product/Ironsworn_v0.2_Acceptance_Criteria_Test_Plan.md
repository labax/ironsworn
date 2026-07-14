# Ironsworn Digital Companion

## v0.2 — Solo Campaign Depth: Acceptance Criteria / Test Plan

*Version 0.2 | Draft | Prepared for the Ironsworn Project*

| Field | Value |
|---|---|
| Document owner | Product Owner / Project Lead |
| Parent document | Ironsworn Digital Companion Acceptance Criteria / Test Plan v0.1 |
| Related documents | v0.2 Business and Scope Addendum; v0.2 Functional Requirements Supplement; v0.2 Data Model Addendum; v0.2 UX Requirements Addendum |
| Target release | v0.2 — Solo Campaign Depth |
| Intended audience | Product owner, developer, QA/tester, UX/accessibility reviewer, content/licensing reviewer, closed playtesters |
| Status | Draft for review |

---

## 1. Purpose

This document defines the acceptance criteria and test strategy for **v0.2 — Solo Campaign Depth**.

It supplements the v0.1 acceptance plan. Existing MVP regression coverage remains required. v0.2 adds release gates and test scenarios for:

- Multiple campaign separation.
- Campaign lifecycle.
- Session lifecycle and continuity.
- Recent activity and history navigation.
- Backup export.
- Import validation and restore.
- Schema migration.
- Corrupted-data recovery and safe reset.
- Responsive and accessible campaign-depth workflows.

The milestone is successful when a player can maintain a multi-session solo campaign confidently without external tools for core campaign continuity or backup.

---

## 2. Quality Objectives

| ID | Objective | Acceptance signal |
|---|---|---|
| V2-QO-01 | Preserve campaign separation | Records from one campaign never appear in or mutate another campaign unexpectedly. |
| V2-QO-02 | Support long-running solo play | A tester can run and resume the same campaign across multiple sessions. |
| V2-QO-03 | Protect user data | Save, migration, export, import, restore, and reset behavior avoid silent loss. |
| V2-QO-04 | Improve continuity | Returning players can identify the previous session, active goals, and recent activity. |
| V2-QO-05 | Make history navigable | Session and history filters work predictably with accumulated records. |
| V2-QO-06 | Preserve local-first clarity | Storage limitations and backup responsibilities are understandable. |
| V2-QO-07 | Maintain usability | Campaign and session management remain lightweight, responsive, and accessible. |
| V2-QO-08 | Preserve MVP quality | Existing character, roll, momentum, progress, oracle, vow, journal, onboarding, persistence, and licensing tests continue to pass. |

---

## 3. Test Scope

### 3.1 In scope

| Area | Coverage |
|---|---|
| Campaigns | Create, list, select, rename, archive, restore, delete, active-campaign persistence, campaign isolation. |
| Sessions | Start, resume, pause/leave, complete, edit summary, chronological list, linked records, deletion/archive behavior. |
| Returning context | Last session, active vows/tracks, recent activity, empty and broken-link states. |
| History | Campaign scope, session filter, type filter, date filter if implemented, text search if implemented, pagination/incremental loading. |
| Corrections | Manual correction, duplicate-action prevention, activity history, undo if implemented. |
| Export | Package structure, scope, metadata, relationships, Unicode text, privacy warning, failures. |
| Import/restore | Parse, validation, preview, warnings/errors, confirmation, atomic replacement, cancellation, compatibility. |
| Migration | v0.1 fixtures, deterministic output, ID preservation, campaign assignment, failure rollback. |
| Recovery | Corruption detection, retry, import path, recovery export if implemented, app-owned reset. |
| Persistence | Coordinated writes, save status, reload, active campaign/session, quota/write failures. |
| UX/accessibility | Desktop/mobile, keyboard, focus, labels, status announcements, contrast, destructive hierarchy. |
| Licensing/content | Project-original helper text, no unapproved content/art/trade dress, private user text treatment. |

### 3.2 Conditional scope

Test only if included in implementation:

- Distinct paused-session state.
- Campaign duplication.
- Campaign-level merge import.
- Undo of recent changes.
- Raw recovery export.
- Persistent filters across application restarts.
- Campaign/workspace selectable backup scope.

### 3.3 Out of scope

- Accounts and authentication.
- Cloud synchronization.
- Co-op or real-time multiplayer.
- Full move-reference catalogue.
- Structured asset catalogue and automation.
- Custom content authoring.
- AI summaries or narrative generation.
- VTT maps, tokens, tactical boards, or initiative.
- Payments, advertising, subscriptions, or gated content.

---

## 4. Test Strategy

| Test level | Primary purpose | Recommended coverage |
|---|---|---|
| Requirements review | Verify complete and non-conflicting v0.2 behavior | Trace Must requirements to stories and tests. |
| Unit tests | Verify domain invariants, migration, validation, serialization | Pure functions, fixed fixtures, no UI dependency. |
| Component tests | Verify forms, lists, dialogs, filters, error states | Campaign switcher, session actions, data management, import preview. |
| Integration tests | Verify repository/state/persistence connections | Campaign switching, session links, export/import, migration commit/rollback. |
| End-to-end tests | Verify real user journeys | Multi-session campaign, backup/restore, recovery, mobile workflows. |
| Accessibility tests | Verify labels, keyboard, focus, announcements, contrast | Automated checks plus manual keyboard/screen-reader sanity. |
| Performance checks | Verify large-history usability | Representative campaign fixture and bounded list behavior. |
| Content/licensing review | Verify safe public build content | Provenance, notices, no prohibited visuals/prose. |
| Closed playtest/UAT | Verify practical campaign continuity | At least three sessions per test campaign. |

---

## 5. Test Environments

| Environment | Purpose | Required characteristics |
|---|---|---|
| Local development | Unit, component, and migration tests | Deterministic fixtures, storage reset, debug-safe logs. |
| QA build | Integration and manual QA | Stable schema, representative data, export/download support. |
| Closed playtest | Real multi-session validation | Content-reviewed build, clear local-storage notice, no monetization. |
| Release candidate | Final acceptance | Production-like build, migrations enabled, release gates active. |

### Browser/device baseline

- Desktop Chromium-based browser — Must.
- Desktop Firefox — Must or documented supported baseline.
- Mobile Chromium-based browser — Should before closed playtest completion.
- Mobile Safari — Should before public release.
- Tablet-width responsive test — Must.
- Minimum narrow-width check at 320 px — Must for layout sanity.

---

## 6. Test Data and Fixtures

### 6.1 Campaign A — The Ashen Road

| Field | Value |
|---|---|
| Campaign title | The Ashen Road |
| Character | Asha Test-Bearer |
| Sessions | 3 completed, 1 active fixture variant |
| Active vows | Find the Lost Caravan; Protect Greywatch |
| Tracks | Journey to Frostwood; Broken Gate Battle |
| Journal entries | At least 20 mixed entries |
| Rolls | At least 15 action/progress rolls |
| Oracle results | At least 10 approved/project-original fixtures |

### 6.2 Campaign B — The Broken Crown

| Field | Value |
|---|---|
| Campaign title | The Broken Crown |
| Character | Kato Iron-Walker |
| Sessions | 2 completed |
| Active vows | Recover the Crown Shard |
| Tracks | Road to Blackmere |
| Journal entries | At least 8 entries |
| Rolls | At least 5 rolls |

Use deliberately distinct names and values so cross-campaign leakage is easy to detect.

### 6.3 Migration fixtures

Maintain version-controlled fixtures for:

- Empty v0.1 workspace.
- Valid v0.1 character-only state.
- Full valid v0.1 MVP state.
- v0.1 state with optional fields absent.
- v0.1 state with Unicode and multiline journal text.
- Invalid v0.1 state with broken references.
- Unsupported future schema.
- Corrupted JSON or storage payload.

### 6.4 Import fixtures

- Valid v0.2 campaign backup.
- Valid v0.2 workspace backup if supported.
- Valid older compatible backup requiring migration.
- Valid backup with non-blocking warnings.
- Invalid format identifier.
- Unsupported format version.
- Missing required campaign entity.
- Duplicate IDs.
- Cross-campaign session reference.
- Invalid enum.
- Invalid timestamp.
- Truncated/corrupted file.
- Large but supported backup.
- Malicious-looking text/markup treated strictly as data.

---

## 7. Entry Criteria

A v0.2 feature is ready for QA when:

- The linked epic and story acceptance criteria are complete.
- Relevant functional requirement IDs are referenced.
- Domain ownership and persistence behavior are implemented.
- Unit/component tests exist for core behavior where practical.
- Migration or import fixtures exist when required.
- Error, empty, loading, and confirmation states are implemented.
- User-facing content has provenance classification.
- The build completes successfully.
- Known limitations are documented.

---

## 8. Exit Criteria

A feature passes QA when:

- All Must acceptance criteria pass.
- No blocker or critical defect remains open.
- High-severity defects are fixed or explicitly accepted by the product owner.
- Affected MVP regression tests pass.
- Campaign separation tests pass.
- Persistence/reload tests pass.
- Responsive and accessibility checks pass at the agreed baseline.
- Content/licensing checks pass.
- Deferred conditional behavior is documented accurately in UI and release notes.

---

# 9. Release Candidate Gates

| Gate | Name | Acceptance criteria |
|---|---|---|
| V2-GATE-01 | Scope gate | All Must v0.2 requirements are complete or formally descoped; no excluded capability is required for the release flow. |
| V2-GATE-02 | Campaign separation gate | Multi-campaign test suites show no cross-campaign display, update, export, deletion, or restore leakage. |
| V2-GATE-03 | Session continuity gate | A campaign can be run and resumed across at least three sessions with linked history intact. |
| V2-GATE-04 | Persistence gate | Active campaign, session state, and child records survive close/reopen and campaign switching. |
| V2-GATE-05 | Migration gate | Supported v0.1 fixtures migrate deterministically with required records and links preserved. |
| V2-GATE-06 | Backup gate | A valid backup exports and restores an equivalent accepted state. |
| V2-GATE-07 | Import safety gate | Invalid, incompatible, cancelled, and failed restores leave prior valid data unchanged. |
| V2-GATE-08 | Recovery gate | Corrupted data leads to recovery options, not silent first-run reset or broad browser data deletion. |
| V2-GATE-09 | UX gate | Campaign switching, session management, history, export, import, and recovery are discoverable and understandable. |
| V2-GATE-10 | Accessibility gate | Keyboard, labels, focus, status announcements, contrast, and mobile interaction pass the agreed baseline. |
| V2-GATE-11 | Regression gate | All critical v0.1 MVP smoke tests pass. |
| V2-GATE-12 | Content/licensing gate | No unapproved official prose, art, icons, screenshots, layout, or trade dress is introduced; required notices remain present. |
| V2-GATE-13 | UAT gate | Closed playtest demonstrates practical multi-session campaign use without external core continuity tools. |

---

# 10. Global Acceptance Criteria

| ID | Acceptance criterion | Priority |
|---|---|---:|
| V2-AC-GEN-001 | The user can create at least two campaigns and switch between them. | Must |
| V2-AC-GEN-002 | Each campaign displays only its own characters, sessions, vows, tracks, journal entries, rolls, and persisted oracle results. | Must |
| V2-AC-GEN-003 | The last active campaign is restored after application reload. | Must |
| V2-AC-GEN-004 | The user can start, leave/resume, and complete a session. | Must |
| V2-AC-GEN-005 | Journal entries, rolls, and oracle results created during a session are linked to it by default. | Must |
| V2-AC-GEN-006 | The user can review completed sessions chronologically. | Must |
| V2-AC-GEN-007 | The Play view provides useful last-session and recent-activity context. | Must |
| V2-AC-GEN-008 | The user can filter history by type and session. | Must |
| V2-AC-GEN-009 | The user can export a versioned backup containing the defined scope. | Must |
| V2-AC-GEN-010 | A valid backup can be previewed and restored after explicit confirmation. | Must |
| V2-AC-GEN-011 | Invalid or incompatible imports do not modify current valid data. | Must |
| V2-AC-GEN-012 | Supported v0.1 data migrates to valid v0.2 campaign ownership. | Must |
| V2-AC-GEN-013 | Migration failure preserves the original stored data. | Must |
| V2-AC-GEN-014 | Reset removes only Ironsworn-owned application data. | Must |
| V2-AC-GEN-015 | Destructive campaign, restore, and reset actions require explicit confirmation. | Must |
| V2-AC-GEN-016 | Local-first storage and backup limitations are communicated accurately. | Must |
| V2-AC-GEN-017 | Core v0.2 flows work on supported desktop and mobile widths. | Must |
| V2-AC-GEN-018 | Core v0.2 flows are keyboard operable and have accessible labels, focus, and status messaging. | Must |
| V2-AC-GEN-019 | Existing MVP gameplay features continue to work within the selected campaign. | Must |
| V2-AC-GEN-020 | No blocked or unapproved bundled content is introduced. | Must |

---

# 11. Detailed Acceptance Scenarios

## V2-AT-CAMP-001 — Create and switch campaigns

**Given** no campaigns exist  
**When** the user creates “The Ashen Road” and “The Broken Crown”  
**Then** both campaigns appear in the active campaign list  
**And** each has a unique stable ID  
**And** the selected campaign is identified clearly  
**And** switching changes the visible campaign context.

## V2-AT-CAMP-002 — Campaign isolation

**Given** Campaign A contains Asha, two vows, and a journal entry  
**And** Campaign B contains Kato and a different vow  
**When** Campaign B is active  
**Then** Asha and Campaign A records are not shown in Campaign B views  
**And** updates in Campaign B do not alter Campaign A records  
**And** reloading preserves both campaigns independently.

## V2-AT-CAMP-003 — Archive and restore

**Given** an active campaign with linked records  
**When** the user confirms archive  
**Then** it leaves the default active list  
**And** all linked records remain stored  
**When** the user restores it  
**Then** it returns with the same records and links.

## V2-AT-CAMP-004 — Permanent deletion scope

**Given** Campaign A and Campaign B exist  
**When** the user permanently deletes Campaign A after high-friction confirmation  
**Then** only Campaign A and its owned records are removed  
**And** Campaign B remains unchanged  
**And** unrelated browser storage is not cleared.

## V2-AT-SESS-001 — Start and complete session

**Given** an active campaign with no active session  
**When** the user starts a session without entering a title  
**Then** one active session is created with a generated display label  
**When** the user adds a journal entry and roll and completes the session with a summary  
**Then** the session has an end time and completed status  
**And** the summary and linked records appear in session detail.

## V2-AT-SESS-002 — Resume active session after reload

**Given** a session is active with linked activity  
**When** the application is closed and reopened  
**Then** the same campaign and session are available  
**And** the Play view offers Resume/Continue  
**And** linked records remain intact.

## V2-AT-SESS-003 — Prevent duplicate active sessions

**Given** a campaign has an active session  
**When** the user attempts to start another  
**Then** the application directs the user to resume or complete the existing session  
**And** does not create a duplicate active session.

## V2-AT-SESS-004 — Session deletion does not erase history

**Given** a session has linked journal and roll records  
**When** session deletion/archive behavior is used  
**Then** linked domain records remain available according to the defined unlink/archive policy  
**And** no silent cascade deletion occurs.

## V2-AT-CONT-001 — Returning-player context

**Given** a campaign has completed sessions, active vows, tracks, and recent activity  
**When** the user opens the Play view  
**Then** the active campaign is visible  
**And** last-session context is shown  
**And** active vows/tracks and bounded recent activity are accessible  
**And** no other campaign's activity appears.

## V2-AT-HIST-001 — Filter history

**Given** a campaign contains notes, rolls, oracles, and several sessions  
**When** the user filters by one session and the Roll type  
**Then** only rolls linked to that session appear  
**And** active filters are visible  
**And** Clear all restores the default view.

## V2-AT-EXP-001 — Export complete backup

**Given** Campaign A contains representative v0.2 records  
**When** the user exports the supported scope  
**Then** a file is produced with format version, schema version, export timestamp, scope, manifest counts, stable IDs, and required records  
**And** private-data guidance is shown  
**And** current application state remains unchanged.

## V2-AT-EXP-002 — Unicode round trip

**Given** campaign and journal text contains Greek characters, punctuation, emoji, and multiline text  
**When** it is exported and restored  
**Then** the text matches exactly within the supported normalization policy.

## V2-AT-IMP-001 — Validate before restore

**Given** a valid backup file  
**When** the user selects it  
**Then** the application displays an import preview before changing data  
**And** identifies scope, version, campaigns, counts, and warnings  
**And** cancelling makes no changes.

## V2-AT-IMP-002 — Invalid file preserves current data

**Given** the current workspace contains valid campaign data  
**When** the user selects a corrupted or invalid backup  
**Then** blocking errors are displayed  
**And** restore confirmation is unavailable  
**And** current data remains byte-for-byte or semantically unchanged.

## V2-AT-IMP-003 — Restore failure rollback

**Given** a valid import has passed preview  
**And** persistence fails during restore  
**When** the operation ends  
**Then** the prior valid workspace remains loadable  
**And** the user is told that restore failed and prior data was preserved.

## V2-AT-MIG-001 — Full v0.1 migration

**Given** a valid full v0.1 MVP fixture  
**When** v0.2 loads it  
**Then** a workspace and valid campaign are created or completed  
**And** existing characters, vows, tracks, journal entries, rolls, and oracle results belong to that campaign  
**And** stable IDs and timestamps are preserved where available  
**And** the migrated output passes v0.2 validation.

## V2-AT-MIG-002 — Migration failure preserves source

**Given** an invalid legacy fixture with a migration-blocking condition  
**When** migration fails  
**Then** the legacy source remains stored  
**And** the schema version is not falsely marked current  
**And** recovery options are shown.

## V2-AT-REC-001 — Corrupted-data recovery

**Given** application-owned stored data cannot be parsed  
**When** the app opens  
**Then** it shows a recovery screen rather than normal first-run onboarding  
**And** offers Retry and Import Backup  
**And** offers Reset only as a separated destructive action.

## V2-AT-REC-002 — Safe reset

**Given** the browser origin contains Ironsworn-owned keys and an unrelated test key  
**When** the user confirms Reset Application  
**Then** Ironsworn-owned state is removed  
**And** the unrelated key remains  
**And** in-memory state returns to first-run status.

## V2-AT-A11Y-001 — Keyboard campaign and session flow

**Given** the user operates by keyboard only  
**When** they switch campaigns, start a session, complete it, open history filters, and cancel a confirmation  
**Then** all controls are reachable in a logical order  
**And** focus is visible  
**And** modal/drawer focus returns correctly.

## V2-AT-MOB-001 — Mobile backup and restore

**Given** a supported narrow viewport  
**When** the user opens Data Management and previews an import  
**Then** text and actions do not overflow horizontally  
**And** critical warnings remain visible  
**And** confirmation actions do not obscure content.

---

# 12. Unit and Integration Test Matrix

## 12.1 Campaign ownership

- Create IDs and default status.
- Validate active campaign belongs to workspace.
- Reject cross-campaign active character/session references.
- Scope repository queries by campaign.
- Archive/restore state transitions.
- Delete only owned records.
- Select a valid replacement active campaign.

## 12.2 Session invariants

- One active/paused session per campaign.
- Completed session requires valid `endedAt`.
- End time is not earlier than start time.
- Session-linked records share `campaignId`.
- Records outside sessions remain valid.
- Deleting/archiving sessions follows non-cascade policy.

## 12.3 Activity/history

- Correct event type and entity snapshot.
- Bounded recent query.
- Broken linked entity renders safely.
- Search/filter remains campaign-scoped.
- Pagination ordering is deterministic.
- Undo snapshots use allowlisted fields if implemented.

## 12.4 Export

- Required envelope fields.
- Correct manifest counts.
- Stable relationship serialization.
- User-authored text encoding.
- Exclusion of unrelated storage.
- Export failure causes no mutation.
- Content references remain licensing-safe.

## 12.5 Import

- Format and schema compatibility.
- Required entity/field validation.
- Duplicate and missing references.
- Cross-campaign relationship rejection.
- Enum and timestamp validation.
- Warning versus blocking error classification.
- Atomic commit and rollback.
- Sanitized display of imported text.

## 12.6 Migration

- Deterministic transformation.
- ID/timestamp preservation.
- Default campaign creation.
- Active campaign initialization.
- Orphan detection.
- No fabricated session links.
- Original-data preservation on failure.
- Future-schema rejection.

---

# 13. Persistence and Data-Safety Matrix

| Test | Expected result |
|---|---|
| Reload after campaign create | Campaign and active selection restore. |
| Reload during active session | Session remains available according to lifecycle policy. |
| Switch with successful autosave | New campaign loads; prior edits remain. |
| Switch with failed save | Switch is blocked or explicit user decision is requested. |
| Storage write failure | Failure is visible; prior valid revision remains. |
| Storage quota exceeded | Clear warning and backup/recovery guidance. |
| Rapid duplicate create/start/complete click | One logical operation occurs. |
| Invalid active campaign reference | Safe selection/recovery state; no crash. |
| Export failure | No domain state mutation. |
| Cancel import preview | No storage mutation. |
| Restore persistence failure | Previous valid workspace remains. |
| Migration failure | Legacy source remains; current schema is not falsely committed. |
| Reset | Only documented app-owned data is removed. |

---

# 14. UX, Responsive, and Accessibility Matrix

Test each core flow at desktop, tablet, and phone widths:

- Campaign switcher.
- Campaign list and creation.
- Archive/restore/delete confirmation.
- Start/resume/complete session.
- Play dashboard returning context.
- Session history and filters.
- Data Management.
- Export status.
- Import file selection, validation, preview, and confirmation.
- Migration and recovery screens.

Accessibility checks:

- Accessible names include campaign/session context.
- Status is not color-only.
- Keyboard order is logical.
- Focus trap/restore works in dialogs and sheets.
- Async errors/status are announced appropriately.
- Validation is associated with controls.
- Touch targets meet baseline.
- Text contrast meets baseline.
- Long titles, filenames, summaries, and error messages wrap safely.
- 200% zoom/reflow sanity check where practical.

---

# 15. Content and Licensing Matrix

| Check | Expected result |
|---|---|
| Campaign/session helper text | Project-original or approved and inventoried. |
| Test fixture text | Project-original; no copied rulebook examples. |
| Icons | Independent approved icon source; no copied official icons. |
| Layout | Original application layout; no reproduction of rulebook pages/cards. |
| Backup package | Does not silently redistribute unapproved bundled content. |
| User-authored text | Treated as private application data. |
| About/legal | Attribution and unofficial-product notice remain accessible. |
| Public screenshots | Do not expose real private notes or prohibited official content. |
| Release validation | Unknown/restricted content remains blocked. |

---

# 16. Regression Smoke Set

Every v0.2 release candidate must verify:

1. Create or resume a character.
2. Edit and reload character state.
3. Make an action roll and save history.
4. Use momentum burn when eligible.
5. Create/update a progress track and make a progress roll.
6. Roll an approved oracle and save/copy its result.
7. Create a vow, mark progress, and add a milestone.
8. Create/edit a journal entry.
9. Complete onboarding from first run.
10. Create and switch campaigns.
11. Start and complete a session.
12. Export a backup.
13. Validate and restore a backup.
14. Verify attribution, unofficial disclaimer, and content gate.
15. Verify desktop and mobile navigation.

---

# 17. Performance and Volume Checks

Representative campaign fixture:

- 10 campaigns in workspace.
- 100 sessions in one campaign.
- 1,000 journal/history records.
- 500 roll/oracle records.
- 100 active/archived vows and tracks combined.

Acceptance expectations:

- Campaign list remains responsive.
- Play dashboard loads bounded recent data rather than all history.
- History uses pagination/incremental loading.
- Filters complete within an acceptable interactive threshold for local data.
- Export provides progress or prevents duplicate actions for large data.
- Import validation does not freeze the UI indefinitely; if synchronous, limits are documented.

Exact timing thresholds should be set after profiling the current architecture and target devices.

---

# 18. Closed Playtest / UAT Plan

## 18.1 Participants

Recommended minimum:

- 3–5 solo Ironsworn players.
- At least one existing MVP user with legacy data.
- At least one mobile-primary tester.
- Product owner or QA observer for structured acceptance runs.

## 18.2 Duration

Each participant should use one campaign across at least three sessions on different days where practical.

## 18.3 Required tasks

- Create or migrate a campaign.
- Start and complete sessions.
- Resume after closing the app.
- Review last-session context.
- Find a prior roll or journal entry.
- Create a second campaign and switch between them.
- Export a backup.
- Restore a provided test backup or restore their own after a controlled reset in a test environment.

## 18.4 Feedback questions

- Was the active campaign always clear?
- Did session management help or interrupt play?
- Could you understand where you left off?
- Did you trust the save and backup behavior?
- Was history easy to navigate?
- Were archive, delete, restore, and reset consequences clear?
- Did you need another tool for core campaign continuity?
- Which step caused the most hesitation?

## 18.5 UAT success signal

- All participants complete the required campaign/session journey.
- No participant experiences unrecoverable data loss.
- Most participants describe the last-session/recent-context view as useful.
- No consistent confusion remains around active campaign, session status, export scope, or restore consequences.

---

# 19. Defect Severity

| Severity | Definition | Examples |
|---|---|---|
| Blocker | Prevents QA/playtest or makes core data inaccessible with no recovery | App cannot load any campaign; restore destroys all state. |
| Critical | Causes data loss, cross-campaign corruption, security/privacy exposure, or invalid release content | Deleting A removes B; invalid import overwrites valid data. |
| High | Breaks a required campaign/session/backup flow with a workaround only | Cannot complete session; migration drops optional but important history. |
| Medium | Material usability, accessibility, filtering, or feedback defect | Campaign context unclear; focus lost after dialog; filter state misleading. |
| Low | Cosmetic or minor text/layout issue without workflow impact | Non-critical spacing, minor timestamp formatting. |

Release policy:

- No Blocker or Critical defects open.
- High defects fixed or explicitly accepted with documented user impact and mitigation.
- Accessibility defects that block keyboard or mobile core flows are High or Critical according to impact.

---

# 20. Traceability Summary

| Requirement group | Primary tests |
|---|---|
| V2-CAMP | V2-AT-CAMP-001 to 004; ownership unit/integration matrix |
| V2-SESS | V2-AT-SESS-001 to 004; session invariant matrix |
| V2-CONT | V2-AT-CONT-001; Play dashboard UAT |
| V2-HIST | V2-AT-HIST-001; filter/pagination tests |
| V2-CHG | Correction/duplicate-action integration tests; conditional undo tests |
| V2-EXP | V2-AT-EXP-001 to 002; export matrix |
| V2-IMP | V2-AT-IMP-001 to 003; import fixture suite |
| V2-MIG | V2-AT-MIG-001 to 002; migration fixtures |
| V2-DATA | Persistence/data-safety matrix |
| V2-UXF | V2-AT-A11Y-001, V2-AT-MOB-001, responsive/accessibility matrix |

---

# 21. Release Acceptance

v0.2 may be approved when:

- Every Must global acceptance criterion passes.
- Every release gate passes or has a documented product-owner waiver.
- Campaign separation has no known defect.
- Supported v0.1 migration passes all required fixtures.
- Valid export/restore round-trip passes.
- Invalid and failed restore tests preserve prior data.
- Recovery and reset behavior is safe and understandable.
- Existing MVP regression smoke tests pass.
- Responsive and accessibility baseline passes.
- Closed playtest demonstrates successful multi-session campaign use.
- Content/licensing review passes.
- No Blocker or Critical defects remain open.

---

# 22. Open Questions

1. What exact v0.1 schema variants are supported for automatic migration?
2. Is backup scope campaign, workspace, or both?
3. Is merge restore included or explicitly deferred?
4. Is paused session state implemented?
5. What changes are eligible for undo?
6. What volume and timing thresholds define acceptable history/export/import performance?
7. Is raw recovery export included?
8. Which browsers are formally supported for public v0.2 release?
9. What UAT participant count is required for milestone approval?

---

# 23. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Product Owner |  | Pending |  |
| Development Lead |  | Pending |  |
| QA / Test Lead |  | Pending |  |
| UX / Accessibility Reviewer |  | Pending |  |
| Content / Licensing Reviewer |  | Pending |  |
