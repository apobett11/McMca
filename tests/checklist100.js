/**
 * 100 Verification Checklist Items for McMCA Full Year Cycle
 * Meticulously defines every single requirement, user action,
 * data transition, and temporal gate for the entire bursary ecosystem.
 */

export const CHECKLIST_100 = [
  // -------------------------------------------------------------
  // Domain 1: Public & Guest Discovery (1 - 10)
  // -------------------------------------------------------------
  {
    id: 1,
    domain: 'Public & Guest Discovery',
    title: 'Guest Landing Page Hero & Brand Presentation',
    description: 'Verify guest page renders Tendeno/Sorget Ward headline, mission overview, and transparent CDF badge.',
    dashboard: 'Guest Portal'
  },
  {
    id: 2,
    domain: 'Public & Guest Discovery',
    title: 'Bursary Eligibility & Guidelines Display',
    description: 'Verify bursary categories (Secondary, College/University, Primary, Household) display criteria and requirements.',
    dashboard: 'Guest Portal'
  },
  {
    id: 3,
    domain: 'Public & Guest Discovery',
    title: 'Ward Institutions Directory Listing',
    description: 'Verify Ward Institutions (VTCs, Technical Institutes, Innovation Hubs) load with fees and subsidized percentages.',
    dashboard: 'Guest Portal'
  },
  {
    id: 4,
    domain: 'Public & Guest Discovery',
    title: 'Institution Search & Filter Controls',
    description: 'Verify real-time search input filters institutions by keyword and category.',
    dashboard: 'Guest Portal'
  },
  {
    id: 5,
    domain: 'Public & Guest Discovery',
    title: 'Institution Course Offerings Modal / Card Details',
    description: 'Verify course listings and entry requirements are visible per vocational centre.',
    dashboard: 'Guest Portal'
  },
  {
    id: 6,
    domain: 'Public & Guest Discovery',
    title: '3-Step Admission Application Modal Launch',
    description: 'Verify clicking "Apply for Admission" on an institution card launches the 3-step application wizard modal.',
    dashboard: 'Guest Portal'
  },
  {
    id: 7,
    domain: 'Public & Guest Discovery',
    title: 'Admission Modal Step 1 Validation (Student Details)',
    description: 'Verify step 1 requires student name, national ID/birth certificate, email, and phone before proceeding.',
    dashboard: 'Guest Portal'
  },
  {
    id: 8,
    domain: 'Public & Guest Discovery',
    title: 'Admission Modal Step 2 Validation (Guardian Details)',
    description: 'Verify step 2 captures parent/guardian contact, relationship, and residential ward location.',
    dashboard: 'Guest Portal'
  },
  {
    id: 9,
    domain: 'Public & Guest Discovery',
    title: 'Admission Modal Step 3 Submission & Reference Generation',
    description: 'Verify submitting generates unique reference number (INST-2026-XXXX) with instant acceptance feedback.',
    dashboard: 'Guest Portal'
  },
  {
    id: 10,
    domain: 'Public & Guest Discovery',
    title: 'Guest Portal Direct Navigation to Registration & Sign In',
    description: 'Verify direct action links take prospective students/parents to the respective registration flows.',
    dashboard: 'Guest Portal'
  },

  // -------------------------------------------------------------
  // Domain 2: Pre-Cycle & Temporal Gate Constraints (11 - 20)
  // -------------------------------------------------------------
  {
    id: 11,
    domain: 'Temporal Logic & Window Controls',
    title: 'Pre-Cycle State Enforced (Temporal Logic Gate)',
    description: 'Verify when the bursary window is closed, student cannot access open cycle application submissions.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 12,
    domain: 'Temporal Logic & Window Controls',
    title: 'Bursary Allocation Hidden Prior to MCA Committee Approval',
    description: 'Verify student dashboard does NOT display allocated amounts before MCA performs committee allocations.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 13,
    domain: 'Temporal Logic & Window Controls',
    title: 'MCA Cycle Control Settings Configuration',
    description: 'Verify MCA can access cycle opening and closing datetime controls with state selectors.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 14,
    domain: 'Temporal Logic & Window Controls',
    title: 'MCA Cycle Opening Execution & Screen Feedback',
    description: 'Verify submitting cycle opening form updates cycle settings and displays confirmation toast.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 15,
    domain: 'Temporal Logic & Window Controls',
    title: 'Reactive Propagation of Open Window to Student Experience',
    description: 'Verify opening the cycle enables the "Cycle Open" badge and unlocks bursary application submission.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 16,
    domain: 'Temporal Logic & Window Controls',
    title: 'Cycle Year Selector Switcher',
    description: 'Verify MCA can switch between academic cycles (2026/2027, 2025/2026, 2024/2025) seamlessly.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 17,
    domain: 'Temporal Logic & Window Controls',
    title: 'Active Cycle Window Persistence',
    description: 'Verify selected cycle persists across navigation and tab switches.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 18,
    domain: 'Temporal Logic & Window Controls',
    title: 'Pre-Application Zero Applications Count State',
    description: 'Verify application counters show zero or empty state prior to student application inflow.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 19,
    domain: 'Temporal Logic & Window Controls',
    title: 'Window Countdown & Deadline Integrity',
    description: 'Verify cycle closing timestamp accurately marks deadlines for submission acceptance.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 20,
    domain: 'Temporal Logic & Window Controls',
    title: 'Temporal Sequencing Rule Validation',
    description: 'Verify applications only transition through legitimate forward states (Submitted -> Vetted -> Allocated -> Disbursed).',
    dashboard: 'Whole System'
  },

  // -------------------------------------------------------------
  // Domain 3: 1,000 Student Ingestion & Geographic Distribution (21 - 30)
  // -------------------------------------------------------------
  {
    id: 21,
    domain: 'Geographic & Cohort Distribution',
    title: '1,000 Students Complete Cohort Ingestion',
    description: 'Verify exact 1,000 student records are generated and processed into the 2026/2027 cycle.',
    dashboard: 'Whole System'
  },
  {
    id: 22,
    domain: 'Geographic & Cohort Distribution',
    title: 'Location 1: Tendeno Central Allocation Distribution',
    description: 'Verify 90 students correctly mapped to Tendeno Central with appropriate schools and polling station.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 23,
    domain: 'Geographic & Cohort Distribution',
    title: 'Location 2: Tendeno East Allocation Distribution',
    description: 'Verify 80 students correctly mapped to Tendeno East with appropriate schools and polling station.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 24,
    domain: 'Geographic & Cohort Distribution',
    title: 'Location 3: Tendeno West Allocation Distribution',
    description: 'Verify 75 students correctly mapped to Tendeno West with appropriate schools and polling station.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 25,
    domain: 'Geographic & Cohort Distribution',
    title: 'Location 4: Sorget Central Allocation Distribution',
    description: 'Verify 95 students correctly mapped to Sorget Central with appropriate schools and polling station.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 26,
    domain: 'Geographic & Cohort Distribution',
    title: 'Location 5: Sorget Forest Allocation Distribution',
    description: 'Verify 85 students correctly mapped to Sorget Forest with appropriate schools and polling station.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 27,
    domain: 'Geographic & Cohort Distribution',
    title: 'Location 6: Kipchorian Allocation Distribution',
    description: 'Verify 80 students correctly mapped to Kipchorian with appropriate schools and polling station.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 28,
    domain: 'Geographic & Cohort Distribution',
    title: 'Location 7 to 9: Kapkures, Chepsir & Kapsebet Distribution',
    description: 'Verify 90, 85, and 80 students mapped across Kapkures, Chepsir, and Kapsebet respectively.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 29,
    domain: 'Geographic & Cohort Distribution',
    title: 'Location 10 to 12: Kapchelach, Highridge & Spring Valley Distribution',
    description: 'Verify 80 students each mapped across Kapchelach, Highridge, and Spring Valley locations.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 30,
    domain: 'Geographic & Cohort Distribution',
    title: 'Institutional Diversity Across All 4 Education Tiers',
    description: 'Verify 1,000 students span Primary, Secondary, TVET/Vocational, and University institutions.',
    dashboard: 'MCA Dashboard'
  },

  // -------------------------------------------------------------
  // Domain 4: Student Portal Dashboard Actions & Workflow (31 - 40)
  // -------------------------------------------------------------
  {
    id: 31,
    domain: 'Student Dashboard Workflow',
    title: 'Student Identity Hero & Dynamic Greeting',
    description: 'Verify Student Dashboard renders student full name, initials avatar, institution, and time-aware greeting.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 32,
    domain: 'Student Dashboard Workflow',
    title: 'Readiness & Preparedness Progress Ring',
    description: 'Verify readiness percentage ring accurately computes completed steps versus required form steps.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 33,
    domain: 'Student Dashboard Workflow',
    title: 'Registration & Bursary Overview Single Card',
    description: 'Verify single consolidated card presents ranges, checklist, and active application strips.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 34,
    domain: 'Student Dashboard Workflow',
    title: 'Interactive Form Review Navigation Button',
    description: 'Verify clicking "Review forms" / "Finish remaining steps" navigates directly to form wizard.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 35,
    domain: 'Student Dashboard Workflow',
    title: 'Dashboard Refresh Action Button',
    description: 'Verify clicking the RefreshButton re-queries state without throwing runtime errors.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 36,
    domain: 'Student Dashboard Workflow',
    title: 'Multi-Step Bursary Application Wizard Form Navigation',
    description: 'Verify student can traverse wizard sections (Personal, Academic, Household, Financial, Documents).',
    dashboard: 'Student Dashboard'
  },
  {
    id: 37,
    domain: 'Student Dashboard Workflow',
    title: 'Student Document Locker & File Uploads Verification',
    description: 'Verify document upload step handles file selection and displays AI verification badges.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 38,
    domain: 'Student Dashboard Workflow',
    title: 'Student Official Application Submission Action',
    description: 'Verify clicking "Submit Application" successfully records the application in Under Review status.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 39,
    domain: 'Student Dashboard Workflow',
    title: 'Student Applications History Table & Detail Expansion',
    description: 'Verify submitted application appears in table with serial number, institution, and status badge.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 40,
    domain: 'Student Dashboard Workflow',
    title: 'Student Notifications Inbox & Read Management',
    description: 'Verify notifications for submission, status update, and disbursement are delivered and viewable.',
    dashboard: 'Student Dashboard'
  },

  // -------------------------------------------------------------
  // Domain 5: Parent / Household Dashboard Actions & Dependents (41 - 50)
  // -------------------------------------------------------------
  {
    id: 41,
    domain: 'Parent Household Workflow',
    title: 'Parent Identity Hero & Household Greeting',
    description: 'Verify Parent Dashboard displays parent name, initials avatar, and household greeting.',
    dashboard: 'Parent Dashboard'
  },
  {
    id: 42,
    domain: 'Parent Household Workflow',
    title: 'Household KPI Cards (Dependents, Total Fees, Awards)',
    description: 'Verify household summary cards show linked children count, total annual fees, and bursary awarded.',
    dashboard: 'Parent Dashboard'
  },
  {
    id: 43,
    domain: 'Parent Household Workflow',
    title: 'Parent Quick Links Navigation Row',
    description: 'Verify one-click navigation to Applications, Documents, Contact Office, and Add a Child.',
    dashboard: 'Parent Dashboard'
  },
  {
    id: 44,
    domain: 'Parent Household Workflow',
    title: 'Add Child Modal Opening Action',
    description: 'Verify clicking "Add a child" opens the AddChildModal overlay.',
    dashboard: 'Parent Dashboard'
  },
  {
    id: 45,
    domain: 'Parent Household Workflow',
    title: 'Add Child Form Input Validation & Submission',
    description: 'Verify entering child name, admission number, school level, and DOB successfully saves dependent.',
    dashboard: 'Parent Dashboard'
  },
  {
    id: 46,
    domain: 'Parent Household Workflow',
    title: 'Dependent Linked Card Dynamic Rendering',
    description: 'Verify newly added dependent appears on the household board with institutional details.',
    dashboard: 'Parent Dashboard'
  },
  {
    id: 47,
    domain: 'Parent Household Workflow',
    title: 'Parent Household Documents Repository Inspection',
    description: 'Verify parent can inspect family documents (Parent ID, Birth Certs, School Fee Invoices).',
    dashboard: 'Parent Dashboard'
  },
  {
    id: 48,
    domain: 'Parent Household Workflow',
    title: 'Parent Office Messaging Form Action',
    description: 'Verify parent can compose and send messages to MCA Office or Area Chief on behalf of household.',
    dashboard: 'Parent Dashboard'
  },
  {
    id: 49,
    domain: 'Parent Household Workflow',
    title: 'Parent Profile Information Review & Update',
    description: 'Verify parent profile displays contact details and allows information updates.',
    dashboard: 'Parent Dashboard'
  },
  {
    id: 50,
    domain: 'Parent Household Workflow',
    title: 'Household Bursary Disbursement Delivery Tracking',
    description: 'Verify parent dashboard reflects cheque delivery and status updates once disbursed.',
    dashboard: 'Parent Dashboard'
  },

  // -------------------------------------------------------------
  // Domain 6: Help Desk Operational Actions & Quality Desk (51 - 60)
  // -------------------------------------------------------------
  {
    id: 51,
    domain: 'Help Desk Operations',
    title: 'Help Desk Officer Hero & Shift Details',
    description: 'Verify Help Desk renders Operations Lead identity, active shift unit, and officer ID.',
    dashboard: 'Help Desk Dashboard'
  },
  {
    id: 52,
    domain: 'Help Desk Operations',
    title: 'Help Desk Live Analytics Refresh Button Action',
    description: 'Verify clicking top-right refresh button recalculates metrics and fires floating toast notice.',
    dashboard: 'Help Desk Dashboard'
  },
  {
    id: 53,
    domain: 'Help Desk Operations',
    title: 'Toast Notification Dismissal Action',
    description: 'Verify clicking the toast close button (×) immediately dismisses the floating banner.',
    dashboard: 'Help Desk Dashboard'
  },
  {
    id: 54,
    domain: 'Help Desk Operations',
    title: 'Session Hours & Working Shift Modal Launch',
    description: 'Verify clicking "Session Hours" button opens the shift management modal.',
    dashboard: 'Help Desk Dashboard'
  },
  {
    id: 55,
    domain: 'Help Desk Operations',
    title: 'Session Hours Save & State Update',
    description: 'Verify modifying shift hours and clicking Save updates officer schedule with screen feedback.',
    dashboard: 'Help Desk Dashboard'
  },
  {
    id: 56,
    domain: 'Help Desk Operations',
    title: 'Four Interactive Metric Tiles Visual Drilldown Modals',
    description: 'Verify clicking Applications Intake, Form Steps, Messages, or Uploads opens visual drilldown modal.',
    dashboard: 'Help Desk Dashboard'
  },
  {
    id: 57,
    domain: 'Help Desk Operations',
    title: 'Duplicate Email & Identity Conflict Detection Desk',
    description: 'Verify Help Desk institutions desk automatically flags duplicate emails across admissions.',
    dashboard: 'Help Desk Dashboard'
  },
  {
    id: 58,
    domain: 'Help Desk Operations',
    title: 'Invalid Phone Number & Missing Document Flagging',
    description: 'Verify desk detects short phone numbers (<9 digits) or missing certificate attachments.',
    dashboard: 'Help Desk Dashboard'
  },
  {
    id: 59,
    domain: 'Help Desk Operations',
    title: 'Urgent Citizen Hardship Escalation to MCA',
    description: 'Verify Help Desk can forward urgent orphan or critical distress messages directly to MCA desk.',
    dashboard: 'Help Desk Dashboard'
  },
  {
    id: 60,
    domain: 'Help Desk Operations',
    title: 'Vocational & Technical Admission Status Synchronization',
    description: 'Verify Help Desk admission actions synchronize with the public guest portal in real-time.',
    dashboard: 'Help Desk Dashboard'
  },

  // -------------------------------------------------------------
  // Domain 7: Chief Vetting, Endorsements & Security Audit (61 - 70)
  // -------------------------------------------------------------
  {
    id: 61,
    domain: 'Chief Vetting & Jurisdiction',
    title: 'Chief Profile & Ward Administrative Jurisdiction',
    description: 'Verify Chief Dashboard displays Chief name, administrative ward, location, and camp office.',
    dashboard: 'Chief Dashboard'
  },
  {
    id: 62,
    domain: 'Chief Vetting & Jurisdiction',
    title: 'Chief Top Analytics Counter Cards',
    description: 'Verify Chief counters accurately show Total Ward Applications, Approved, Rejected, and Under Review.',
    dashboard: 'Chief Dashboard'
  },
  {
    id: 63,
    domain: 'Chief Vetting & Jurisdiction',
    title: 'Sub-Location & Village Distribution Percentages',
    description: 'Verify Chief dashboard calculates village applicant volume and proportional percentages.',
    dashboard: 'Chief Dashboard'
  },
  {
    id: 64,
    domain: 'Chief Vetting & Jurisdiction',
    title: 'Chief Location Dropdown Filtering Action',
    description: 'Verify filtering by specific location/village isolates applicants strictly within that boundary.',
    dashboard: 'Chief Dashboard'
  },
  {
    id: 65,
    domain: 'Chief Vetting & Jurisdiction',
    title: 'Suspicion Filter Isolation (Suspicious vs Clean)',
    description: 'Verify filtering by "Suspicious Only" isolates applicants with mismatched national ID locations.',
    dashboard: 'Chief Dashboard'
  },
  {
    id: 66,
    domain: 'Chief Vetting & Jurisdiction',
    title: 'Chief Bulk Approval Action for Verified Clean Records',
    description: 'Verify clicking "Approve All Verified Clean Applications" executes bulk approval for legitimate residents.',
    dashboard: 'Chief Dashboard'
  },
  {
    id: 67,
    domain: 'Chief Vetting & Jurisdiction',
    title: 'Chief Individual Application Review Modal Opening',
    description: 'Verify clicking Review opens modal displaying applicant ID, school, fee balance, and ID location.',
    dashboard: 'Chief Dashboard'
  },
  {
    id: 68,
    domain: 'Chief Vetting & Jurisdiction',
    title: 'Chief Official Recommendation Notes & Decision Stamp',
    description: 'Verify Chief can submit review notes and execute "Endorse & Approve" or "Flag & Reject".',
    dashboard: 'Chief Dashboard'
  },
  {
    id: 69,
    domain: 'Chief Vetting & Jurisdiction',
    title: 'Chief Appeals Inspection & Endorsement Desk',
    description: 'Verify Chief can review submitted appeals, inspect grounds, and grant administrative concurrence.',
    dashboard: 'Chief Dashboard'
  },
  {
    id: 70,
    domain: 'Chief Vetting & Jurisdiction',
    title: 'Chief Citizen Messages Inbox & Response Action',
    description: 'Verify Chief receives community inquiries and baraza requests with reply actions.',
    dashboard: 'Chief Dashboard'
  },

  // -------------------------------------------------------------
  // Domain 8: MCA Committee Allocation, Cycle Controls & Analytics (71 - 80)
  // -------------------------------------------------------------
  {
    id: 71,
    domain: 'MCA Executive & Analytics Engine',
    title: 'MCA Executive Hero Overview & Term Summary',
    description: 'Verify Hon. Hillary Bett executive title, ward constituency, and term counter render accurately.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 72,
    domain: 'MCA Executive & Analytics Engine',
    title: 'Ward Executive Metrics (Total Bursary, Active Issues, Devs)',
    description: 'Verify summary cards show Total Bursary (KES), Waiting Issues, Scheduled, and Done Projects.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 73,
    domain: 'MCA Executive & Analytics Engine',
    title: 'Analytics Engine: Bar Graph to Line Graph Toggle Action',
    description: 'Verify clicking Graph Type buttons dynamically toggles between SVG Bar and Line charts.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 74,
    domain: 'MCA Executive & Analytics Engine',
    title: 'Metric Series Toggle Checkboxes (Total, Accepted, Failed)',
    description: 'Verify toggling series checkboxes filters chart lines and bars dynamically.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 75,
    domain: 'MCA Executive & Analytics Engine',
    title: 'Smart Month Drilldown Modal (Weekly Analysis)',
    description: 'Verify clicking a month bar (e.g. Feb) opens Smart Drilldown with Week 1 to 4 breakdown.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 76,
    domain: 'MCA Executive & Analytics Engine',
    title: 'Locations / Villages Strategic Analytics Modal',
    description: 'Verify opening Locations modal renders distribution chart, counts, and amounts per village.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 77,
    domain: 'MCA Executive & Analytics Engine',
    title: 'Polling Stations Distribution Analytics Modal',
    description: 'Verify opening Polling Stations modal displays bursary distribution across all polling centres.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 78,
    domain: 'MCA Executive & Analytics Engine',
    title: 'Age Brackets & Demographics Analytics Modal',
    description: 'Verify opening Age Brackets modal displays demographic breakdown (<15, 15-18, 19-22, 23+).',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 79,
    domain: 'MCA Executive & Analytics Engine',
    title: 'Education Levels Allocation Analytics Modal',
    description: 'Verify opening Education Levels modal displays Primary, Secondary, TVET, and University split.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 80,
    domain: 'MCA Executive & Analytics Engine',
    title: 'MCA Committee Formal Allocation Execution Action',
    description: 'Verify MCA updates Cycle State to "Allocated", saves settings, and assigns bursary amounts.',
    dashboard: 'MCA Dashboard'
  },

  // -------------------------------------------------------------
  // Domain 9: Financial Disbursement, Payment Verification & Appeals (81 - 90)
  // -------------------------------------------------------------
  {
    id: 81,
    domain: 'Disbursement & Post-Allocation',
    title: 'Cycle State Advance to Disbursed Execution Action',
    description: 'Verify MCA advances Cycle State to "disbursed" and saves with screen feedback.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 82,
    domain: 'Disbursement & Post-Allocation',
    title: 'Cycle State Advance to Paid to Account Execution Action',
    description: 'Verify MCA advances Cycle State to "paid to account" representing electronic fund transfer.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 83,
    domain: 'Disbursement & Post-Allocation',
    title: 'Student Dashboard Dynamic Reveal of Confirmed Bursary Amount',
    description: 'Verify that following MCA disbursement, student dashboard reveals confirmed bursary award.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 84,
    domain: 'Disbursement & Post-Allocation',
    title: 'Student Fee Balance Reduction Computation',
    description: 'Verify student fee balance is appropriately reduced by the awarded bursary amount.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 85,
    domain: 'Disbursement & Post-Allocation',
    title: 'Student Bursary Award Status Badge Transition to Disbursed',
    description: 'Verify student status badge transitions from review state to confirmed admitted/disbursed badge.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 86,
    domain: 'Disbursement & Post-Allocation',
    title: 'Student Post-Disbursement Appeal Submission Action',
    description: 'Verify student with outstanding balance can submit an appeal with category, reason, and documents.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 87,
    domain: 'Disbursement & Post-Allocation',
    title: 'Appeal Intake in Chief Desk & Judicial Review',
    description: 'Verify newly filed appeal appears in Chief Appeals list for second-round consideration.',
    dashboard: 'Chief Dashboard'
  },
  {
    id: 88,
    domain: 'Disbursement & Post-Allocation',
    title: 'Student to Office Direct Messaging Verification',
    description: 'Verify student can send direct inquiries to MCA office or Chief with immediate dispatch receipt.',
    dashboard: 'Student Dashboard'
  },
  {
    id: 89,
    domain: 'Disbursement & Post-Allocation',
    title: 'Parent Direct Inquiry Receipt in Ward Administration Desk',
    description: 'Verify messages sent from parent dashboard appear in MCA/Chief inboxes with parent context.',
    dashboard: 'Parent Dashboard'
  },
  {
    id: 90,
    domain: 'Disbursement & Post-Allocation',
    title: 'CSV Data Export Action Verification',
    description: 'Verify MCA can export applications dataset into CSV for audit and bank disbursement schedules.',
    dashboard: 'MCA Dashboard'
  },

  // -------------------------------------------------------------
  // Domain 10: Ward Infrastructure, Audit Trail & Cycle Closure (91 - 100)
  // -------------------------------------------------------------
  {
    id: 91,
    domain: 'Ward Administration & Annual Closure',
    title: 'Citizen Issues Desk Inspection (Waiting, Scheduled, Done)',
    description: 'Verify MCA Issues page lists citizen hardship tickets filtered by status categories.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 92,
    domain: 'Ward Administration & Annual Closure',
    title: 'Issue Inspection Scheduling Modal Action',
    description: 'Verify MCA can schedule site inspection for an issue (Date, Time, Notes) and save.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 93,
    domain: 'Ward Administration & Annual Closure',
    title: 'Issue Completion with Photos & Auto-Conversion to Development',
    description: 'Verify marking issue as Done converts it directly into a commissioned Ward Development Project.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 94,
    domain: 'Ward Administration & Annual Closure',
    title: 'Post Direct Update / Development Modal Launch Action',
    description: 'Verify clicking "Post Direct Update" on MCA dashboard opens project commissioning modal.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 95,
    domain: 'Ward Administration & Annual Closure',
    title: 'Development Project Publishing & Live Feed Verification',
    description: 'Verify entering Title, Village, Category, Cost, and Beneficiaries publishes to development feed.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 96,
    domain: 'Ward Administration & Annual Closure',
    title: 'Forwarded Citizen Hardship Review Action',
    description: 'Verify MCA reviews citizen messages forwarded by Helpdesk and updates status to "Reviewed".',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 97,
    domain: 'Ward Administration & Annual Closure',
    title: 'Vocational Institute Vacancy & Course Capacity Management',
    description: 'Verify MCA can update institute vacancies and adjust curriculum course listings.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 98,
    domain: 'Ward Administration & Annual Closure',
    title: 'Full Year Cohort Reconciliation Across All 12 Locations',
    description: 'Verify total 1,000 students reconciled with zero unassigned or orphaned applications.',
    dashboard: 'Whole System'
  },
  {
    id: 99,
    domain: 'Ward Administration & Annual Closure',
    title: 'Annual Cycle Closure & Archive Enforcement',
    description: 'Verify advancing past closing datetime seals the cycle and protects historical records.',
    dashboard: 'MCA Dashboard'
  },
  {
    id: 100,
    domain: 'Ward Administration & Annual Closure',
    title: 'Full System Integrity & Zero-Failure Audit Verification',
    description: 'Verify that all 100 system checks pass successfully with 100% operational fidelity.',
    dashboard: 'Whole System'
  }
];
