# Business Requirements Document

## Ironsworn Digital Companion

*Version 0.1 \| Draft \| Prepared for the Ironsworn Project*

| **Document owner**    | Product Owner / Project Lead                                                                                                                                                      |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Primary purpose**   | Define the business need, target users, MVP scope, success measures, constraints, and approval criteria for an Ironsworn digital companion application.                           |
| **Source basis**      | Ironsworn Rulebook by Shawn Tomkin, current project decisions, and agreed MVP baseline: character sheet, move roller, momentum/progress trackers, oracle tables, and vow journal. |
| **Intended audience** | Founder/product owner, UX designer, developer, QA/tester, content/licensing reviewer, and future stakeholders.                                                                    |
| **Status**            | Draft for review; not yet a technical specification or implementation plan.                                                                                                       |

Important licensing note: The rulebook text is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International. Any public or commercial release must complete a dedicated content and licensing review before publication.

# Contents

1\. Executive Summary

2\. Business Context and Opportunity

3\. Business Objectives

4\. Stakeholders and Users

5\. Product Vision and Scope

6\. MVP Scope

7\. Business Requirements

8\. High-Level Functional Capabilities

9\. Non-Functional Business Requirements

10\. Content, Legal, and Licensing Requirements

11\. Success Metrics

12\. Assumptions, Dependencies, and Constraints

13\. Risks and Mitigations

14\. Release Approach

15\. Acceptance Criteria

16\. Open Questions

17\. Approval

# 1. Executive Summary

The Ironsworn Digital Companion will be a focused tool that helps players run Ironsworn sessions with less manual bookkeeping and faster access to core play aids. The product is not intended to replace the tabletop roleplaying experience. It should support the fiction-first style of play by reducing friction around character tracking, moves, dice results, progress tracks, oracle lookups, and vow journaling.

The initial business goal is to deliver a usable MVP for solo-first Ironsworn play, with enough structure to later support cooperative and guided modes. The MVP should validate whether players value a lightweight, rules-aware companion over generic notes, spreadsheets, dice rollers, or full virtual tabletop tools.

The rulebook defines Ironsworn as a tabletop RPG of perilous quests where players create a character, define aspects of the world, swear iron vows, and resolve dangerous or uncertain situations through choices and dice. It explicitly supports Guided, Cooperative, and Solo play, with solo and small-group play as a primary use case. The rulebook also centers the character sheet, moves, action rolls, momentum, progress tracks, oracles, vows, bonds, assets, and session flow as recurring play elements.

# 2. Business Context and Opportunity

Players running Ironsworn digitally often need to switch between a rulebook, character sheet, asset references, move references, oracle tables, dice rollers, and journaling tools. This fragmentation can slow play, especially for solo players who must also interpret outcomes and maintain narrative continuity.

A focused companion application can create business value by turning Ironsworn session management into a smoother workflow while preserving the game's core tabletop feel. The opportunity is strongest for players who want lightweight assistance rather than a complete VTT, automated GM, or full campaign platform.

# 3. Business Objectives

| **ID** | **Objective**                | **Business Rationale**                                                                                                           |
|--------|------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| BO-01  | Reduce session friction      | Give players a single place to track character state, roll moves, consult oracles, and record vows.                              |
| BO-02  | Validate MVP demand          | Release a small but complete solo-first MVP to test actual player usage and feedback before broader investment.                  |
| BO-03  | Protect future extensibility | Design the business scope so later additions such as campaigns, assets, multiplayer, or custom oracles are not blocked.          |
| BO-04  | Respect Ironsworn licensing  | Ensure any content usage, distribution, monetization, or attribution follows the applicable license and SRD requirements.        |
| BO-05  | Keep the product focused     | Avoid overbuilding by excluding full VTT features, AI GM automation, marketplace features, and complex multiplayer from the MVP. |

# 4. Stakeholders and Users

## 4.1 Stakeholders

| **Stakeholder**            | **Interest / Responsibility**                                                                   |
|----------------------------|-------------------------------------------------------------------------------------------------|
| Product Owner              | Defines scope, prioritization, acceptance, and release decisions.                               |
| Developer                  | Builds the MVP application and future technical capabilities.                                   |
| UX/UI Designer             | Designs player workflows, information hierarchy, and session usability.                         |
| QA/Tester                  | Validates rules-adjacent behavior, data persistence, and user workflows.                        |
| Content/Licensing Reviewer | Confirms what text, tables, labels, and references may be used and how attribution must appear. |
| Early Playtesters          | Solo and small-group Ironsworn players who validate usability and value.                        |

## 4.2 Target User Personas

| **Persona**        | **Primary Need**                                                                                           |
|--------------------|------------------------------------------------------------------------------------------------------------|
| Solo Player        | Runs Ironsworn alone and needs quick access to character state, move rolls, oracle prompts, and a journal. |
| Co-op Player       | Plays with a small group and needs shared progress context, vow state, and table support without a GM.     |
| Guided Player / GM | May use the tool for reference, rolls, or campaign notes, but is not the initial MVP focus.                |
| New Player         | Needs a guided, low-friction way to manage session state without being overwhelmed by all rules at once.   |

# 5. Product Vision and Scope

Vision statement: Build a lightweight, rules-aware digital companion that lets Ironsworn players focus on fiction, decisions, and vows while the application handles repetitive tracking, dice resolution support, oracle access, and session journaling.

## 5.1 In Scope for Product Direction

- Solo-first session support with clean character and campaign persistence.

- Digital character sheet with stats, tracks, debilities, bonds, experience, assets references, and notes.

- Move roller that supports action roll, progress roll, momentum burn decisioning, and result display.

- Progress and momentum trackers for vows, journeys, combat, and bonds.

- Oracle table access for inspiration and question resolution.

- Vow journal for background vows, inciting incident vows, milestones, fulfillment, forsaking, and narrative notes.

## 5.2 Out of Scope for MVP

- Full virtual tabletop with maps, tokens, fog of war, or tactical combat boards.

- Real-time multiplayer synchronization.

- AI-generated GM, automated story authoring, or replacement of player interpretation.

- Marketplace, user-generated content publishing, or asset-card store.

- Mobile app store release; a responsive web MVP is assumed unless changed.

- Commercial monetization before content and licensing approval.

# 6. MVP Scope

The remembered baseline MVP consists of five core features: character sheet, move roller, momentum/progress trackers, oracle tables, and vow journal. The MVP must feel complete enough to run a basic solo session from character setup through vows, moves, oracle prompts, progress, and journal entries.

| **ID** | **Feature**                    | **MVP Outcome**                                                                                                    |
|--------|--------------------------------|--------------------------------------------------------------------------------------------------------------------|
| MVP-01 | Character Sheet                | Create, edit, save, and resume a character with the core Ironsworn sheet elements.                                 |
| MVP-02 | Move Roller                    | Resolve common moves with action dice, challenge dice, result classification, and optional momentum burn workflow. |
| MVP-03 | Momentum and Progress Trackers | Track current momentum, reset/max values, progress boxes/ticks, and ranks for vows and challenges.                 |
| MVP-04 | Oracle Tables                  | Roll or browse approved oracle tables and display generated prompts/results.                                       |
| MVP-05 | Vow Journal                    | Record vows, rank, progress, milestones, notes, outcomes, and session history.                                     |

# 7. Business Requirements

| **ID** | **Requirement**                                                                                                                              | **Priority** | **Acceptance Signal**                                                                |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------|--------------|--------------------------------------------------------------------------------------|
| BR-01  | The product shall support a solo-first Ironsworn play session from setup through ongoing play.                                               | Must         | Users can start or resume a session without needing a spreadsheet for core tracking. |
| BR-02  | The product shall preserve the fiction-first nature of Ironsworn and avoid forcing rigid automation where player interpretation is expected. | Must         | Move results and oracle outputs support interpretation rather than replacing it.     |
| BR-03  | The product shall provide a consolidated player workspace for character state, moves, progress, oracles, and vows.                           | Must         | The MVP reduces tool-switching during a session.                                     |
| BR-04  | The product shall store user-created campaign and character data persistently.                                                               | Must         | A player can close the app and later continue with the same state.                   |
| BR-05  | The product shall clearly distinguish official/licensed content from user-authored notes and future custom content.                          | Must         | Users and reviewers can identify content provenance.                                 |
| BR-06  | The product shall include attribution and license notices appropriate to the Ironsworn material used.                                        | Must         | Release cannot proceed without visible and accurate attribution.                     |
| BR-07  | The product should allow a player to complete core rolls without reading raw dice mechanics every time.                                      | Should       | The app summarizes strong hit, weak hit, miss, matches, and optional momentum burn.  |
| BR-08  | The product should support extensibility for co-op or guided play in later releases.                                                         | Should       | Data model and UX do not assume only one permanent character forever.                |
| BR-09  | The MVP shall avoid monetization features until licensing and business model are approved.                                                   | Must         | No payment, subscription, or gated content in MVP unless explicitly cleared.         |
| BR-10  | The product shall provide a simple onboarding path for first-time users.                                                                     | Should       | New users can create a character and begin a vow with minimal confusion.             |

# 8. High-Level Functional Capabilities

## 8.1 Character Sheet Capability

| **ID** | **Capability**                      | **Description**                                                                                |
|--------|-------------------------------------|------------------------------------------------------------------------------------------------|
| FC-01  | Create character                    | Enter name, stats, tracks, bonds, debilities, assets references, experience, and notes.        |
| FC-02  | Edit and persist state              | All field changes can be saved and restored.                                                   |
| FC-03  | Track status                        | Health, spirit, supply, momentum, max momentum, reset, debilities, and experience are visible. |
| FC-04  | Support character creation baseline | Default starting values and stat distribution can be represented.                              |

## 8.2 Move Roller Capability

| **ID** | **Capability**        | **Description**                                                                                          |
|--------|-----------------------|----------------------------------------------------------------------------------------------------------|
| FC-05  | Action roll           | Roll one d6 action die and two d10 challenge dice; add stat and adds; classify result.                   |
| FC-06  | Progress roll         | Roll challenge dice against filled progress boxes; ignore momentum.                                      |
| FC-07  | Oracle roll           | Roll d100 for oracle tables and yes/no oracle odds.                                                      |
| FC-08  | Momentum burn support | Allow the user to decide whether to burn positive momentum after a roll, then update momentum if chosen. |
| FC-09  | Match detection       | Identify challenge-dice matches and flag them as potential twists or complications.                      |

## 8.3 Trackers and Vow Journal Capability

| **ID** | **Capability**          | **Description**                                                            |
|--------|-------------------------|----------------------------------------------------------------------------|
| FC-10  | Vow tracking            | Create vows with rank, progress, milestones, status, and notes.            |
| FC-11  | Generic progress tracks | Support journey, combat, vow, and bond-style progress where applicable.    |
| FC-12  | Milestone logging       | Record the narrative event associated with a milestone or progress update. |
| FC-13  | Session journal         | Capture dated entries linked to vows, oracle rolls, moves, or free notes.  |

## 8.4 Oracle Capability

| **ID** | **Capability**         | **Description**                                                             |
|--------|------------------------|-----------------------------------------------------------------------------|
| FC-14  | Browse oracle tables   | Display approved oracle table names and result ranges.                      |
| FC-15  | Roll oracle result     | Generate a random result and show the corresponding prompt.                 |
| FC-16  | Copy result to journal | Allow a user to record oracle output into the session journal or vow notes. |

# 9. Non-Functional Business Requirements

| **ID** | **Area**        | **Requirement**                                                                                             | **Priority** |
|--------|-----------------|-------------------------------------------------------------------------------------------------------------|--------------|
| NFR-01 | Usability       | Core session actions should be reachable quickly and not hidden behind deep navigation.                     | Must         |
| NFR-02 | Reliability     | Saved character and journal data must not be lost during normal use.                                        | Must         |
| NFR-03 | Performance     | Rolls, table lookups, and character updates should feel instant on common desktop and mobile browsers.      | Should       |
| NFR-04 | Accessibility   | The MVP should support keyboard navigation, readable contrast, and responsive layout.                       | Should       |
| NFR-05 | Privacy         | User campaign notes should be treated as private application data.                                          | Must         |
| NFR-06 | Portability     | Export of user-created character or journal data should be considered before public release.                | Could        |
| NFR-07 | Maintainability | Rules data, move definitions, and oracle tables should be maintainable without rewriting application logic. | Should       |

# 10. Content, Legal, and Licensing Requirements

This project depends on content derived from or inspired by Ironsworn. The rulebook states that the text is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International and references the Ironsworn System Reference Document. Therefore, content handling is a first-class business requirement, not an afterthought.

| **ID** | **Requirement**            | **Description**                                                                                                                              | **Priority** |
|--------|----------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| CLR-01 | Source inventory           | Maintain a list of all rulebook/SRD text, table data, names, labels, images, and icons used in the product.                                  | Must         |
| CLR-02 | Attribution                | Include creator, title, license, and source attribution wherever required.                                                                   | Must         |
| CLR-03 | Non-commercial constraint  | Do not monetize content using CC BY-NC-SA material unless the business obtains appropriate permission or legal review confirms a valid path. | Must         |
| CLR-04 | ShareAlike review          | Identify whether derivative rules/content/data must be distributed under compatible terms.                                                   | Must         |
| CLR-05 | Image exclusion            | Do not reuse rulebook artwork or stock-image compositions unless rights are explicitly cleared.                                              | Must         |
| CLR-06 | SRD-first content strategy | Prefer SRD-approved text/data and original UI wording over copying rulebook prose.                                                           | Should       |

# 11. Success Metrics

| **ID** | **Metric**           | **Target Signal**                                                                                              |
|--------|----------------------|----------------------------------------------------------------------------------------------------------------|
| SM-01  | Activation           | A new user can create a character and record a first vow in one session.                                       |
| SM-02  | Session utility      | Playtesters use at least three MVP features during a real or simulated session.                                |
| SM-03  | Retention signal     | Early users return to continue the same character or vow journal after initial use.                            |
| SM-04  | Usability            | Playtesters can perform an action roll, progress update, oracle roll, and journal entry without external help. |
| SM-05  | Scope control        | The MVP ships without full VTT, multiplayer, marketplace, or AI GM features.                                   |
| SM-06  | Compliance readiness | All official content in the product is traceable to an approved source and reviewed before release.            |

# 12. Assumptions, Dependencies, and Constraints

## 12.1 Assumptions

- The first implementation will be a responsive web application unless the project owner later chooses another platform.

- The MVP is solo-first but should not prevent future co-op or guided-mode support.

- Users are expected to own or access the Ironsworn rules; the app is a companion, not a full rulebook replacement.

- Rules automation should assist the player, not remove player interpretation or fiction-first judgment.

- Initial data may be local-first or account-based; this requires a later technical decision.

## 12.2 Dependencies

- Content and licensing review before public release.

- Rules engine requirements document to define dice, momentum, progress, move outcomes, and data rules precisely.

- UX flow/wireframe requirements for character setup, play session, roll modal, trackers, oracle lookup, and journal flow.

- Acceptance criteria/test plan to prevent rules-adjacent regressions.

## 12.3 Constraints

- No commercial launch using NonCommercial-licensed material without an approved licensing path.

- No rulebook artwork reuse unless independently cleared.

- MVP scope must remain limited to the five remembered baseline features.

- The BRD is not a substitute for the PRD, functional specification, rules engine requirements, data model, or acceptance test plan.

# 13. Risks and Mitigations

| **ID** | **Risk**                | **Impact**                                                                                         | **Mitigation**                                                              |
|--------|-------------------------|----------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| R-01   | Licensing risk          | Misuse of rulebook text, tables, art, or license terms could block launch.                         | Create source inventory and complete content/licensing review early.        |
| R-02   | Scope creep             | The product could expand into VTT, multiplayer, AI GM, or campaign platform before MVP validation. | Use MVP scope gate and explicit out-of-scope list.                          |
| R-03   | Rules misinterpretation | Automated roll or tracker behavior could conflict with player expectations.                        | Create rules engine requirements and test cases from rulebook mechanics.    |
| R-04   | Poor solo UX            | If journaling and oracle workflows are slow, the app will not beat generic notes/tools.            | Prototype session flow and test with solo users.                            |
| R-05   | Data loss               | Players may lose emotionally valuable campaign notes.                                              | Prioritize reliable persistence, export, and backups before public release. |
| R-06   | Over-automation         | Too much automation could undermine fiction-first play.                                            | Keep outputs explanatory and user-confirmed rather than fully automatic.    |

# 14. Release Approach

| **Phase** | **Name**                        | **Business Outcome**                                                                             |
|-----------|---------------------------------|--------------------------------------------------------------------------------------------------|
| Phase 0   | Discovery and BRD/PRD alignment | Confirm business scope, user target, licensing constraints, and MVP boundaries.                  |
| Phase 1   | Prototype UX                    | Create clickable or low-fidelity flows for character sheet, roll, oracle, progress, and journal. |
| Phase 2   | MVP build                       | Implement baseline features with persistence and basic QA coverage.                              |
| Phase 3   | Private playtest                | Run solo-session tests, collect usability feedback, and validate success metrics.                |
| Phase 4   | Release readiness               | Complete licensing review, accessibility pass, export decision, and acceptance testing.          |

# 15. Acceptance Criteria

1.  A user can create a character with core sheet data and reopen it later with the same values.

2.  A user can perform an action roll and see strong hit, weak hit, or miss based on challenge dice comparison.

3.  A user can identify challenge-dice matches after a roll.

4.  A user can choose whether to burn momentum when eligible and see the updated state afterward.

5.  A user can create a vow, assign a rank, mark progress, add milestones, and record outcome notes.

6.  A user can create and update at least one non-vow progress track for a journey, combat, or generic challenge.

7.  A user can roll or browse oracle tables and copy/record the result into notes.

8.  A user can run a basic solo play loop using only the MVP workspace plus their own imagination/rules reference.

9.  The product displays or includes appropriate attribution/license notices for all official content used.

10. No out-of-scope features are required to complete the MVP acceptance flow.

# 16. Open Questions

| **ID** | **Topic**      | **Question**                                                                                       |
|--------|----------------|----------------------------------------------------------------------------------------------------|
| OQ-01  | Platform       | Should the first version be responsive web only, desktop/PWA, or mobile-first?                     |
| OQ-02  | Accounts       | Will the MVP require user accounts, or use local storage/export first?                             |
| OQ-03  | Content source | Which exact Ironsworn SRD/rulebook text and tables are permitted in-product?                       |
| OQ-04  | Monetization   | Is the long-term intent free, donation-supported, commercial, or private/internal only?            |
| OQ-05  | Assets         | Will asset cards be tracked in MVP as structured data, simple notes, or links/references only?     |
| OQ-06  | Export         | What export format is required for characters and journals: JSON, Markdown, PDF, or none for MVP?  |
| OQ-07  | AI assistance  | Is AI oracle/journal assistance a future possibility, and should the MVP data model anticipate it? |

# 17. Approval

This BRD is approved when the project owner confirms that the business objective, target users, MVP boundaries, licensing constraints, success metrics, and open questions are accurate enough to proceed to the PRD and MVP Scope Document.

| **Role**                   | **Name / Signature** | **Date** |
|----------------------------|----------------------|----------|
| Product Owner              |                      |          |
| Technical Lead             |                      |          |
| UX Lead                    |                      |          |
| Content/Licensing Reviewer |                      |          |

# Appendix A: Rulebook Basis Used for This BRD

- Ironsworn is a tabletop RPG centered on perilous quests, iron vows, and a fiction-first loop of character decisions and dice resolution.

- The game supports Guided, Cooperative, and Solo modes, with solo and small group play emphasized.

- Core physical play materials include dice, a character sheet, asset cards, counters, move references, maps, and worksheets; these inform the digital companion scope.

- The character sheet tracks stats, health, spirit, supply, momentum, vows, bonds, debilities, assets, and experience.

- Moves use action rolls, progress rolls, oracle rolls, or no roll depending on the move; common outcomes include strong hit, weak hit, miss, and challenge-dice matches.

- Oracles are used for inspiration and to resolve uncertain questions, especially in solo and co-op play.

- Vows and progress tracks are central long-running structures and are therefore key MVP objects.

Primary source: Ironsworn Rulebook PDF supplied in the project conversation, pages 1-10 and relevant rules sections cited in the project analysis. Legal details are taken from the copyright/license page of the rulebook.
