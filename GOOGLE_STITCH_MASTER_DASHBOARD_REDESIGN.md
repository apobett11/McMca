# McMCA Bursary Portals — Master Google Stitch Redesign & Architectural Specification

This document provides the definitive, production-grade redesign architecture and Google Stitch prompts for all dashboards and the public homepage of the **McMCA Bursary Portal (Tendeno / Sorget Ward CDF)**, strictly configured with the **60% - 20% - 10% Color Balance Architecture**.

---

## 1. Global Design System Foundation (Google Stitch Reference)

All dashboards share a unified architectural DNA powered by the **Google Stitch Aetheric Design System**, maintaining strict visual consistency, role-specific accent identities, and zero navigation confusion.

### 1.1 The 60% - 20% - 10% Color Balance Rule
To ensure every dashboard feels calm, professional, and easily navigable without visual fatigue or accidental distraction, all layouts enforce the classic UI proportionality formula:
- **60% Dominant Foundation (Atmosphere & Canvas):** The global canvas, background wrappers, generous whitespace, and macro margins. Creates visual calm and anchors the user's eyes.
- **20% Structural Architecture (Containers & Wayfinding):** Elevated cards, persistent navigation rails, table surfaces, dividers, and modal backdrops. Gives clear shape, boundaries, and spatial order to content.
- **10% High-Impact Accent (Focal Target & Primary Action):** Reserved strictly for primary call-to-actions, active route indicators, stepper progression dots, progress bar fills, and critical highlights.
- **10% Contrast & Semantics (Typography & Status Badges):** High-luminance typography (`#F8FAFC` / `#0F172A`) and semantic health indicators (emerald approved, amber review, rose action needed).

### 1.2 Color Distribution Matrix Across Dashboards (60% / 20% / 10%)

| Portal | 60% Dominant Foundation | 20% Structural Containers | 10% High-Impact Accent | 10% Text & Status Details |
| :--- | :--- | :--- | :--- | :--- |
| **Public / Homepage** | `#F1F4F9` (Civic Off-White Canvas) | `#FFFFFF` (Crisp White Glass Cards & Nav) | `#2563EB` (Royal Blue) & `#D97706` (Gold) | `#0F172A` Text + `#059669` Badges |
| **Student Dashboard** | `#0B1326` (Deep Navy Slate Canvas) | `#131F33` / `#171F33` (Elevated Groupings) | `#00F0FF` (Neon Cyan) & `#7000FF` (Violet) | `#DAE2FD` Text + Emerald/Amber |
| **Parent Dashboard** | `#070D1E` (Protective Slate Canvas) | `#0F172A` / `#131F3B` (Household Cards) | `#6366F1` (Indigo) & `#10B981` (Emerald CTA) | `#F8FAFC` Text + Child Badges |
| **Chief Dashboard** | `#0B1120` (Civic Authority Canvas) | `#101C38` / `#152445` (Vetting Docket Cards)| `#E9C349` (Sovereign Gold) & `#7DF4FF` | `#F8FAFC` Text + Vetting Pills |
| **MCA Executive** | `#070D1E` (Executive BI Canvas) | `#0E172E` / `#101C38` (BI Chart & Ledgers) | `#3B82F6` (Cobalt) & `#06B6D4` (Cyan Fill) | `#F8FAFC` Text + Budget Meters |
| **Help Desk** | `#070C16` (High-Tempo Canvas) | `#0B1322` / `#111C2E` (Search & Case Cards)| `#10B981` (Emerald) & `#F59E0B` (Ochre) | `#FFFFFF` Text + Triage Badges |

### 1.3 Typography Scale
- **Headlines (`font-family: 'Sora', sans-serif`):** Bold, geometric, authoritative. Page titles `20px` / `24px`; Section titles `16px` / `18px`.
- **Body & Controls (`font-family: 'Hanken Grotesk', sans-serif`):** Crisp, readable, neutral. Standard body `14px` (`0.875rem`); Secondary `13px`.
- **Metadata & Data Tags (`font-family: 'JetBrains Mono', monospace`):** Tracking codes, amounts, dates, status pills `12px` / `13px`.

### 1.4 The "Never Get Lost" Universal Wayfinding Rules
Every dashboard implements the following 5 wayfinding anchors:
1. **Persistent Location Breadcrumb & Portal Identifier:** The header consistently displays `[Portal Crest] > [Current Space] > [Active Sub-page]`.
2. **Standard 3-Zone Shell:** Top Sticky Header (Identity & Profile), Left Desktop Nav / Bottom Mobile Nav (Primary Workflows), Center Single-Scroll Stage.
3. **Primary Action Anchor:** Never more than ONE dominant visual CTA per screen (rendered in the 10% accent). Secondary actions are 20% structural ghost buttons.
4. **Connected Steppers over Card Clutter:** Workflows (wizards, statuses, reviews) use numbered linear steppers instead of disjointed stacked cards.
5. **Progressive Disclosure:** Dense tables use expandable drawer rows or dedicated slide-overs; filters are cleanly docked with clear active counts.

---

## 2. Dashboard Redesign Specifications & Google Stitch Prompts

---

### DASHBOARD 1: Public Civic Homepage (`/` & `/guest`)

#### A. Core Function & Aim
The public transparency and intake window for the Tendeno/Sorget Ward CDF Bursary. It provides citizens, parents, and students with transparent allocation statistics, verified ward baraza dates, an interactive application guide, and an unmistakable entry point into their respective authenticated portals.

#### B. Functionality & Actions
- **Actions:** Sign In / Register redirection; explore village bursary disbursement data; filter village statistics; step through the application roadmap; expand FAQs; access CDF office contact details and privacy policies.
- **Homepage Special Instruction:** Improve and elevate the hero section with high-clarity typography, quick status inquiry, and sleek CTAs; fully redesign all subsequent sections into an enterprise civic transparency portal.

#### C. Content & Representation Hierarchy (60-20-10 Rule Applied)
1. **Elevated Hero Section (Top):**
   - Brand cluster (NG-CDF Official Crest + Ward Name).
   - Headline: *"Empowering Tendeno / Sorget Through Transparent Education Grants"*.
   - Sub-headline: Official bursary disbursement platform for Secondary, TVET, College, and University students.
   - Dual Primary Action: `[ Apply / Sign In ]` (10% High-Impact Royal Blue CTA) + `[ Track Application ]` (20% Structural Tactile Outline).
   - High-trust Live Ticker Strip: Active Financial Year `2025/2026`, Total Ward Allocation `KES 35,000,000`, Beneficiaries `2,450+ Students`.
2. **Bursary Process Guide (Redesigned):**
   - 4-step horizontal interconnected timeline: `1. Online Submission` -> `2. Chief & Baraza Vetting` -> `3. Committee Allocation` -> `4. Direct Institution Remittance`.
   - Collapsible checklist for required documents (National ID / Birth Cert, Certified Fee Statement).
3. **Village Allocation & Equity Matrix (Redesigned):**
   - Searchable, interactive grid of sub-locations (Highridge, Parklands Central, Spring Valley, Sorget Central, Tendeno North, Kapsorok).
   - Visual percentage distribution meters (10% Royal Blue progress fills inside 20% white card containers).
4. **Civic FAQ Accordion (Redesigned):**
   - Single-surface expandable questions with active indicator, search filter, and instant clarity.
5. **Ward Office & Governance Footer (Redesigned):**
   - Office physical location map link, Chief baraza schedules, PFM Act compliance note, direct Help Desk contact.

#### D. Google Stitch Design Prompt — Homepage
```markdown
[STITCH_PROMPT_START: PUBLIC_CIVIC_HOMEPAGE]
ROLE: Senior Civic Product Designer & Google Stitch Architect.
DESIGN SYSTEM: Aetheric Civic Portal (Google Stitch Standard).
COLOR DISTRIBUTION (60-20-10 RULE):
- 60% DOMINANT CANVAS: #F1F4F9 (Cool Civic Canvas with generous whitespace)
- 20% STRUCTURAL CONTAINERS: #FFFFFF (Crisp White Glass Cards & Header Shell)
- 10% HIGH-IMPACT ACCENT: #2563EB (Royal Blue for CTAs & active tabs) + #D97706 (Civic Gold highlights)
- 10% CONTRAST & SEMANTICS: #0F172A (Deep Navy typography) + #059669 (Verified Green badges)

LAYOUT ARCHITECTURE:
- Sticky Frosted Top Header: NG-CDF logo, Ward Crest, anchor links (Process, Allocation, FAQ, Contact), and Sign In CTA pill.
- Refined Hero Zone:
  - Clean asymmetrical grid (60% value prop + 40% live transparency ticker card).
  - Sora 36px headline, 16px Hanken Grotesk body.
  - CTAs with 44px min touch target, tactile shadow, and JetBrains Mono status pill.
- Stepper Section: Horizontal 4-node connected glass track replacing heavy cards. Nodes glow blue on hover.
- Village Distribution Matrix: High-contrast data tiles with 8px radius progress bars, search input at top.
- Civic FAQ: Single container with 1px borders, smooth 180ms ease-out expander, no nested cards.
- Trust Footer: 4-column structured directory with physical office hours and legal disclosures.

USABILITY DIRECTIVES:
- Zero navigation dead-ends: every section guides user towards login/registration or tracking.
- All numbers paired with semantic labels and source disclosure ("Audited by CDF Ward Committee").
[STITCH_PROMPT_END]
```

---

### DASHBOARD 2: Student Operational Dashboard (`/student/*`)

#### A. Core Function & Aim
The student's operational mission control. It answers one vital question in under 3 seconds: *"What is happening with my bursary right now, and what action do I need to take?"*

#### B. Page-by-Page Architectural Breakdown (60-20-10 Rule Applied)

##### 1. Student Dashboard Overview (`StudentDashboardPage.jsx`)
- **Core Function:** Status orientation, next required action, and active cycle timeline.
- **Color Balance:** 60% Canvas (`#0B1326`), 20% Containers (`#131F33`), 10% Accent (`#00F0FF` Cyan active milestones & primary CTAs), 10% Text (`#DAE2FD`).
- **Hierarchy:**
  1. *Header Breadcrumb:* `Student Portal > My Dashboard`.
  2. *Dominant Status Hero:* Full-width status banner with tone (Amber = Pending Review, Cyan = Chief Approved, Emerald = Disbursed, Rose = Action Needed). Features a linear 5-step milestone stepper (`Submitted` -> `Chief Vetted` -> `Committee Review` -> `Awarded` -> `Funds Sent`).
  3. *Action Callout Panel (Conditional):* High-visibility card shown only if documents or corrections are needed, with direct CTA button in 10% Neon Cyan.
  4. *Quick Action Grid (4-up):* `[My Applications]` `[Upload Documents]` `[Lodge Appeal]` `[Help Desk Support]`.
  5. *Recent Transparency Log:* Clean list of recent system events (e.g., "Chief Kibet verified residency - Oct 14").

##### 2. Student Applications Page (`StudentApplicationsPage.jsx`)
- **Core Function:** Historical and active application ledger.
- **Hierarchy:** Active cycle badge + `[+ New Application]` primary CTA -> Expandable Application Rows with safe tracking code and status pill.

##### 3. Student Application Wizard (`StudentWizardPage.jsx`)
- **Core Function:** Multi-step application submission without fatigue or form anxiety.
- **Hierarchy:** Top 4-step progress stepper -> Single active 20% container surface with semantic fields -> Sticky Step Footer with `[Save & Continue]` (10% Cyan).

##### 4. Student Documents Hub (`StudentDocumentsPage.jsx`)
- **Core Function:** Document compliance verification and secure file uploading.
- **Hierarchy:** Ring compliance progress indicator ("3 of 4 Verified") -> 4 Document Slots (ID, Fee Statement, Admission Letter, Special Proof) -> Secure Dropzone.

##### 5. Student Forms & Letters (`StudentFormsPage.jsx`)
- **Core Function:** Download official ward bursary forms and award acknowledgment slips.
- **Hierarchy:** Grid of downloadable PDF cards with file size, revision date, and direct download icon.

##### 6. Student Appeals Page (`StudentAppealsPage.jsx`)
- **Core Function:** Structured recourse for rejected or under-funded applicants.
- **Hierarchy:** Rejection Reason Notice -> Case Justification Textarea -> File Attachment -> `[Submit Official Appeal]` (10% Violet/Cyan).

##### 7. Student Link Parents Page (`StudentLinkParentsPage.jsx`)
- **Core Function:** Manage delegated access with parents or legal guardians.
- **Hierarchy:** Active Guardians Card -> Permission Level Summary -> Invite Guardian Form.

##### 8. Student Notifications Page (`StudentNotificationsPage.jsx`)
- **Core Function:** Audit log of all dispatches, deadline reminders, and status changes.
- **Hierarchy:** Category Filter Tabs (`All`, `Urgent`, `Verifications`, `Disbursements`) -> Chronological Feed List.

##### 9. Student Support Page (`StudentSupportPage.jsx`)
- **Core Function:** Direct problem escalation to Ward Help Desk and Area Chief.
- **Hierarchy:** Quick Contact Tiles (Ward Office, Chief Baraza, Bursary Hotline) -> FAQ Search -> Submit Support Ticket.

##### 10. Student Profile & Security (`StudentProfilePage.jsx`)
- **Core Function:** Account authentication, phone verification, and academic institution profile.
- **Hierarchy:** Identity Card (Name, Masked ID, Institution) -> Contact Details -> Security Settings -> Sign Out.

#### C. Google Stitch Design Prompt — Student Dashboard
```markdown
[STITCH_PROMPT_START: STUDENT_OPERATIONAL_DASHBOARD]
ROLE: Lead UI Designer & Google Stitch Prototyper.
DESIGN SYSTEM: Aetheric Neon Cyan (Google Stitch High-Tech Standard).
COLOR DISTRIBUTION (60-20-10 RULE):
- 60% DOMINANT CANVAS: #0B1326 (Deep Navy Slate base canvas across full viewport)
- 20% STRUCTURAL CONTAINERS: #131F33 / #171F33 (Frosted surface containers, left nav rail, checklist panels)
- 10% HIGH-IMPACT ACCENT: #00F0FF (Neon Cyan for primary CTA button, pulsing stepper node, focus rings) + #7000FF (Electric Violet for secondary chips)
- 10% CONTRAST & SEMANTICS: #DAE2FD (High-contrast typography) + Emerald/Amber/Rose status cues

LAYOUT ARCHITECTURE:
- Shell: 240px Left Navigation Rail (Desktop) / 5-Tab Frosted Bottom Nav (Mobile).
  - Tabs: Home, Applications, Documents, Support, Profile.
- Page Top Header: Subtle frosted glass with Ward Mark, "Student Portal", unread bell dot, and avatar.
- Main Workspace:
  - Max width 1100px centered.
  - Dominant Status Hero: 16px radius container with 1px cyan tint border (`rgba(0, 240, 255, 0.25)`).
  - Integrated 5-step horizontal stepper with pulsing cyan dot on active stage.
  - Action Needed Alert: Clean inset strip with amber left border (not a jarring full-yellow box).
  - 4-Tile Action Grid: 14px Hanken Grotesk labels, 24px Lucide-style SVG icons, 1.02x tactile hover lift.
  - Document Hub: Checklist rows with status pill (Verified = Emerald, Missing = Rose, Pending = Cyan).

USABILITY DIRECTIVES:
- Eliminate confusion: Student must never wonder what happens next. The top status hero explicitly states the pending milestone and estimated turnaround.
- Touch-first responsive: 48px touch targets for mobile uploads and actions.
[STITCH_PROMPT_END]
```

---

### DASHBOARD 3: Parent Household Dashboard (`/parent/*`)

#### A. Core Function & Aim
The household aggregation and oversight portal for parents and legal guardians. It allows a parent to monitor, manage, and apply for multiple school-going dependents across different institutions from a single secure login.

#### B. Page-by-Page Architectural Breakdown (60-20-10 Rule Applied)

##### 1. Parent Household Dashboard (`ParentDashboardPage.jsx`)
- **Core Function:** Multi-child bird’s-eye view, aggregate household bursary value, and action prioritization.
- **Color Balance:** 60% Canvas (`#070D1E`), 20% Structural (`#0F172A` / `#131F3B`), 10% Accent (`#6366F1` Indigo & `#10B981` Emerald), 10% Text (`#F8FAFC`).
- **Hierarchy:**
  1. *Household Overview Band:* Total Linked Children, Total Allocated Funds (KES), Applications in Review count, Urgent Action count.
  2. *Quick Actions Bar:* `[+ Add Dependent Child]` (10% Emerald Accent) + `[Start Application for Child]`.
  3. *Dependent Student Card Grid:* Distinct card per child displaying: Student Name, Institution, Academic Level, Current Status Pill, Next Action Indicator, and `[Open Student Dashboard]` link.
  4. *Household Alerts Log:* Aggregated notifications across all dependents.

##### 2. Parent Applications Overview (`ParentApplicationsPage.jsx`)
- **Core Function:** Comprehensive ledger of all applications submitted across all household dependents.
- **Hierarchy:** Multi-select Child Filter Pills -> Aggregate Summary Metrics -> High-Density Table with Child Name, School, Amount, Status, and Action.

##### 3. Parent Child Application Wizard (`ParentChildWizardPage.jsx`)
- **Core Function:** Allows parent to draft and submit a bursary application on behalf of a minor child.
- **Hierarchy:** Child Selector Header -> 3-Step Wizard Track -> Review & Submit.

##### 4. Parent Documents Central (`ParentDocumentsPage.jsx`)
- **Core Function:** Cross-household document status overview.
- **Hierarchy:** Parent Master Identity Documents (Shared) -> Per-Child Document Breakdown Cards with direct upload triggers.

##### 5. Parent Add Child Page & Modal (`ParentAddChildPage.jsx`)
- **Core Function:** Link a new student to the parent's household record.
- **Hierarchy:** Custody Declaration Notice -> Child Identity Fields -> School Information -> Verification Confirmation CTA.

##### 6. Parent Household Notifications (`ParentNotificationsPage.jsx`)
- **Core Function:** Centralized notification inbox for all children in the household.
- **Hierarchy:** Child Avatar Filter Toggles -> Chronological Notification List with color-coded severity tags.

##### 7. Parent Profile, Guardianship & Security (`ParentProfilePage.jsx`)
- **Core Function:** Parent account settings, National ID verification, and delegated access permissions.
- **Hierarchy:** Parent Verified Identity Card -> Linked Dependents Management List -> Account Security & 2FA.

#### C. Google Stitch Design Prompt — Parent Dashboard
```markdown
[STITCH_PROMPT_START: PARENT_HOUSEHOLD_DASHBOARD]
ROLE: Senior Product Architect & Google Stitch Specialist.
DESIGN SYSTEM: Aetheric Guardian Indigo (Google Stitch Corporate-Clean Standard).
COLOR DISTRIBUTION (60-20-10 RULE):
- 60% DOMINANT CANVAS: #070D1E (Deep Slate Canvas providing protective visual atmosphere)
- 20% STRUCTURAL CONTAINERS: #0F172A / #131F3B (Household metric summary band, child cards, table frames)
- 10% HIGH-IMPACT ACCENT: #6366F1 (Indigo primary CTA) + #10B981 (Emerald "+ Add Child" & allocation totals)
- 10% CONTRAST & SEMANTICS: #F8FAFC (High contrast text) + Status chips (Emerald / Amber / Rose)

LAYOUT ARCHITECTURE:
- Shell: Consistent Left Sidebar (Desktop) / Bottom Nav (Mobile) with tabs: Dashboard, Applications, Documents, Notifications, Profile.
- Header: Parent identity label ("Parent / Guardian: Jane Koech"), global theme switcher, notification bell.
- Household Hero Band:
  - High-impact aggregate metric strip: Active Dependents (3), Allocated Grants (KES 45,000), Pending Approvals (1).
  - Prominent "+ Add Dependent Child" button with emerald accent.
- Student Cards Grid (The Core Element):
  - 2-column desktop / 1-column mobile layout.
  - Each child card features: Avatar with initial, Student Name (Sora 18px), School Name, Grade/Level.
  - 4-metric sub-grid inside card: Status Pill, Allocated KES, Document Health (3/3), Next Milestone.
  - Dominant CTA inside card: "Manage Child Application ->" which seamlessly branches into child operational context.

USABILITY DIRECTIVES:
- Clear separation of concerns: Parent never gets confused between which child requires attention. Cards with missing documents have a subtle amber ring and an unmistakable "Action Required for Brian" badge.
[STITCH_PROMPT_END]
```

---

### DASHBOARD 4: Area Chief Vetting Dashboard (`/chief/*`)

#### A. Core Function & Aim
The administrative vetting and verification portal for Area Chiefs and Assistant Chiefs. It provides the judicial tools to verify residency, evaluate genuine economic hardship, record community baraza vetting minutes, and approve or flag bursary applications with legally defensible notes.

#### B. Page-by-Page Architectural Breakdown (60-20-10 Rule Applied)

##### 1. Chief Jurisdiction Vetting Dashboard (`ChiefDashboardPage.jsx`)
- **Core Function:** Chief’s morning briefing: workload overview, pending vetting queue, and baraza session metrics.
- **Color Balance:** 60% Canvas (`#0B1120`), 20% Containers (`#101C38` / `#152445`), 10% Accent (`#E9C349` Sovereign Gold), 10% Text (`#F8FAFC`).
- **Hierarchy:**
  1. *Chief Jurisdiction Header:* Sub-location label, Chief rank, active vetting window deadline.
  2. *Executive Metric Tiles (Gold Theme):* `Pending Vetting (42)`, `Verified & Approved (189)`, `Flagged / Inquiries (8)`, `Total Allocation (KES 3.2M)`.
  3. *Urgent Attention Shelf:* Students facing immediate school fees deadlines or orphan priority cases.
  4. *Sub-Village Distribution Bar Chart:* Visual progress of applications reviewed per sub-village.
  5. *Quick Launch Bar:* `[Review Pending Applications Queue]` (10% Dominant Gold Button).

##### 2. Chief Applications Queue & Table (`ChiefApplicationsPage.jsx`)
- **Core Function:** High-efficiency, searchable vetting table for all applicants in the Chief’s administrative area.
- **Hierarchy:** Filter Bar (Sub-location, Category, Status) -> Search Field -> High-Contrast Table (Student, Village, School, Need Level, Status, Vetting Action) -> Pagination & Batch Actions bar.

##### 3. Chief Application Individual Review (`ChiefApplicationReviewPage.jsx`)
- **Core Function:** Deep-dive verification page for a single applicant.
- **Hierarchy:** Top breadcrumb `<- Back to Queue` -> Split Workstation (Left: Applicant Dossier & Proofs; Right: Vetting Console, Baraza Notes, Verdict Buttons in 10% Gold/Emerald).

##### 4. Chief Appeals & Community Hearings (`ChiefAppealsPage.jsx`)
- **Core Function:** Processing appeals lodged by students/parents dissatisfied with initial allocations or rejections.
- **Hierarchy:** Pending Appeals Counter -> Hearing Schedule Calendar -> Appeals Ledger with grounds summary.

##### 5. Chief Appeal Review Workspace (`ChiefAppealReviewPage.jsx`)
- **Core Function:** Formal adjudication of a contested application.
- **Hierarchy:** Comparison Diff View (Original vs Appeal) -> Hearing Notes -> Final Adjudication CTA.

##### 6. Chief Ward Profile & Baraza Settings (`ChiefProfilePage.jsx`)
- **Core Function:** Chief official administrative profile, jurisdiction boundary settings, and baraza schedule notices.
- **Hierarchy:** Official Credentials Card -> Baraza Calendar Configuration -> System Audit Log.

#### C. Google Stitch Design Prompt — Chief Dashboard
```markdown
[STITCH_PROMPT_START: CHIEF_VETTING_DASHBOARD]
ROLE: Government & Judicial UX Architect & Google Stitch Designer.
DESIGN SYSTEM: Sovereign Gold (Google Stitch Civic Authority Standard).
COLOR DISTRIBUTION (60-20-10 RULE):
- 60% DOMINANT CANVAS: #0B1120 (Deep Midnight Navy Canvas for judicial authority)
- 20% STRUCTURAL CONTAINERS: #101C38 / #152445 (Docket containers, vetting table, baraza schedule strip)
- 10% HIGH-IMPACT ACCENT: #E9C349 (Sovereign Gold for primary review CTA, urgent tags, active verification stamp) + #7DF4FF (Teal secondary indicators)
- 10% CONTRAST & SEMANTICS: #F8FAFC (High-contrast typography) + Need Level Badges (Orphan = Violet, Vulnerable = Amber)

LAYOUT ARCHITECTURE:
- Shell: Left Desktop Navigation Rail / Mobile Header + Bottom Nav.
  - Tabs: Vetting Dashboard, Applications Queue, Appeals Hearings, Profile.
- Sovereign Header: Official Kenya Coat of Arms / Ward Crest, Chief rank badge, "Area Chief Vetting Workspace", active session status.
- Dashboard Canvas:
  - Gold Accent Metrics Band: 4 high-contrast metric cards with 1px gold border (`rgba(233, 195, 73, 0.3)`).
  - Clean Dual-Column Layout: Left (Pending Queue Preview, max-width 700px) / Right (Village Allocation Progress & Baraza Schedule, 400px).
  - Vetting Table: JetBrains Mono tracking codes, bold student names, color-coded need indicators, single-click "Review" button.
  - Review Split-Screen: Sticky document viewer on left, decision form with standardized civic checklist on right.

USABILITY DIRECTIVES:
- Zero ambiguity on decisions: Chief must provide written grounds for any decline action. Confirmation modal prevents accidental bulk decisions.
- High-efficiency keyboard navigation: Enter to approve, Tab to next field during rapid review sessions.
[STITCH_PROMPT_END]
```

---

### DASHBOARD 5: MCA Executive Oversight Dashboard (`/mca/*`)

#### A. Core Function & Aim
The legislative governance, budget allocation, and transparency dashboard for the Member of County Assembly (MCA) and the Ward Bursary Committee. It provides macroeconomic oversight, real-time fiscal disbursement tracking, village distribution equity analytics, and committee-level sign-offs.

#### B. Page-by-Page Architectural Breakdown (60-20-10 Rule Applied)

##### 1. MCA Executive Oversight Dashboard (`MCADashboardPage.jsx`)
- **Core Function:** High-level strategic command center for ward bursary governance.
- **Color Balance:** 60% Canvas (`#070D1E`), 20% Containers (`#0E172E` / `#101C38`), 10% Accent (`#3B82F6` Cobalt & `#06B6D4` Cyan), 10% Text (`#F8FAFC`).
- **Hierarchy:**
  1. *Executive Header:* Ward Title ("Tendeno / Sorget Ward CDF"), Legislative Term, Fiscal Cycle `2025/2026`.
  2. *Fiscal KPI Strip:* `Total Budget (KES 35M)`, `Disbursed to Date (KES 22.4M - 64%)`, `Approved Beneficiaries (2,410)`, `Pending Committee Sign-off (180)`.
  3. *Equity Distribution Map / Chart:* Sub-location allocation vs target parity meters.
  4. *Institution Sector Breakdown:* Secondary Schools vs TVETs vs Universities grant split.
  5. *Recent Committee Resolutions Shelf:* Approved batch lists ready for bank EFT dispatch.

##### 2. MCA Bursary Applications & Allocation Management (`MCAApplicationsPage.jsx`)
- **Core Function:** Comprehensive ward-wide master applications ledger.
- **Hierarchy:** Master Filter Header -> Summary Allocation KPIs -> High-Performance Data Table with multi-sort, batch checkboxes, and CSV Export.

##### 3. MCA Institutional Disbursements (`MCAInstitutesPage.jsx`)
- **Core Function:** Partner educational institutions tracking and remittance verification.
- **Hierarchy:** Institution Category Tabs (`Secondary`, `TVET`, `Colleges`, `Universities`) -> Search by School -> Institution Summary Cards.

##### 4. MCA Ward Grievances & Civic Inquiries (`MCAIssuesPage.jsx`)
- **Core Function:** Oversight of citizen complaints, delayed disbursement inquiries, and committee escalations.
- **Hierarchy:** Grievance Priority Matrix (High, Normal, Low) -> Inquiries Table -> Escalation Detail Drawer.

##### 5. MCA Document Compliance & Financial Audit Trail (`MCADocumentsPage.jsx`)
- **Core Function:** Statutory audit repository for Auditor General, County Assembly, and CDF board scrutiny.
- **Hierarchy:** Statutory Compliance Checklist -> Financial Year Document Folders -> One-Click PDF Batch Downloader.

##### 6. MCA Notifications & Legislative Dispatches (`MCANotificationsPage.jsx`)
- **Core Function:** Official circulars, treasury disbursements notifications, and vetting deadlines.
- **Hierarchy:** System Alerts Feed -> Ward Announcement Broadcast Composer.

##### 7. MCA Ward Office Profile & Committee Delegation (`MCAProfilePage.jsx`)
- **Core Function:** Ward office administrative configuration and Bursary Committee member delegations.
- **Hierarchy:** Ward Executive Profile -> Committee Members Delegation Table -> System Security & Audit Settings.

#### C. Google Stitch Design Prompt — MCA Dashboard
```markdown
[STITCH_PROMPT_START: MCA_EXECUTIVE_DASHBOARD]
ROLE: Executive BI & Public Sector UX Designer & Google Stitch Architect.
DESIGN SYSTEM: Executive Cobalt & Cyan (Google Stitch Business Intelligence Standard).
COLOR DISTRIBUTION (60-20-10 RULE):
- 60% DOMINANT CANVAS: #070D1E (Deep Strategic Canvas providing calm analytical foundation)
- 20% STRUCTURAL CONTAINERS: #0E172E / #101C38 (Left sidebar, BI chart surfaces, table ledger frames)
- 10% HIGH-IMPACT ACCENT: #3B82F6 (Executive Cobalt for batch sign-offs) + #06B6D4 (Cyan for disbursement progress fills)
- 10% CONTRAST & SEMANTICS: #F8FAFC (High contrast numerals & typography) + Budget Variance Status Badges

LAYOUT ARCHITECTURE:
- Shell: 260px Left Sidebar (Desktop) with deep navy background (`#0A1329`) and clean tab grouping:
  - Oversight (Dashboard, Master Applications)
  - Finance & Partners (Institutions, Audit Documents)
  - Governance (Grievances, Notifications, Office Profile)
- Top Bar: Legislative banner with Ward Seal, Fiscal Year indicator, and instant "Export Audit Report" CTA.
- Main Dashboard Stage:
  - 4-Card Hero Metrics Band: JetBrains Mono numerals (28px), clear progress tracks with emerald/cyan gradient fills.
  - Split BI Grid:
    - Left (60%): Interactive Sub-location Equity Breakdown with progress bars and variance indicators.
    - Right (40%): Sector Allocation Donut/Bar Chart (Secondary 52%, TVET 24%, Tertiary 24%).
  - Applications Ledger: High-density, professional spreadsheet styling with fixed table headers, zebra striping, and status badges.

USABILITY DIRECTIVES:
- Clear executive clarity: No hidden financial totals. High-level aggregates drill down into individual applicant rows in exactly 1 click.
- High-trust compliance: Every disbursement tranche displays the corresponding payment voucher / EFT batch number.
[STITCH_PROMPT_END]
```

---

### DASHBOARD 6: Help Desk Operational Dashboard (`/helpdesk/*`)

#### A. Core Function & Aim
The rapid triage, applicant assistance, and walk-in support workspace for ward help desk officers, cyber attendants, and constituency caseworkers. It is built for speed: looking up citizen records instantly, resolving missing document bottlenecks, assisting walk-in parents/students, and tracking physical document intake.

#### B. Page-by-Page Architectural Breakdown (60-20-10 Rule Applied)

##### 1. Help Desk Command Center (`HelpDeskDashboardPage.jsx`)
- **Core Function:** Live walk-in queue, rapid citizen lookup, and shift activity briefing.
- **Color Balance:** 60% Canvas (`#070C16`), 20% Containers (`#0B1322` / `#111C2E`), 10% Accent (`#10B981` Emerald & `#F59E0B` Ochre), 10% Text (`#FFFFFF`).
- **Hierarchy:**
  1. *Global Omni-Search Bar (Prominent Top):* 48px input: *"Search applicant by National ID, Birth Certificate, Phone or Case ID..."*
  2. *Operational Metrics Strip:* `Walk-ins Assisted Today (38)`, `Pending Document Fixes (14)`, `Active Cases (142)`, `Resolution Rate (94%)`.
  3. *Active Queue & Recent Lookups:* Quick-access list of applicants currently being served at the desk.
  4. *Quick Support Action Tiles:* `[Register Walk-in Applicant]` `[Upload Scanned Document]` `[Print Status Slip]` `[Escalate to Chief]`.
  5. *Village Schedule & Baraza Locator:* In-place lookup of chief baraza dates and venues.

##### 2. Help Desk Applicant Search & Case Resolution (`HelpDeskApplicationsPage.jsx`)
- **Core Function:** Diagnostic search and case modification portal for help desk agents.
- **Hierarchy:** Search Header -> Results Table with Quick Action Drawer -> Case Resolution Action Panel.

##### 3. Help Desk Document Verification & Physical Scanning Hub (`HelpDeskDocumentsPage.jsx`)
- **Core Function:** Physical intake and digitization of paper documents brought to the ward office.
- **Hierarchy:** Walk-in Intake Batch Form -> Camera / Scanner Upload Dropzone -> Document Preview & Validation Checker.

##### 4. Help Desk Educational Institutions Directory (`HelpDeskInstitutionsPage.jsx`)
- **Core Function:** Verified reference directory of school bank accounts, NEMIS / KUCCPS codes, and principal contacts.
- **Hierarchy:** Search by Institution Name / Code -> Category Pills -> Institution Detail Modal.

##### 5. Help Desk Agent Profile & Shift Session Log (`HelpDeskProfilePage.jsx`)
- **Core Function:** Agent shift tracking, desk location assignment, and daily activity audit.
- **Hierarchy:** Agent Identity Card -> Shift Station Status Badge -> Daily Audit Log of Assisted Citizens.

#### C. Google Stitch Design Prompt — Help Desk Dashboard
```markdown
[STITCH_PROMPT_START: HELPDESK_OPERATIONAL_DASHBOARD]
ROLE: High-Tempo Operational UI Designer & Google Stitch Architect.
DESIGN SYSTEM: Operative Emerald & Ochre (Google Stitch Rapid-Service Standard).
COLOR DISTRIBUTION (60-20-10 RULE):
- 60% DOMINANT CANVAS: #070C16 (Dark Tactile Canvas for reduced eye strain during 8hr shifts)
- 20% STRUCTURAL CONTAINERS: #0B1322 / #111C2E (Omni-search container, walk-in case workspace, queue list)
- 10% HIGH-IMPACT ACCENT: #10B981 (Operative Emerald for instant resolution CTA & active status) + #F59E0B (Ochre alert pills)
- 10% CONTRAST & SEMANTICS: #FFFFFF (Crisp white typography) + Match Highlight tags

LAYOUT ARCHITECTURE:
- Shell: High-contrast Dark Slate container with compact Left Rail (Desktop) / Mobile Nav.
  - Tabs: Desk Home, Search & Cases, Document Scanner, Institutions, Agent Shift.
- Omni-Search Hero: Dominant 48px search input at top of page with instant debounce query results dropdown.
- Metrics Band: 4 tactical dark tiles (`#070C16`) with 1px subtle border, glowing emerald active counters.
- Main Workspace:
  - 2-Column Split:
    - Left Column (65%): Active Walk-in Session & Case Detail Workspace.
    - Right Column (35%): Rapid Actions Drawer & Village Baraza Schedules.
  - Tables: Tight 12px padding, high-contrast white text, highlighted matching search terms, immediate 1-click action buttons ("View", "Fix Doc", "Send SMS").

USABILITY DIRECTIVES:
- Maximum speed: Help Desk agent must be able to resolve a citizen's inquiry in under 60 seconds without page reloads.
- Clear state indicators: Every applicant record clearly displays if failure is due to missing ID, invalid fee structure, or pending chief review.
[STITCH_PROMPT_END]
```

---

## 3. Master Consistency & Cross-Dashboard Alignment Matrix

| Feature | Homepage | Student Dashboard | Parent Dashboard | Chief Dashboard | MCA Dashboard | Help Desk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Aim** | Civic Transparency & Intake | Operational Status & Direct Action | Household Oversight (Multi-Child) | Residency & Need Vetting | Budget Oversight & Equity | Rapid Walk-in Triage |
| **60% Dominant Base**| `#F1F4F9` (Light) | `#0B1326` (Dark) | `#070D1E` (Dark) | `#0B1120` (Dark) | `#070D1E` (Dark) | `#070C16` (Dark) |
| **20% Structural Box**| `#FFFFFF` | `#131F33` | `#0F172A` / `#131F3B` | `#101C38` / `#152445` | `#0E172E` / `#101C38` | `#0B1322` / `#111C2E` |
| **10% High Accent** | Royal Blue (`#2563EB`) | Neon Cyan (`#00F0FF`) | Indigo (`#6366F1`) | Sovereign Gold (`#E9C349`) | Cobalt (`#3B82F6`) | Emerald (`#10B981`) |
| **10% Text & Status** | `#0F172A` / Green | `#DAE2FD` / Amber | `#F8FAFC` / Emerald | `#F8FAFC` / Violet | `#F8FAFC` / Cyan | `#FFFFFF` / Ochre |
| **Primary Navigation**| Floating Glass Nav Bar | 240px Left Rail / 5 Tabs | 240px Left Rail / 5 Tabs | 240px Left Rail / 4 Tabs | 260px Left Rail / 7 Tabs | Compact Rail / 5 Tabs |
| **Hero Zone Structure**| Value Prop + Live Ticker | Dominant Status Stepper | Household Aggregate Band | Vetting Queue Status Band | 4-Card Budget KPI Strip | Global Omni-Search Bar |
| **Primary CTA** | Apply / Track | Next Pending Milestone | + Add Dependent Child | Review Vetting Queue | Authorize Batch | Lookup Citizen Record |
| **Wayfinding Guard**| Clear portal signposts | Single next-step guidance | Dedicated cards per child | Split-screen docket view | Direct aggregate-to-row drilldown | <60s record resolution |
