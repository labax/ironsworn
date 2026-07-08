# Content & Licensing Requirements

## Ironsworn Digital Companion

*Version 0.1 | Draft | Prepared for the Ironsworn Project*

| Field | Value |
|---|---|
| Document owner | Product Owner / Project Lead |
| Related documents | Business Requirements Document v0.1; MVP Scope Document v0.1; Functional Requirements Document v0.1; Rules Engine Requirements v0.1; Data Model / Domain Model Specification v0.1; UX Flow / Wireframe Requirements v0.1; future Non-Functional Requirements; future Acceptance Criteria / Test Plan |
| Product scope | Solo-first Ironsworn digital companion MVP |
| MVP baseline | Character sheet, move roller, momentum/progress trackers, oracle tables, vow journal |
| Intended audience | Product owner, developer, UX designer, QA/tester, content/licensing reviewer, legal reviewer |
| Status | Draft for review; not legal advice |

---

# Contents

1. Purpose
2. Source Basis
3. Legal Disclaimer and Review Position
4. Content & Licensing Context
5. Content Scope
6. Licensing Principles
7. Content Source Categories
8. Release Mode Policy
9. Content Usage Matrix
10. Product-Level Licensing Requirements
11. Feature-Level Content Requirements
12. Content Provenance Requirements
13. Attribution and Notice Requirements
14. Unofficial Product and Brand Requirements
15. Art, Icons, UI, and Trade Dress Requirements
16. User-Generated Content Requirements
17. Third-Party Content Requirements
18. AI, Automation, and Future Content Requirements
19. Content Inventory Template
20. Review Workflow and Approval Gates
21. Risk Register
22. Acceptance Criteria
23. Traceability Matrix
24. Open Questions
25. Approval
26. Appendix A: Recommended Notice Patterns
27. Appendix B: Pre-Release Compliance Checklist

---

# 1. Purpose

This document defines the content, copyright, license, attribution, provenance, brand, and release-gating requirements for the Ironsworn Digital Companion MVP.

The document exists to prevent the product from accidentally becoming an unauthorized rulebook reproduction, an unofficially branded official-looking product, or a commercial product using non-commercially licensed content. It should be used by product, design, engineering, QA, and content review before any public release.

The MVP should support Ironsworn play through a character sheet, move roller, momentum/progress trackers, oracle tables, and vow journal while using approved content sources, original UI copy, clear attribution, and visible provenance labels.

---

# 2. Source Basis

This document is based on:

- Ironsworn Rulebook by Shawn Tomkin.
- Tomkin Press Ironsworn Licensing page, reviewed July 2026.
- Tomkin Press licensing blog post, reviewed July 2026.
- Creative Commons BY-NC-SA 4.0 deed, reviewed July 2026.
- Creative Commons BY 4.0 deed, reviewed July 2026.
- Existing Ironsworn Digital Companion requirements documents.
- The agreed MVP baseline: character sheet, move roller, momentum/progress trackers, oracle tables, and vow journal.

---

# 3. Legal Disclaimer and Review Position

This document is a product requirements document, not legal advice. It records product and process requirements for safe content handling. A qualified legal reviewer should review the final content inventory, attribution notices, license notices, monetization plan, and public-facing branding before public launch.

For MVP planning, the project should treat licensing as a release gate rather than a post-release cleanup task.

---

# 4. Content & Licensing Context

Ironsworn content has multiple relevant licensing paths:

1. The complete text of the Ironsworn game is available for non-commercial derivative use under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International.
2. The Ironsworn System Reference Document and certain additional Ironsworn text resources are available for commercial use under Creative Commons Attribution 4.0 International.
3. The official licensing guidance applies to text content and does not permit use of Tomkin Press images, icons, trade dress, or design elements.
4. The project must not state or imply that it is an official Ironsworn or Tomkin Press product.
5. The app should support mechanics and tracking through original UI wording where possible, and should reproduce official text only when the source and license have been verified.

The requirements below are intentionally conservative. They allow internal prototyping while preventing accidental publication of content that has not been inventoried and approved.

---

# 5. Content Scope

## 5.1 In Scope for This Document

| Area | Scope |
|---|---|
| Official rules text | Move names, move summaries, rules summaries, oracle table text, asset references, debility labels, rank labels, play terms, and help text. |
| Mechanics representation | Dice, result names, progress track labels, momentum labels, and other mechanical concepts shown in the UI. |
| Oracle content | Yes/no oracle odds, d100 tables, result ranges, prompts, and table names. |
| Asset content | Asset names, ability text, tags, categories, and companion references. |
| Character sheet content | Labels, track names, default values, field descriptions, and guidance text. |
| Attribution and notices | License names, creator credit, source links, change notices, disclaimer language. |
| Branding | Product name, logo, store/listing copy, website copy, and unofficial-product notice. |
| Art and visual design | Images, icons, textures, fonts, trade dress, screenshots, and visual references. |
| User content | Player-created characters, vows, campaign notes, journal entries, custom oracles, and imported content. |
| Third-party content | Icons, fonts, stock art, open-source packages, UI libraries, dice images, and generated art assets. |

## 5.2 Out of Scope for This Document

| Area | Excluded from this document |
|---|---|
| Final legal opinion | Must be handled by legal review if needed. |
| Final monetization model | Covered only as licensing constraints and release gates. |
| Database schema details | Covered by the Data Model / Domain Model Specification. |
| Dice algorithms | Covered by the Rules Engine Requirements. |
| Final UI layouts | Covered by the UX Flow / Wireframe Requirements. |
| Complete content transcription | This document does not approve copying full rulebook or SRD text into the product. |

---

# 6. Licensing Principles

| ID | Principle | Requirement |
|---|---|---|
| CLP-01 | Source-first | Every official or third-party content item must identify its source before it is included in the product. |
| CLP-02 | License-before-copy | No official prose, table, asset text, image, icon, or handout content may be reproduced publicly until its license and permitted use are confirmed. |
| CLP-03 | Mechanics can be originalized | The product should implement mechanics and write original UI copy instead of copying rulebook prose unless exact text is necessary and approved. |
| CLP-04 | Commercial release is stricter | Any monetized, ad-supported, subscription, paid-download, or commercially promoted release must use commercial-compatible content only unless separate permission is obtained. |
| CLP-05 | Non-commercial is still licensed | Free/non-commercial release still requires attribution, ShareAlike handling where applicable, and unofficial-product disclaimers. |
| CLP-06 | Art is separate from text | Text license approval does not approve reuse of rulebook art, official icons, page layout, trade dress, or stock-image compositions. |
| CLP-07 | Provenance must be visible internally | Developers, testers, and reviewers must be able to determine where each content item came from. |
| CLP-08 | Provenance should be visible to users where useful | Official, SRD-derived, custom, and user-authored content should be distinguishable in the UI, especially in oracle and asset areas. |
| CLP-09 | The app is a companion | The product should not replace the rulebook through extensive copied prose or complete rules-compendium behavior unless specifically approved. |
| CLP-10 | No implied endorsement | Product name, logo, copy, screenshots, and metadata must not imply official Tomkin Press approval. |

---

# 7. Content Source Categories

| Source category | Definition | MVP use |
|---|---|---|
| `official_rulebook_ncsa` | Text from the complete Ironsworn rulebook or handouts under CC BY-NC-SA. | Allowed only for internal work or approved non-commercial release. Not allowed for commercial release without separate permission. |
| `official_srd_by` | Text from the Ironsworn SRD under CC BY. | Preferred source for commercial-compatible official rules/move text. |
| `official_assets_by` | Text of official Ironsworn asset cards made available under CC BY. | May be used in commercial-compatible release after source verification and attribution. |
| `official_oracles_by` | Text of official Ironsworn oracle tables made available under CC BY. | May be used in commercial-compatible release after source verification and attribution. |
| `project_original` | Original UI text, summaries, labels, examples, and explanations written for this app. | Preferred for UX help, onboarding, summaries, and app-specific copy. |
| `user_authored` | Player-created content such as characters, vows, campaign notes, journal entries, custom oracle entries. | User-owned/private app data; do not treat as official content. |
| `third_party_open` | Third-party assets under permissive/open licenses. | Allowed only after license compatibility and attribution review. |
| `third_party_commercial` | Licensed stock images, fonts, paid icon packs, paid UI kits. | Allowed only if product use, redistribution, and app embedding are permitted. |
| `unknown` | Any content with unresolved source or license. | Must not be published. |
| `restricted` | Content known to be incompatible or not approved. | Must not be used in shipped builds. |

---

# 8. Release Mode Policy

| Release mode | Permitted content position | Monetization position | Required gate |
|---|---|---|---|
| Internal prototype | May reference rulebook content for design analysis. Avoid embedding large copied content in distributable builds. | No external monetization. | Product-owner review. |
| Closed private playtest | Use only inventoried content. If official copied text is included, license and attribution must be present even if free. | No fees, ads, subscriptions, sponsorships, or paid access unless commercial-compatible content only. | Content reviewer approval. |
| Public free non-commercial release | May use CC BY-NC-SA content if attribution and ShareAlike obligations are satisfied, but commercial features must be absent. | No ads, subscriptions, payments, paid upgrades, sponsorship monetization, or commercial positioning. | Content + legal review. |
| Public commercial release | Use CC BY-compatible official content, project-original copy, approved third-party assets, and user-authored content only. Avoid CC BY-NC-SA content unless separate permission is obtained. | Allowed only after commercial-compatible content review. | Legal + product-owner approval. |
| Open-source release | Source code may use its own license, but embedded content and data files must retain their own licenses and attribution. | Depends on included content and project license. | Legal + repository review. |

---

# 9. Content Usage Matrix

| Content type | MVP recommendation | Commercial-compatible path | Notes |
|---|---|---|---|
| Dice mechanics | Implement with original code and UI wording. | Allowed; mechanics should be expressed in original wording or approved source text. | Keep calculations in rules engine, not copied prose. |
| Move names | Use if source/license verified. | Prefer SRD/CC BY source or short labels treated as functional references after review. | Do not imply full move text is included unless approved. |
| Full move text | Avoid in MVP unless approved. | Use SRD/CC BY source where applicable; inventory every move. | Original summaries are safer for onboarding. |
| Rulebook examples | Exclude from MVP. | Avoid unless specifically approved and necessary. | Examples are expressive prose. |
| Oracle table names | Use if source/license verified. | Use official oracle tables under CC BY after inventory. | Show source/provenance label. |
| Oracle table result text | Include only approved tables. | Use official oracle tables under CC BY after inventory and attribution. | Table data must be traceable row by row. |
| Asset card names | Lightweight references only in MVP unless approved. | Use official asset text under CC BY after inventory. | Full automation deferred. |
| Asset ability text | Exclude unless approved. | Use official asset text under CC BY after inventory. | Requires content data QA. |
| Character sheet labels | Use concise labels and original UI copy. | Allowed if original or approved. | Avoid copying official sheet layout/trade dress. |
| Rulebook art | Exclude. | Exclude unless direct permission/license obtained. | Text license does not approve art. |
| Rulebook icons | Exclude by default. | Use independent icons or approved icon sources. | Some icons may have separate licenses; do not assume. |
| Official logo/trade dress | Exclude from product branding. | Exclude unless permission obtained. | Use text attribution, not official-looking branding. |
| Screenshots from rulebook | Exclude. | Exclude unless permission obtained. | Avoid store screenshots containing official pages. |
| User-created journal/vows | Store as private user data. | User content may be exported with user permission. | Must not be used in marketing without consent. |
| Custom user oracles | Future support only. | User/import licensing must be captured. | Require source and license metadata if shared/imported. |

---

# 10. Product-Level Licensing Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-001 | The product shall maintain a content inventory for all official and third-party content included in the app. | Must | Every included content item has source, license, author, version/date, and approval status. |
| CLR-002 | The product shall distinguish content categories: official rulebook, SRD-derived, official asset, official oracle, project-original, user-authored, third-party, unknown, restricted. | Must | Reviewers can filter or inspect content by source category. |
| CLR-003 | The product shall prevent publication of content with `unknown` or `restricted` source status. | Must | Release checklist blocks unresolved content. |
| CLR-004 | The product shall include attribution notices for all official and third-party content used. | Must | About/legal screen and packaged documentation include required notices. |
| CLR-005 | The product shall include a visible unofficial-product disclaimer. | Must | User-facing About/legal area states the app is not official or endorsed. |
| CLR-006 | The product shall not reuse Tomkin Press images, icons, trade dress, or design elements unless permission or compatible license is documented. | Must | Content inventory contains no unapproved visual assets. |
| CLR-007 | The product shall not include monetization, advertising, paid access, subscriptions, gated content, or sponsorship-driven release until commercial-compatible content review is complete. | Must | Release candidate has no monetization code/path unless approved. |
| CLR-008 | The product shall use project-original UI copy wherever exact official wording is not necessary. | Should | Help text and onboarding text are original unless marked as official content. |
| CLR-009 | The product shall avoid functioning as a full rulebook replacement in MVP. | Must | MVP does not include extensive copied rules prose or full book sections. |
| CLR-010 | The product shall identify official, SRD-derived, custom, and user-authored content in admin/review tools, and where relevant in the UI. | Must | Oracle tables and asset references display provenance or source notes. |
| CLR-011 | The product shall preserve license notices in export files when exported data contains official or third-party content. | Should | JSON/Markdown export includes notices or references to notice bundle. |
| CLR-012 | The product shall require legal review before public commercial release. | Must | Release checklist includes completed legal approval. |
| CLR-013 | The product shall require content review before public non-commercial release. | Must | Release checklist includes completed content review. |
| CLR-014 | The product shall track content modifications separately from source text. | Must | Content item records can indicate whether text is original, copied, adapted, summarized, or transformed. |
| CLR-015 | The product shall retain a change statement for adapted official text where required. | Must | Attribution bundle includes modification status where relevant. |

---

# 11. Feature-Level Content Requirements

## 11.1 Character Sheet

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-CHAR-001 | Character sheet field labels may use short mechanical labels such as stats, tracks, momentum, vows, bonds, debilities, and experience after source review. | Must | Labels are listed in content inventory or approved as original/functional terms. |
| CLR-CHAR-002 | Character creation guidance shall be project-original unless official text is specifically approved. | Should | Onboarding text is not copied from the rulebook. |
| CLR-CHAR-003 | The digital sheet shall not copy the visual layout, decorative styling, textures, or trade dress of the official printed sheet. | Must | UI review confirms visual independence. |
| CLR-CHAR-004 | Asset entries shall be lightweight references in MVP unless official asset content is inventoried and approved. | Should | Users can record asset names/notes without bundled full official card text unless approved. |
| CLR-CHAR-005 | User-entered character notes and journal content shall be stored as user-authored content. | Must | User-authored content is not mixed with official content in provenance metadata. |

## 11.2 Move Roller

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-ROLL-001 | Roll classification labels may be included as mechanical labels after review. | Must | Strong hit, weak hit, miss, match, progress roll, action roll, and oracle roll labels are approved. |
| CLR-ROLL-002 | Move result explanations shall be original summaries unless exact move text is approved. | Must | Move roller does not reproduce unapproved move prose. |
| CLR-ROLL-003 | The app shall not automatically display complete move text unless the move content source and license are approved. | Must | Full move content is absent or fully inventoried and approved. |
| CLR-ROLL-004 | Match and momentum guidance shall avoid copying rulebook explanatory prose unless approved. | Should | Guidance copy is original and concise. |
| CLR-ROLL-005 | Roll history records shall store mechanical results and user labels separately from official move text. | Must | Roll records do not embed unapproved official prose. |

## 11.3 Momentum and Progress Trackers

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-TRK-001 | Rank labels may be included after review as mechanical labels. | Must | Troublesome, dangerous, formidable, extreme, and epic labels are approved in inventory. |
| CLR-TRK-002 | Progress tracker helper text shall be project-original unless official text is approved. | Should | Help text is original. |
| CLR-TRK-003 | Progress boxes/ticks may be visually represented, but the UI shall not copy official sheet graphics or layout. | Must | UI review confirms independent design. |
| CLR-TRK-004 | Vow status terms shall be inventoried and approved. | Must | Fulfilled, forsaken, active, archived, and related labels are approved. |

## 11.4 Oracle Tables

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-ORC-001 | Oracle tables shall be included only when their source and license are verified. | Must | Every oracle table has a content source record and approval status. |
| CLR-ORC-002 | Each oracle entry shall be traceable by table, range, text, source, and license. | Must | Table row data can be audited. |
| CLR-ORC-003 | Oracle browsing and roll results shall display a source/provenance label where practical. | Must | UI shows official/SRD/custom/user-authored status for oracle content. |
| CLR-ORC-004 | The MVP shall include only approved oracle tables. | Must | No unapproved tables appear in production build. |
| CLR-ORC-005 | User-created or imported oracle tables shall require source/license metadata before sharing/exporting beyond private use. | Should | Custom table model supports source metadata. |
| CLR-ORC-006 | Oracle output saved to journal shall preserve source information. | Should | Journal entry links to source content item or stores source snapshot. |

## 11.5 Vow Journal

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-VOW-001 | Vow journal prompts shall be project-original unless official text is approved. | Should | Empty-state and guidance copy is original. |
| CLR-VOW-002 | User vows, milestones, and outcomes shall be stored as user-authored content. | Must | Vow records are marked user-authored. |
| CLR-VOW-003 | Saved roll/oracle output in the journal shall retain source metadata when it includes official table text. | Should | Journal entry shows or links to oracle source. |
| CLR-VOW-004 | The app shall not publish or share user-authored journal content without explicit user action. | Must | No public sharing exists in MVP. |

## 11.6 About, Legal, and Settings

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-LEGAL-001 | The app shall include an About/Legal screen. | Must | Screen exists and is accessible from main navigation or footer. |
| CLR-LEGAL-002 | The About/Legal screen shall list Ironsworn attribution, license name, license link, source link, and unofficial-product disclaimer. | Must | Review confirms all required elements are present. |
| CLR-LEGAL-003 | The About/Legal screen shall list third-party licenses or link to a bundled third-party notices file. | Must | All third-party licenses are represented. |
| CLR-LEGAL-004 | The app shall include a content source/version statement for bundled official content. | Must | Users/reviewers can see what official content dataset version is included. |
| CLR-LEGAL-005 | If the app is non-commercial, the About/Legal screen shall clearly reflect the non-commercial license path used. | Must if applicable | Non-commercial license notice is visible. |
| CLR-LEGAL-006 | If the app is commercial, the About/Legal screen shall clearly reflect the CC BY / commercial-compatible content path used. | Must if applicable | Commercial-compatible attribution is visible. |

---

# 12. Content Provenance Requirements

## 12.1 Required Metadata Fields

Every official or third-party content item shall support the following metadata.

| Field | Required | Description |
|---|---:|---|
| `contentId` | Yes | Stable unique identifier. |
| `contentType` | Yes | Move, oracle table, oracle entry, asset, label, help text, image, icon, font, license notice, etc. |
| `sourceCategory` | Yes | Source category from Section 7. |
| `sourceTitle` | Yes | Name of source work or package. |
| `sourceAuthor` | Yes | Creator/author/licensor where known. |
| `sourceUrl` | Yes when available | URL or internal source reference. |
| `sourceVersion` | Yes when available | Version, publication date, commit, or retrieval date. |
| `licenseName` | Yes | License name. |
| `licenseUrl` | Yes when available | Link to license text/deed. |
| `licenseScope` | Yes | Text, table data, image, icon, font, code, etc. |
| `commercialAllowed` | Yes | True/false/unknown. |
| `shareAlikeRequired` | Yes | True/false/unknown. |
| `attributionRequired` | Yes | True/false/unknown. |
| `modificationStatus` | Yes | Original, copied, adapted, summarized, transformed, generated, unknown. |
| `changeNotice` | Yes if modified | Note explaining changes. |
| `approvedForInternal` | Yes | Boolean. |
| `approvedForPublicFree` | Yes | Boolean. |
| `approvedForCommercial` | Yes | Boolean. |
| `approvedBy` | Yes when approved | Reviewer name/role. |
| `approvedAt` | Yes when approved | Date/time. |
| `reviewNotes` | No | Freeform notes. |

## 12.2 Provenance Invariants

| ID | Invariant |
|---|---|
| CLR-PROV-001 | No production build may include official or third-party content with `sourceCategory = unknown`. |
| CLR-PROV-002 | No commercial build may include content where `commercialAllowed = false` or `commercialAllowed = unknown`. |
| CLR-PROV-003 | No public build may include content where `approvedForPublicFree = false`, unless it is not bundled and is user-authored private data. |
| CLR-PROV-004 | Every official oracle entry must link to its parent oracle table and content source. |
| CLR-PROV-005 | Every bundled asset or move text item must identify whether it is copied, adapted, summarized, or original. |
| CLR-PROV-006 | User-authored content must not inherit official content licensing merely because it is stored near official content. |
| CLR-PROV-007 | Exported data containing official content must preserve or reference the relevant license notice. |

---

# 13. Attribution and Notice Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-ATT-001 | Attribution shall name Ironsworn and Shawn Tomkin. | Must | About/Legal screen includes creator and source title. |
| CLR-ATT-002 | Attribution shall include the license name and link for each official content path used. | Must | CC BY or CC BY-NC-SA license link is visible. |
| CLR-ATT-003 | Attribution shall indicate whether official content was modified, adapted, summarized, or transformed where applicable. | Must | Modified content records include change statement. |
| CLR-ATT-004 | Attribution shall not imply endorsement by Shawn Tomkin, Tomkin Press, or Ironsworn. | Must | Notice language is neutral. |
| CLR-ATT-005 | Attribution shall be included in the app, public website/store listing where practical, and exported/license documentation. | Should | Release materials contain required notices. |
| CLR-ATT-006 | Attribution shall be reviewed whenever source content changes. | Must | Changing official content triggers content-review task. |

---

# 14. Unofficial Product and Brand Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-BRAND-001 | The product shall not use a name that implies it is the official Ironsworn app. | Must | Final name avoids official/endorsed implication. |
| CLR-BRAND-002 | The product may use “Ironsworn” descriptively only after brand/legal review. | Should | Store title and website copy are reviewed. |
| CLR-BRAND-003 | The product shall include an unofficial-product disclaimer in About/Legal and public-facing release pages. | Must | Disclaimer is visible before public launch. |
| CLR-BRAND-004 | The product shall not use Tomkin Press logos, Ironsworn cover art, official layout, official typography, or official trade dress unless permission is obtained. | Must | Visual review confirms original branding. |
| CLR-BRAND-005 | Product screenshots shall not display unapproved official text or artwork. | Must | Store/listing screenshots are content-reviewed. |

---

# 15. Art, Icons, UI, and Trade Dress Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-ART-001 | The app shall use original UI design rather than reproducing rulebook page layout or character sheet styling. | Must | UX review confirms visual independence. |
| CLR-ART-002 | Rulebook cover art, interior art, stock-image compositions, official icons, and handout art shall be excluded unless separately licensed. | Must | Asset inventory has no unapproved official visuals. |
| CLR-ART-003 | Third-party icon sets shall have licenses compatible with app use and distribution. | Must | Icon package license is inventoried. |
| CLR-ART-004 | Fonts shall be licensed for web/app embedding. | Must | Font licenses are documented. |
| CLR-ART-005 | AI-generated imagery shall not imitate official Ironsworn art style or reproduce protected visual elements. | Should | Generated art review checks for official-trade-dress risk. |
| CLR-ART-006 | Public visual branding shall be clearly distinct from official Ironsworn/Tomkin Press branding. | Must | Brand review approves logo, colors, layout, and screenshots. |

---

# 16. User-Generated Content Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-UGC-001 | User-created characters, vows, bonds, notes, and journals shall be treated as private user-authored content. | Must | Data model marks these records as user-authored. |
| CLR-UGC-002 | The app shall not claim ownership of user-authored campaign content beyond the rights required to provide the service. | Must if accounts/server exist | Terms/privacy language reviewed before account launch. |
| CLR-UGC-003 | The app shall not publish, train on, market with, or share user-authored content without explicit user permission. | Must | No sharing/training/marketing path exists in MVP. |
| CLR-UGC-004 | Exported user content shall distinguish user-authored text from embedded official table results. | Should | Export includes source/provenance markers. |
| CLR-UGC-005 | Future custom-content sharing shall require users to identify the source/license of imported or shared content. | Should | Custom content model supports source/license metadata. |

---

# 17. Third-Party Content Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-3P-001 | All third-party packages, fonts, icons, images, and UI assets shall be inventoried. | Must | Third-party notice list exists. |
| CLR-3P-002 | Third-party licenses shall be reviewed for commercial use, redistribution, modification, attribution, and web/app embedding. | Must | License review notes exist before release. |
| CLR-3P-003 | Copyleft/open-source code license obligations shall be reviewed separately from content obligations. | Should | Engineering review covers code dependencies. |
| CLR-3P-004 | Stock asset licenses shall be checked for SaaS/web-app use and redistribution limits. | Must if stock assets used | License terms are recorded. |
| CLR-3P-005 | Public domain or CC0 content shall still be inventoried with source and retrieval date. | Should | Inventory records source even when attribution is not required. |

---

# 18. AI, Automation, and Future Content Requirements

AI features are out of scope for the MVP, but future AI or content automation could create licensing and privacy risks. The following requirements are future-facing guardrails.

| ID | Requirement | Priority | Acceptance Criteria |
|---|---|---|---|
| CLR-AI-001 | The MVP shall not include AI GM, AI oracle interpretation, or AI-authored session prose. | Must | No AI content generation exists in MVP release. |
| CLR-AI-002 | Future AI features shall not train on official Ironsworn text, user journal content, or private campaign data without legal/privacy review. | Must for future AI | AI proposal includes legal/privacy review. |
| CLR-AI-003 | Future generated content shall be labeled as generated if presented to users. | Should for future AI | Generated output provenance is visible. |
| CLR-AI-004 | Future AI prompts shall avoid embedding large blocks of official rulebook text unless the content path is approved. | Must for future AI | Prompt templates are content-reviewed. |
| CLR-AI-005 | Future custom oracle/content generators shall not present generated text as official Ironsworn content. | Must for future AI | UI labels generated/custom content clearly. |

---

# 19. Content Inventory Template

Use this table for the initial spreadsheet, JSON seed, or admin-review screen.

| Content ID | Type | Name | Source Category | Source Title | Author | Source URL | Source Version / Date | License | Commercial Allowed | Modified? | Change Notice | Public Free Approved | Commercial Approved | Reviewer | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| content.example.001 | oracle_table | Example Table | project_original | Ironsworn Digital Companion | Project Team | n/a | v0.1 | Project-owned | Yes | No | n/a | Yes | Yes | TBD | Example only. |

---

# 20. Review Workflow and Approval Gates

## 20.1 Content Review Workflow

1. Identify content needed by the feature.
2. Classify the content type and source category.
3. Locate the authoritative source.
4. Record source URL, license, version/date, and author.
5. Decide whether the content is copied, adapted, summarized, or original.
6. Check release mode compatibility.
7. Add required attribution or notice text.
8. Mark approval status for internal, public free, and commercial release.
9. Add or update automated tests/checks where possible.
10. Re-review if content, release mode, or monetization changes.

## 20.2 Release Gates

| Gate | Required before | Requirements |
|---|---|---|
| Gate A: Internal Prototype | Shared development build | Unknown content allowed only in clearly non-distributed prototypes; no public copy. |
| Gate B: Closed Playtest | External testers | Content inventory complete for included content; attribution screen present; no monetization. |
| Gate C: Public Free Release | Public URL/download | All official/third-party content approved for public free release; ShareAlike implications reviewed; unofficial disclaimer present. |
| Gate D: Commercial Release | Payments, ads, subscriptions, paid services, sponsorship, or commercial marketplace listing | Commercial-compatible content only; legal approval complete; attribution and third-party notices complete. |
| Gate E: Open-Source Repository | Public repo | Content files separated from code where needed; licenses documented; no unapproved official content in repo. |

---

# 21. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---:|---:|---|
| CLR-RISK-001 | Accidentally using non-commercial rulebook text in a commercial release. | Medium | High | Use source categories and commercial release gate. |
| CLR-RISK-002 | Reusing official art or trade dress because it appears in the free PDF. | Medium | High | Explicit art exclusion and visual review. |
| CLR-RISK-003 | Building a full rules compendium that replaces the rulebook. | Medium | Medium | MVP companion principle and content scope limits. |
| CLR-RISK-004 | Missing attribution or license links. | Medium | Medium | About/Legal screen and third-party notices checklist. |
| CLR-RISK-005 | Mixing user-created content with official content in exports. | Medium | Medium | Provenance metadata and export notices. |
| CLR-RISK-006 | Store/listing copy implies official endorsement. | Low/Medium | High | Brand review before public release. |
| CLR-RISK-007 | Incomplete oracle/asset source data. | Medium | High | Row-level inventory and release build checks. |
| CLR-RISK-008 | Third-party icon/font license incompatibility. | Medium | Medium | Third-party license inventory. |
| CLR-RISK-009 | Future AI features expose official text or private user notes to third-party services. | Medium | High | AI review gate and privacy requirements. |
| CLR-RISK-010 | ShareAlike obligations conflict with desired app/content licensing. | Medium | High | Prefer commercial-compatible CC BY content for monetized release; legal review. |

---

# 22. Acceptance Criteria

The Content & Licensing Requirements are satisfied for MVP release when:

1. Every bundled official or third-party content item has a complete inventory record.
2. No content with unknown or restricted source status appears in the release build.
3. The release mode is explicitly declared: internal prototype, closed playtest, public free non-commercial, public commercial, or open-source.
4. The About/Legal screen includes required official content attribution, license references, and unofficial-product disclaimer.
5. Third-party licenses are listed in a notices file or legal screen.
6. Oracle tables included in the app are approved at table and entry level.
7. Any asset content included in the app is approved at card/name/ability level, or asset handling remains user-entered/lightweight.
8. Move roller text uses original UI copy or approved official content.
9. The app does not reuse official art, rulebook imagery, official icons, official layout, or trade dress unless separately licensed.
10. The app does not include monetization features unless commercial-compatible content review and legal approval are complete.
11. Exported files include or reference relevant content/license notices when they contain official or third-party content.
12. Public copy, screenshots, product name, and metadata do not imply official endorsement.
13. The product owner, content/licensing reviewer, and legal reviewer, if required, approve the release.

---

# 23. Traceability Matrix

| Requirement source | Related content/licensing coverage |
|---|---|
| BRD: Content, Legal, and Licensing Requirements | Expanded into source inventory, attribution, non-commercial/commercial release constraints, ShareAlike review, image exclusion, and SRD-first strategy. |
| MVP Scope: Licensing-conscious principle | Implemented through release gates, content inventory, and provenance requirements. |
| Functional Requirements: Content Provenance and Licensing Support | Implemented through source categories, metadata fields, UI source labels, and approval statuses. |
| Rules Engine Requirements: Content Provenance and Licensing Support | Implemented through rules-content source handling, original UI wording, and approved move/oracle/asset content paths. |
| Data Model Specification: Content Provenance and Licensing Data | Implemented through required content metadata, invariants, and export requirements. |
| UX Flow / Wireframe Requirements: Content and Licensing UX | Implemented through About/Legal screen, source labels, unofficial disclaimer, and visual-trade-dress restrictions. |

---

# 24. Open Questions

| ID | Topic | Question | Owner |
|---|---|---|---|
| OQ-CLR-001 | Release mode | Is the intended first public release non-commercial/free, commercial, or private/internal only? | Product Owner |
| OQ-CLR-002 | Product name | What final name will be used, and does it require brand/legal review for descriptive use of “Ironsworn”? | Product Owner / Legal |
| OQ-CLR-003 | Official moves | Will the MVP include full move text, short summaries, or move names only? | Product Owner / Content Reviewer |
| OQ-CLR-004 | Oracle scope | Which exact oracle tables are included in MVP v0.1? | Product Owner / Content Reviewer |
| OQ-CLR-005 | Asset scope | Will asset cards remain lightweight user notes, or will official asset text be bundled? | Product Owner |
| OQ-CLR-006 | Source of truth | Which SRD source/repository/file will be treated as the authoritative import source? | Content Reviewer / Developer |
| OQ-CLR-007 | Open source | Will the app repository be public, and will official content data be stored in the repo? | Product Owner / Developer |
| OQ-CLR-008 | Export format | Should exports include official oracle/move text snapshots, or only references to content IDs? | Product Owner / Developer |
| OQ-CLR-009 | Legal review | Who will perform final legal review before public or commercial release? | Product Owner |
| OQ-CLR-010 | Third-party visuals | Will the MVP use any icon set, font family, image pack, or generated art beyond plain UI? | UX / Developer |

---

# 25. Approval

This document is approved when the project owner confirms that the content strategy, release gates, source categories, attribution requirements, and open questions are accurate enough to guide design and development.

| Role | Name / Signature | Date | Status |
|---|---|---|---|
| Product Owner |  |  | Pending |
| Technical Lead |  |  | Pending |
| UX Lead |  |  | Pending |
| Content/Licensing Reviewer |  |  | Pending |
| Legal Reviewer, if required |  |  | Pending |

---

# 26. Appendix A: Recommended Notice Patterns

These are draft notice patterns for review. Final notices should be checked against the current Tomkin Press licensing page and Creative Commons requirements before release.

## 26.1 Unofficial Product Notice

> This is an independent digital companion for Ironsworn. It is not an official Tomkin Press product and is not endorsed by Shawn Tomkin or Tomkin Press.

## 26.2 Non-Commercial Content Notice Pattern

> This app includes or is based on Ironsworn content created by Shawn Tomkin and used under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International. Changes, summaries, or adaptations are identified where applicable.

## 26.3 Commercial-Compatible Content Notice Pattern

> This app includes or is based on Ironsworn SRD, asset, and/or oracle text created by Shawn Tomkin and used under Creative Commons Attribution 4.0 International. Changes, summaries, or adaptations are identified where applicable.

## 26.4 Third-Party Notice Pattern

> This product includes third-party open-source or licensed assets. See Third-Party Notices for author, license, source, and modification details.

---

# 27. Appendix B: Pre-Release Compliance Checklist

## Product Content

- [ ] Release mode declared.
- [ ] Content inventory complete.
- [ ] No unknown/restricted content in build.
- [ ] Move content approved or replaced by original summaries.
- [ ] Oracle tables approved at table and row level.
- [ ] Asset text approved or excluded.
- [ ] Character sheet UI visually distinct from official materials.
- [ ] No official art, cover art, page images, or trade dress used.
- [ ] Third-party font/icon/image licenses reviewed.

## Legal and Notices

- [ ] About/Legal screen present.
- [ ] Ironsworn attribution present.
- [ ] License links present.
- [ ] Change notices present where official content was modified/adapted.
- [ ] Unofficial-product disclaimer present.
- [ ] Third-party notices present.
- [ ] Export notices implemented if exports include official/third-party content.

## Monetization and Distribution

- [ ] No monetization path in non-commercial release.
- [ ] Commercial-compatible content review complete if monetized.
- [ ] Store/listing copy reviewed.
- [ ] Screenshots reviewed for unapproved official content.
- [ ] Repository contents reviewed if public/open-source.

## Data and User Content

- [ ] User-authored content labeled separately from official content.
- [ ] Private journal/campaign data not shared publicly.
- [ ] Export distinguishes official content references from user-authored content.
- [ ] Future custom content/import path has source/license fields or remains out of scope.
