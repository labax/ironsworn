# Ironsworn Digital Companion

## v0.2 — Solo Campaign Depth: Functional Requirements Supplement

*Version 0.2 | Draft | Prepared for the Ironsworn Project*

| Field | Value |
|---|---|
| Document owner | Product Owner / Project Lead |
| Parent document | Ironsworn Digital Companion Functional Requirements Document v0.1 |
| Related addenda | v0.2 Business and Scope Addendum; v0.2 Data Model Addendum; v0.2 UX Requirements Addendum; v0.2 Acceptance Criteria / Test Plan |
| Target release | v0.2 — Solo Campaign Depth |
| Status | Draft for review |

---

## 1. Purpose

This supplement defines the user-visible functional behavior required for **v0.2 — Solo Campaign Depth**.

It extends the Functional Requirements Document v0.1. Existing MVP requirements remain valid unless explicitly superseded. This supplement focuses on campaign separation, session lifecycle, returning-player context, history navigation, backup and restore, migration, recovery, and data-safety behavior.

The document specifies observable product behavior. It does not prescribe the final storage technology, component architecture, database implementation, or visual design.

---

## 2. Functional Context

The MVP supports one usable play workspace. v0.2 must make that workspace dependable for repeated use over multiple sessions and multiple campaigns.

The release should support the following expanded journey:

1. Open the application.
2. Select or resume a campaign.
3. Review the previous session and recent activity.
4. Start or resume the current session.
5. Use existing character, move, tracker, oracle, vow, and journal features.
6. Pause or complete the session.
7. Return later with state preserved.
8. Export a backup and restore it safely when needed.

---

## 3. Scope Summary

| Functional area | Requirement range | Priority |
|---|---|---|
| Campaign management | V2-CAMP-001 to V2-CAMP-022 | Must / Should |
| Session lifecycle | V2-SESS-001 to V2-SESS-026 | Must / Should |
| Returning-player context | V2-CONT-001 to V2-CONT-014 | Must / Should |
| Journal and history navigation | V2-HIST-001 to V2-HIST-020 | Must / Should |
| Correction and change safety | V2-CHG-001 to V2-CHG-014 | Should / Could |
| Backup export | V2-EXP-001 to V2-EXP-016 | Must / Should |
| Import and restore | V2-IMP-001 to V2-IMP-024 | Must / Should |
| Migration and recovery | V2-MIG-001 to V2-MIG-022 | Must / Should |
| Persistence and storage communication | V2-DATA-001 to V2-DATA-014 | Must / Should |
| Navigation, responsive, and accessibility behavior | V2-UXF-001 to V2-UXF-018 | Must / Should |

---

## 4. Priority Definitions

| Priority | Meaning |
|---|---|
| Must | Required for v0.2 release acceptance unless explicitly descoped by product decision. |
| Should | Important for campaign depth or confidence, but may be deferred with documented risk. |
| Could | Useful enhancement if time and risk allow. |
| Won't | Explicitly excluded from v0.2. |

---

# 5. Detailed Functional Requirements

## 5.1 Campaign Management

### Goal

Allow a player to maintain multiple campaigns as separate, durable containers for all related gameplay records.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| V2-CAMP-001 | The system shall provide a campaign list. | Must | The user can view all active and archived campaigns available in the current workspace. |
| V2-CAMP-002 | The system shall allow the user to create a campaign. | Must | A new campaign can be created with a unique stable ID and default status. |
| V2-CAMP-003 | Campaign creation shall require a title and may accept an optional description or premise. | Must | A valid title creates the campaign; optional text persists when provided. |
| V2-CAMP-004 | The system shall identify one active campaign. | Must | The active campaign is visible in the application shell or primary workspace. |
| V2-CAMP-005 | The system shall allow the user to switch the active campaign explicitly. | Must | Switching changes the visible character, vows, tracks, sessions, journal, rolls, and oracle history to the selected campaign only. |
| V2-CAMP-006 | The system shall not mix records from different campaigns in campaign-scoped views. | Must | Data from campaign A does not appear in campaign B unless a deliberate cross-campaign feature is explicitly provided. |
| V2-CAMP-007 | The system shall persist the last active campaign across ordinary reloads. | Must | Reopening the app resumes the last valid active campaign or displays a safe selection state. |
| V2-CAMP-008 | The system shall allow the user to rename a campaign. | Must | The new title persists and does not alter child-record ownership. |
| V2-CAMP-009 | The system should allow the user to edit a campaign description or premise. | Should | Edited text persists and is shown in campaign details where supported. |
| V2-CAMP-010 | The system shall allow the user to archive an active campaign after confirmation. | Must | The campaign is removed from the default active list but its data remains recoverable. |
| V2-CAMP-011 | The system shall allow the user to restore an archived campaign. | Must | Restoring returns the campaign to the active campaign list without losing records. |
| V2-CAMP-012 | The system shall allow permanent deletion only after an explicit high-friction confirmation. | Must | The user is told what will be deleted and must deliberately confirm. |
| V2-CAMP-013 | Permanent campaign deletion shall remove only data owned by that campaign. | Must | Other campaigns and non-Ironsworn browser data remain unchanged. |
| V2-CAMP-014 | The system shall handle deletion of the active campaign safely. | Must | The app selects another valid campaign or returns to a no-campaign state without broken references. |
| V2-CAMP-015 | The system shall show campaign status, creation date, and last activity date where available. | Should | Campaign list entries provide enough context to identify the correct campaign. |
| V2-CAMP-016 | The system should show counts or summaries such as characters, active vows, or sessions without requiring full campaign load. | Could | Summary values are accurate and do not leak another campaign's data. |
| V2-CAMP-017 | The system should allow duplication of a campaign only if the copy behavior is explicitly defined. | Could | Duplicated records receive new IDs and do not share mutable references with the source. |
| V2-CAMP-018 | The system shall provide a clear empty state when no campaign exists. | Must | The empty state offers creation and valid import/restore paths. |
| V2-CAMP-019 | Existing v0.1 user data shall be assigned to a valid campaign during migration. | Must | Existing records remain linked and usable after migration. |
| V2-CAMP-020 | The system shall prevent activation of an invalid or incompletely migrated campaign. | Must | The user sees an actionable recovery message and valid campaigns remain available. |
| V2-CAMP-021 | Campaign actions shall expose clear success or failure feedback. | Must | Create, rename, archive, restore, switch, and delete outcomes are not ambiguous. |
| V2-CAMP-022 | Campaign management shall remain usable by keyboard and at supported mobile widths. | Must | Core campaign actions pass responsive and accessibility acceptance checks. |

---

## 5.2 Session Lifecycle

### Goal

Provide lightweight session structure that improves continuity without turning play into administrative work.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| V2-SESS-001 | The system shall allow the user to start a new session within the active campaign. | Must | A session record is created with campaign ownership, start time, and active status. |
| V2-SESS-002 | Starting a session shall not require a title or summary. | Must | The user can begin immediately; defaults may be generated from date/time. |
| V2-SESS-003 | The system should allow an optional session title at start or later. | Should | The title can be added or edited without changing session ownership. |
| V2-SESS-004 | The system shall allow only one active session per campaign unless a future rule explicitly permits more. | Must | Attempting to start another session prompts the user to resume or close the existing one. |
| V2-SESS-005 | The system shall allow the user to resume an active session. | Must | Existing linked journal, roll, oracle, and activity records remain associated with it. |
| V2-SESS-006 | The system shall allow the user to leave or pause an active session without completing it. | Must | Session state remains active or paused according to the chosen model and data is saved. |
| V2-SESS-007 | The system shall allow the user to complete a session deliberately. | Must | The session receives an end time and completed status. |
| V2-SESS-008 | Session completion should allow an optional summary. | Should | The summary persists and is shown in session history. |
| V2-SESS-009 | The system shall allow editing of session title and summary after completion. | Should | Edits preserve linked records and timestamps other than the update timestamp. |
| V2-SESS-010 | The system shall provide chronological session history for the active campaign. | Must | Sessions are displayed in a deterministic date/time order. |
| V2-SESS-011 | The system shall allow the user to open a session detail view. | Must | The view shows title, status, dates, summary, and linked records or activity. |
| V2-SESS-012 | New journal entries created during an active session shall be linked to that session by default. | Must | The stored session ID is correct and visible through history navigation. |
| V2-SESS-013 | New roll records created during an active session shall be linked to that session by default. | Must | The roll appears in both campaign history and the active session context. |
| V2-SESS-014 | New oracle-result records created during an active session shall be linked to that session by default where persisted. | Must | The result can be found through the session context. |
| V2-SESS-015 | Significant vow and progress changes should create session-linked activity records where activity history is implemented. | Should | The activity identifies the affected object and change type. |
| V2-SESS-016 | Records created outside an active session shall remain valid campaign records with a null or absent session link. | Must | No artificial session is required for normal editing outside play. |
| V2-SESS-017 | The system should allow an unlinked record to be assigned to a session manually. | Could | Reassignment updates only the session relationship and relevant timestamps. |
| V2-SESS-018 | The system should allow a session to be reopened after completion with confirmation. | Could | Reopening is explicit and preserves the prior end time in history or records the transition. |
| V2-SESS-019 | The system shall prevent deleting a session from silently deleting linked campaign records. | Must | The user is offered a defined option such as unlinking records or cancelling. |
| V2-SESS-020 | If session deletion is supported, it shall require confirmation and describe the treatment of linked records. | Should | No linked journal, roll, oracle, vow, or track data is lost unexpectedly. |
| V2-SESS-021 | The system shall display the current session state in the play workspace. | Must | The player can tell whether a session is active, paused, or absent. |
| V2-SESS-022 | Session timestamps shall use a consistent internal format and user-facing local display. | Must | Ordering is reliable and displayed values are understandable. |
| V2-SESS-023 | Session start and completion operations shall be safe against duplicate rapid submission. | Must | One deliberate action creates or completes one session transition. |
| V2-SESS-024 | The system shall save session state before ordinary navigation away from the session view. | Must | Navigation does not discard entered title or summary text without warning. |
| V2-SESS-025 | Session management shall work without network access in local-first mode. | Must | Start, resume, complete, and review work offline. |
| V2-SESS-026 | Session lifecycle controls shall be accessible and responsive. | Must | Controls are labelled, keyboard operable, and usable at supported mobile widths. |

---

## 5.3 Returning-Player Context

### Goal

Help a player understand where they left off and return to play quickly.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| V2-CONT-001 | The Play workspace shall show the active campaign clearly. | Must | The campaign title is visible without opening settings. |
| V2-CONT-002 | The Play workspace shall show whether a session is active. | Must | The current session state and primary action are visible. |
| V2-CONT-003 | The system shall provide a last-session summary or equivalent context when a completed session exists. | Must | The player can see its date, title/default label, and summary or recent activity. |
| V2-CONT-004 | The system shall show recent campaign activity. | Must | Recent entries are ordered and scoped to the active campaign. |
| V2-CONT-005 | Recent activity shall identify the record type and relevant title or label. | Must | The user can distinguish rolls, journal entries, vows, tracks, sessions, and oracles. |
| V2-CONT-006 | Recent activity items should link to their source object where the object still exists. | Should | Selecting an item opens the relevant detail or history view. |
| V2-CONT-007 | The system shall show active vows and active progress tracks prominently enough to resume play. | Must | The player can access current goals without searching the full archive. |
| V2-CONT-008 | The system should show the most recent journal note or excerpt. | Should | The excerpt respects line limits and opens the full entry. |
| V2-CONT-009 | The system should show the most recent roll and oracle result where useful. | Could | Results are clearly labelled and do not replace narrative interpretation. |
| V2-CONT-010 | Returning-player context shall handle a new empty campaign gracefully. | Must | The user sees setup guidance instead of broken or misleading empty panels. |
| V2-CONT-011 | Returning-player context shall handle archived or deleted linked records safely. | Must | Activity shows an unavailable state or omits the broken link without crashing. |
| V2-CONT-012 | The system shall not display another campaign's recent activity. | Must | Campaign separation tests pass. |
| V2-CONT-013 | Recent-context components shall use bounded result counts or pagination. | Must | Large histories do not render unbounded lists on the main workspace. |
| V2-CONT-014 | Returning-player context shall remain usable at desktop and mobile widths. | Must | Key information is readable and actions remain operable. |

---

## 5.4 Journal and History Navigation

### Goal

Make accumulated campaign history practical to browse without changing the existing fiction-first journal model.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| V2-HIST-001 | Journal and history views shall be scoped to the active campaign by default. | Must | Only active-campaign records appear unless the user deliberately changes scope. |
| V2-HIST-002 | The system shall provide chronological ordering controls or a documented default order. | Must | Ordering remains stable across reloads. |
| V2-HIST-003 | The system shall allow filtering by record type. | Must | The user can isolate journal entries, rolls, oracle results, or activity types supported by the view. |
| V2-HIST-004 | The system shall allow filtering by session. | Must | Selecting a session limits results to that session's linked records. |
| V2-HIST-005 | The system should allow filtering by date range. | Should | Invalid date ranges produce clear validation. |
| V2-HIST-006 | The system should allow filtering by linked vow or progress track. | Should | Results show only records linked to the selected object. |
| V2-HIST-007 | The system should provide text search over user-authored journal titles and text. | Should | Search does not expose or index data from another campaign. |
| V2-HIST-008 | The system shall provide a clear no-results state for filters. | Must | The state explains that no matching records were found and allows clearing filters. |
| V2-HIST-009 | Applied filters shall be visible and removable. | Must | The user can understand why a record is not shown. |
| V2-HIST-010 | The system should preserve relevant filter state while navigating into and back from an item. | Should | Returning to the list does not unexpectedly reset the user's context. |
| V2-HIST-011 | The system shall use bounded page sizes, incremental loading, or equivalent performance controls. | Must | Large histories remain usable. |
| V2-HIST-012 | Journal entries shall continue to support user-authored editing according to existing requirements. | Must | v0.2 navigation does not make existing entries read-only. |
| V2-HIST-013 | Completed roll records shall remain immutable except through explicit correction or amendment behavior. | Must | Historical dice and results are not silently recalculated. |
| V2-HIST-014 | Historical records shall display campaign and session context where relevant. | Should | The user can identify where the record belongs. |
| V2-HIST-015 | Archived vows and tracks should remain discoverable through filters or archive views. | Should | Archiving does not erase linked history. |
| V2-HIST-016 | Deleting a linked source record shall not corrupt journal or history rendering. | Must | Stored snapshots or unavailable-link states render safely. |
| V2-HIST-017 | History views shall communicate loading and storage errors. | Must | Failures are not shown as empty successful states. |
| V2-HIST-018 | The system should support copying or exporting selected user-authored journal text where already permitted. | Could | Copy/export preserves text and does not include unrelated private records. |
| V2-HIST-019 | History navigation shall be keyboard accessible. | Must | Filters, lists, and detail navigation have usable focus and labels. |
| V2-HIST-020 | History navigation shall remain usable on mobile. | Must | Filters use drawers, sheets, or stacked controls without horizontal overflow. |

---

## 5.5 Correction and Change Safety

### Goal

Reduce the impact of accidental manual state changes while preserving the player's ability to correct or override values.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| V2-CHG-001 | The system shall continue to allow manual correction of character, momentum, progress, vow, and journal state. | Must | v0.2 history features do not lock legitimate correction workflows. |
| V2-CHG-002 | The system should record significant manual changes in activity history. | Should | Activity identifies object, change type, timestamp, and previous/new values where appropriate. |
| V2-CHG-003 | The system should provide undo for the most recent eligible state change. | Should | Undo restores the previous valid state and creates or updates history transparently. |
| V2-CHG-004 | Undo shall not silently remove immutable roll records. | Must if undo is implemented | Roll correction uses amendment or replacement semantics instead. |
| V2-CHG-005 | Undo availability shall be time- or sequence-bounded and visibly communicated. | Should | The user is not promised unlimited historical rollback. |
| V2-CHG-006 | The system shall not offer undo after the affected object has been deleted, migrated, or otherwise made incompatible. | Must if undo is implemented | The unavailable action is disabled or explained. |
| V2-CHG-007 | Corrections that affect derived values shall recalculate or prompt according to existing rules-engine requirements. | Must | Momentum and related values remain internally valid. |
| V2-CHG-008 | The system should allow a correction note for significant historical amendments. | Could | The note is user-authored and linked to the relevant change. |
| V2-CHG-009 | Activity history shall not be presented as complete legal-grade audit logging. | Must | User-facing wording remains accurate to product capability. |
| V2-CHG-010 | Change-history failure shall not block the underlying valid state update unless consistency would be compromised. | Should | Failure behavior is documented and tested. |
| V2-CHG-011 | Duplicate rapid actions shall be prevented where they would create duplicate records or increments. | Must | Repeated clicks or taps do not accidentally double-apply a change. |
| V2-CHG-012 | Destructive actions shall not be undoable only through browser refresh or hidden behavior. | Must | A defined confirmation or restore path exists. |
| V2-CHG-013 | Correction controls shall be accessible. | Must | Buttons have labels, focus, and clear disabled states. |
| V2-CHG-014 | Correction behavior shall be included in backup and restore validation. | Should | Restored state and history remain coherent. |

---

## 5.6 Backup Export

### Goal

Allow the player to create a portable, versioned backup of high-value campaign data.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| V2-EXP-001 | The system shall allow the user to export a complete backup. | Must | The export operation produces a user-downloadable file. |
| V2-EXP-002 | The system shall define whether export scope is one campaign or the whole workspace and communicate that scope clearly. | Must | The user knows exactly what will be included before export. |
| V2-EXP-003 | The export shall include a format identifier and schema version. | Must | Import can identify compatible and incompatible packages. |
| V2-EXP-004 | The export shall include stable IDs and required relationships. | Must | A restore can reconstruct links among campaigns, sessions, characters, vows, tracks, rolls, oracles, and journal entries. |
| V2-EXP-005 | The export shall include user-authored campaign data required by the defined scope. | Must | Character, vow, track, session, journal, roll, and persisted oracle data are present where applicable. |
| V2-EXP-006 | The export shall not include unrelated browser storage or data owned by another application. | Must | Only Ironsworn-owned records are exported. |
| V2-EXP-007 | The export shall validate current data before generating the package. | Must | Invalid state produces an actionable error rather than a misleading backup. |
| V2-EXP-008 | The export should include creation time, application version, and export scope metadata. | Should | Metadata is available to import preview and support diagnostics. |
| V2-EXP-009 | The export should include content-source identifiers needed to interpret references without redistributing unapproved content. | Should | References remain traceable and licensing-safe. |
| V2-EXP-010 | The export shall preserve user-authored text exactly within the supported encoding. | Must | Unicode and multiline text round-trip successfully. |
| V2-EXP-011 | The export shall use a deterministic or documented serialization shape. | Must | Automated tests can compare required structure reliably. |
| V2-EXP-012 | Export failure shall leave application data unchanged. | Must | No state mutation occurs because an export failed. |
| V2-EXP-013 | The export action shall provide success and failure feedback. | Must | The user knows whether a file was generated. |
| V2-EXP-014 | The UI shall warn that exported backups may contain private campaign notes. | Must | Privacy guidance appears before or during export. |
| V2-EXP-015 | The export filename should include a safe campaign/workspace label and date. | Should | The filename is valid on common desktop platforms. |
| V2-EXP-016 | Export shall work at supported mobile widths where browser download capability permits. | Should | Unsupported platform behavior is explained rather than failing silently. |

---

## 5.7 Import and Restore

### Goal

Restore a supported backup safely without corrupting or silently replacing current valid data.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| V2-IMP-001 | The system shall allow the user to select a supported backup file for import. | Must | The file picker accepts the documented format and rejects unsupported types clearly. |
| V2-IMP-002 | The system shall parse and validate the file before changing application state. | Must | Parsing or validation failure leaves current data unchanged. |
| V2-IMP-003 | Validation shall check format identifier and schema version. | Must | Unknown formats and unsupported versions are rejected or routed to a defined migration path. |
| V2-IMP-004 | Validation shall check required entities, fields, IDs, and relationships. | Must | Missing required relationships produce an actionable report. |
| V2-IMP-005 | Validation shall check enum values and core domain invariants. | Must | Invalid states are identified before restore. |
| V2-IMP-006 | The system shall present an import preview or summary before confirmation. | Must | The preview identifies scope, campaign names/counts, record counts, version, and warnings where available. |
| V2-IMP-007 | The system shall require explicit confirmation before replacement or merge. | Must | Selecting a file alone never changes current data. |
| V2-IMP-008 | The system shall clearly distinguish replacement from merge if both are supported. | Must | The user understands the effect of the selected restore mode. |
| V2-IMP-009 | v0.2 may support replacement-only restore if merge semantics are not fully defined. | Must | The UI does not imply merge when only replacement exists. |
| V2-IMP-010 | Before replacement, the system should offer or create a safety export of current data. | Should | The user can retain the previous state. |
| V2-IMP-011 | Restore shall be atomic from the user's perspective. | Must | A failed restore does not leave a partially replaced workspace. |
| V2-IMP-012 | The system shall preserve current data if storage fails during restore. | Must | Rollback or staging behavior prevents partial corruption. |
| V2-IMP-013 | The system shall report warnings separately from blocking errors. | Must | The user can distinguish safe migrations from invalid packages. |
| V2-IMP-014 | Imported stable IDs shall be preserved for replacement restores. | Must | Internal relationships remain valid. |
| V2-IMP-015 | If merge is implemented, ID conflicts shall be resolved through documented rules rather than silent overwrite. | Must if merge is implemented | Conflict behavior is deterministic and reported. |
| V2-IMP-016 | Imported content references shall not cause unapproved bundled content to be installed silently. | Must | User-authored references remain references unless an approved content-pack mechanism exists. |
| V2-IMP-017 | The system shall treat imported files as data, not executable code. | Must | No script, template execution, or remote code path is introduced. |
| V2-IMP-018 | The system shall sanitize user-facing imported labels where necessary for safe rendering. | Must | Imported text cannot inject executable markup. |
| V2-IMP-019 | Successful restore shall update the active campaign safely. | Must | The app opens a valid restored campaign or campaign selection view. |
| V2-IMP-020 | Successful restore shall provide a summary. | Must | The user sees what was restored and any non-blocking warnings. |
| V2-IMP-021 | Import cancellation shall make no changes. | Must | Closing preview or declining confirmation preserves state. |
| V2-IMP-022 | Repeated import submission shall not create duplicate replacement operations. | Must | Restore is guarded against duplicate rapid actions. |
| V2-IMP-023 | Import errors shall be accessible and actionable. | Must | Errors are announced, readable, and associated with next steps. |
| V2-IMP-024 | Import and restore shall be covered by deterministic fixtures and end-to-end acceptance tests. | Must | Valid, invalid, corrupted, and incompatible samples are tested. |

---

## 5.8 Migration and Recovery

### Goal

Support schema evolution and recover gracefully from invalid local data.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| V2-MIG-001 | Persisted application data shall include a schema version. | Must | The loader can identify unversioned, current, older, and future data. |
| V2-MIG-002 | The system shall provide a documented migration path from the supported v0.1 schema to v0.2. | Must | Existing MVP fixtures migrate successfully. |
| V2-MIG-003 | Migration shall assign existing records to a valid campaign. | Must | No required record remains orphaned after migration. |
| V2-MIG-004 | Migration shall create or infer session links only where safe; otherwise links may remain absent. | Must | Historical records are not assigned fabricated sessions without a documented rule. |
| V2-MIG-005 | Migration shall preserve stable IDs where possible. | Must | Existing references continue to resolve. |
| V2-MIG-006 | Migration shall preserve user-authored text and timestamps where available. | Must | Text round-trips and chronology remains meaningful. |
| V2-MIG-007 | Migration shall be deterministic. | Must | The same input produces the same migrated output. |
| V2-MIG-008 | Migration shall validate output before replacing stored data. | Must | Invalid migrated output is not committed. |
| V2-MIG-009 | The system should create an in-memory or persisted safety snapshot before migration. | Should | Recovery is possible if commit fails. |
| V2-MIG-010 | Migration failure shall preserve the original stored data. | Must | The original data remains available for retry or export. |
| V2-MIG-011 | The user shall receive a clear message when migration succeeds, fails, or requires action. | Must | No silent migration failure occurs. |
| V2-MIG-012 | The system shall reject data from an unsupported future schema without attempting destructive downgrade. | Must | Current data is unchanged and the user sees compatibility guidance. |
| V2-MIG-013 | The system shall distinguish an empty workspace from corrupted data. | Must | Corruption does not trigger a misleading first-run flow. |
| V2-MIG-014 | The system shall provide a recovery state when primary data cannot be loaded. | Must | The user can retry, import a backup, reset app-owned data, or inspect guidance according to available options. |
| V2-MIG-015 | Recovery shall not call a broad browser-storage clear operation. | Must | Only documented Ironsworn-owned keys and records are affected. |
| V2-MIG-016 | The system should allow exporting raw or recoverable app-owned data for support before reset. | Should | The option does not claim the data is a valid normal backup. |
| V2-MIG-017 | Reset shall require explicit confirmation and state that local campaign data will be removed. | Must | Accidental reset is prevented. |
| V2-MIG-018 | Reset shall clear active in-memory state after removing app-owned persistence. | Must | The application returns to a clean first-run state. |
| V2-MIG-019 | Recovery and migration errors shall avoid exposing sensitive journal content unnecessarily in logs. | Must | Diagnostic output uses metadata or redaction. |
| V2-MIG-020 | Migration functions shall be testable without UI dependencies. | Must | Fixtures can be migrated in unit/integration tests. |
| V2-MIG-021 | Every supported migration shall have regression fixtures. | Must | Future changes can verify old-save compatibility. |
| V2-MIG-022 | Removed migration support shall require a documented product decision and user-facing compatibility policy. | Should | Old saves are not silently abandoned. |

---

## 5.9 Persistence and Storage Communication

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| V2-DATA-001 | All v0.2 campaign-depth records shall persist using the existing storage abstraction or its approved replacement. | Must | UI components do not write directly to ad hoc storage keys. |
| V2-DATA-002 | Save operations shall expose success, pending, or failure state where the user could otherwise lose confidence. | Must | The user can distinguish saved and failed state. |
| V2-DATA-003 | The system shall retry or allow retry of recoverable save failures. | Must | A visible retry path exists. |
| V2-DATA-004 | Save failures shall not be shown as successful. | Must | Status and messaging remain accurate. |
| V2-DATA-005 | Campaign switching shall flush or resolve pending edits before changing active context. | Must | Edits are saved or the user is warned. |
| V2-DATA-006 | Storage writes shall avoid partial multi-record updates where relationships would become inconsistent. | Must | Coordinated save or transaction-like staging is used. |
| V2-DATA-007 | The application shall document that local-first data is tied to the current browser/profile/device unless exported. | Must | The notice is available in Settings/About or backup UI. |
| V2-DATA-008 | The application shall not describe local export as automatic cloud backup. | Must | User-facing copy is accurate. |
| V2-DATA-009 | The application should show the most recent successful save time. | Should | The value is updated only after confirmed save success. |
| V2-DATA-010 | The application shall handle storage quota or write-denied errors. | Must | The user sees a clear warning and backup guidance. |
| V2-DATA-011 | The application should avoid storing transient filter and modal state in the durable campaign model. | Should | Backups contain domain data, not unnecessary UI noise. |
| V2-DATA-012 | Durable data shall use stable IDs and explicit ownership references. | Must | Campaign separation and restore tests pass. |
| V2-DATA-013 | Persistence errors shall be logged without exposing full private journal text by default. | Must | Logs are safe for normal diagnostics. |
| V2-DATA-014 | Persistence behavior shall be included in smoke and regression testing. | Must | Every release candidate verifies save, reload, switch, export, and restore paths. |

---

## 5.10 Navigation, Responsive, and Accessibility Behavior

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| V2-UXF-001 | The application shell shall provide access to campaign selection or switching. | Must | The action is discoverable without navigating through unrelated gameplay forms. |
| V2-UXF-002 | The active campaign shall be visible in the shell or Play workspace. | Must | The user can verify context before editing. |
| V2-UXF-003 | Starting or resuming a session shall be available from the Play workspace. | Must | The user does not need to open Settings. |
| V2-UXF-004 | Backup export and restore shall be available from Settings or a dedicated data-management view. | Must | Destructive and routine play actions are separated. |
| V2-UXF-005 | Campaign archive and permanent deletion shall not be placed beside common non-destructive actions without visual distinction. | Must | Destructive hierarchy is clear. |
| V2-UXF-006 | Modal and drawer workflows shall manage focus correctly. | Must | Focus moves into the surface and returns to the triggering control. |
| V2-UXF-007 | Confirmation dialogs shall name the affected campaign or scope. | Must | Generic ambiguous confirmation text is not used for destructive operations. |
| V2-UXF-008 | Status shall not be communicated through color alone. | Must | Text, icons, or labels identify active, archived, failed, and warning states. |
| V2-UXF-009 | Forms shall associate validation messages with the affected controls. | Must | Screen readers and keyboard users can identify errors. |
| V2-UXF-010 | Long campaign titles and user-authored text shall wrap or truncate safely. | Must | Layout does not overflow at supported widths. |
| V2-UXF-011 | Campaign and history lists shall use accessible names and predictable keyboard order. | Must | List items and actions are operable without a pointer. |
| V2-UXF-012 | Mobile campaign switching shall use a compact pattern such as a menu, sheet, or dedicated screen. | Must | The interaction remains clear on narrow screens. |
| V2-UXF-013 | Mobile filters shall not require horizontal scrolling. | Must | Filters stack, wrap, or use a drawer/sheet. |
| V2-UXF-014 | Backup and restore warnings shall remain readable before confirmation on mobile. | Must | Critical text is not clipped behind fixed controls. |
| V2-UXF-015 | Loading states shall preserve enough context to avoid accidental repeated actions. | Must | Buttons are disabled or guarded while operations run. |
| V2-UXF-016 | Error states shall provide a next action where recovery is possible. | Must | Retry, cancel, import, or reset options are explicit. |
| V2-UXF-017 | Empty states shall distinguish no campaign, no session, and no matching history. | Must | Each state offers relevant next steps. |
| V2-UXF-018 | Core workflows shall meet the project's agreed baseline for contrast, labels, focus visibility, keyboard operation, and responsive behavior. | Must | v0.2 acceptance tests pass. |

---

# 6. Cross-Feature Behavior

## 6.1 Ownership

Every character, session, vow, progress track, journal entry, roll record, and persisted oracle result must resolve to one campaign.

A null campaign owner is invalid for durable v0.2 records unless the record is explicitly transient or part of an import staging area.

## 6.2 Session linkage

Session linkage is optional for records created outside an active session, but campaign ownership is mandatory.

Deleting, archiving, or completing a session must not silently delete linked domain records.

## 6.3 Historical snapshots

Roll and oracle history should preserve the values displayed at creation time. Later edits to a move label, character name, vow title, or content definition must not silently rewrite historical results unless an explicit migration is required.

## 6.4 Autosave and navigation

Campaign switching, import, reset, and destructive actions must resolve pending edits before changing the ownership context or stored workspace.

## 6.5 Content and licensing

v0.2 does not require new official content. Any new bundled labels, guidance, examples, fixtures, or help text should be project-original unless an approved source and provenance record are provided.

---

# 7. v0.2 Exclusions

The following remain excluded:

- Full official move reference.
- Structured official asset catalogue.
- Asset automation.
- Custom content authoring.
- Accounts and cloud synchronization unless separately approved.
- Co-op sharing and real-time multiplayer.
- AI summaries or generated journal text.
- Maps, tokens, tactical combat, or VTT tooling.
- Monetization features.

---

# 8. Traceability Summary

| Business objective | Functional requirement groups |
|---|---|
| Ongoing solo campaigns | V2-CAMP, V2-SESS |
| Continuity between sessions | V2-CONT, V2-HIST |
| Data protection | V2-EXP, V2-IMP, V2-MIG, V2-DATA |
| Campaign separation | V2-CAMP, ownership rules, V2-DATA |
| History navigation | V2-HIST, V2-CONT |
| Future readiness | V2-CAMP, V2-SESS, V2-MIG |
| Product focus | Exclusions and content/licensing constraints |

---

# 9. Functional Acceptance Summary

v0.2 functional scope is acceptable when:

- Multiple campaigns can be created, selected, archived, restored, and safely deleted.
- Campaign-owned records remain separated.
- Sessions can be started, resumed, completed, and reviewed.
- Returning-player context identifies recent campaign state.
- Journal and history can be filtered by common context.
- A complete versioned backup can be exported.
- A valid backup can be restored after preview and confirmation.
- Invalid and incompatible imports leave current data unchanged.
- Supported v0.1 data migrates safely.
- Corrupted-data and reset workflows preserve clarity and limit deletion to app-owned data.
- Core functionality remains accessible and responsive.
- No blocked or unapproved content is introduced.

---

# 10. Open Questions

1. Is v0.2 backup scope one selected campaign, the complete workspace, or both?
2. Is import replacement-only, or is campaign-level merge required?
3. Should an active session have a separate `paused` state, or is `active` sufficient when the app is closed?
4. Which state changes qualify for undo in the first v0.2 release?
5. Should campaign duplication be included or deferred?
6. How long should recent activity be retained and how should it be paginated?
7. Should raw recovery export be offered when normal validation fails?
8. What is the minimum supported v0.1 schema version for automatic migration?

---

# 11. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Product Owner |  | Pending |  |
| Development Lead |  | Pending |  |
| QA / Test Lead |  | Pending |  |
| UX Reviewer |  | Pending |  |
| Content / Licensing Reviewer |  | Pending |  |
