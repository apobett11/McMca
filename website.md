# McMCA Bursary Portal — Full Website Analysis

**Project:** Tendeno/Sorget Bursary Portal (NG-CDF)  
**Stack:** React 18 · Vite · React Router (HashRouter) · Supabase Auth · CSS design system  
**Last documented:** June 2026  

This document describes every dashboard layer, page, UI element, and styling convention in the current codebase.

---

## Table of contents

1. [System overview](#1-system-overview)
2. [Authentication & routing](#2-authentication--routing)
3. [Global design system](#3-global-design-system)
4. [Universal shell (all dashboards)](#4-universal-shell-all-dashboards)
5. [Shared components](#5-shared-components)
6. [Student dashboard](#6-student-dashboard)
7. [Parent dashboard](#7-parent-dashboard)
8. [Chief dashboard](#8-chief-dashboard)
9. [MCA dashboard](#9-mca-dashboard)
10. [Login page](#10-login-page)
11. [Source file map](#11-source-file-map)

---

## 1. System overview

The application is a **multi-role bursary portal** with four independent dashboard experiences. Each role has its own route prefix, layout shell, header, footer, bottom navigation, and slide menu.

| Layer | Role | Purpose | Route prefix | Implementation status |
|-------|------|---------|--------------|----------------------|
| **Student** | Student | Apply, upload documents, track status, appeal, profile | `/student/*` | **Fully built** — Stitch/luxury UI, Supabase data |
| **Parent** | Parent / guardian | Household overview, linked children (intended) | `/parent/*` | **Shell only** — pages are placeholders |
| **Chief** | Area chief | Review applications & appeals | `/chief/*` | **Fully built** — premium gold theme, mock data |
| **MCA** | MCA office | Committee-level oversight (intended) | `/mca/*` | **Shell only** — pages are placeholders |

**Mental model:**
- **Student** = one child, one workflow (operational layer).
- **Parent** = read-only aggregation across linked children (household layer).
- **Chief** = verification and approval workspace for a ward area.
- **MCA** = higher-level committee portal (structure reserved).

---

## 2. Authentication & routing

### Entry flow

```
App.jsx
├── ThemeProvider
├── AuthProvider
└── HashRouter
    ├── /login → LoginPage
    └── /* → ProtectedRoute → RoleBasedRouter
            ├── role=student → StudentRoutes
            ├── role=parent  → ParentRoutes
            ├── role=chief   → ChiefRoutes
            └── role=mca     → MCARoutes
```

### Auth (`AuthContext.jsx`)

- Uses **Supabase** `signInWithPassword` and session persistence.
- Role fetched from `public.user_roles` table (`auth_user_id` → `role`).
- Supported roles: `student`, `parent`, `chief`, `mca`.
- `ProtectedRoute` blocks unauthenticated access; unauthenticated users see `LoginPage`.

### Route tables

#### Student (`StudentRoutes.jsx`)

| Route | Page component |
|-------|----------------|
| `/student/dashboard` | `StudentDashboardPage` |
| `/student/applications` | `StudentApplicationsPage` |
| `/student/documents` | `StudentDocumentsPage` |
| `/student/new-application` | `StudentWizardPage` |
| `/student/notifications` | `StudentNotificationsPage` |
| `/student/appeals` | `StudentAppealsPage` |
| `/student/support` | `StudentSupportPage` |
| `/student/profile` | `StudentProfilePage` |
| `/student/messages` | `StudentMessagesPage` |

#### Parent (`ParentRoutes.jsx`)

| Route | Page component |
|-------|----------------|
| `/parent/dashboard` | `ParentDashboardPage` |
| `/parent/applications` | `ParentApplicationsPage` |
| `/parent/documents` | `ParentDocumentsPage` |
| `/parent/notifications` | `ParentNotificationsPage` |
| `/parent/profile` | `ParentProfilePage` |

#### Chief (`ChiefRoutes.jsx`)

| Route | Page component |
|-------|----------------|
| `/chief/dashboard` | `ChiefDashboardPage` |
| `/chief/applications` | `ChiefApplicationsPage` |
| `/chief/application-review` | `ChiefApplicationReviewPage` |
| `/chief/appeals` | `ChiefAppealsPage` |
| `/chief/appeal-review` | `ChiefAppealReviewPage` |
| `/chief/profile` | `ChiefProfilePage` |

#### MCA (`MCARoutes.jsx`)

| Route | Page component |
|-------|----------------|
| `/mca/dashboard` | `MCADashboardPage` |
| `/mca/applications` | `MCAApplicationsPage` |
| `/mca/documents` | `MCADocumentsPage` |
| `/mca/notifications` | `MCANotificationsPage` |
| `/mca/profile` | `MCAProfilePage` |

---

## 3. Global design system

**Primary stylesheet:** `src/styles.css` (~7,800 lines)  
**Design reference:** Aetheric Portal / Stitch student dashboard design folder  
**Fonts (loaded in `index.html`):**
- **Sora** — headlines
- **Hanken Grotesk** — body
- **JetBrains Mono** — labels, metadata
- **Inter** — fallback
- **Material Symbols Outlined** — optional icon font (reference designs)

### Theme system (`ThemeContext.jsx`)

| Theme | Attribute | Behavior |
|-------|-----------|----------|
| **Dark** | `data-theme="dark"` | Default; deep navy `#0B1120`, blue/indigo accents |
| **Light** | `data-theme="light"` | Cool off-white `#F8FAFC`, readable outdoors |

- Toggle cycles **Dark → Light → Dark** (neon theme removed; saved `neon` migrates to dark).
- Preference stored in `localStorage` key `mcmca-theme`.

### CSS custom properties (tokens)

#### Typography scale

| Token | Size |
|-------|------|
| `--text-xs` | 0.75rem (12px) |
| `--text-sm` | 0.8125rem (~13px) |
| `--text-base` / `--text-md` | 1rem (16px) |
| `--text-lg` | 1.125rem |
| `--text-xl` | 1.5rem |
| `--text-2xl` | 2rem |

#### Spacing & layout

| Token | Value | Use |
|-------|-------|-----|
| `--section-gap` | 2.5rem | Vertical section spacing |
| `--sidebar-w` | 288px | Desktop left nav width |
| `--content-max` | 720px | Default main column |
| `--page-max` | 1440px | Wide dashboard max |
| `--tap` | 48px | Minimum touch target |
| `--radius-sm` | 0.25rem | Small controls |
| `--radius` | 0.5rem | Buttons, inputs |
| `--radius-lg` | 1rem | Cards |
| `--radius-xl` | 1.5rem | Hero cards, panels |

#### Dark theme colors (summary)

| Role | Token | Hex (approx.) |
|------|-------|---------------|
| Background | `--background` | `#0B1120` |
| Surface elevated | `--surface-elevated` | rgba navy glass |
| Primary accent | `--primary-fixed-dim` | `#1D4ED8` (blue) |
| Primary bright | `--primary-fixed` | `#60A5FA` |
| Secondary | `--secondary-container` | `#4F46E5` (indigo) |
| Text primary | `--text` / `--on-surface` | `#E2E8F0` |
| Text secondary | `--text-2` | `#94A3B8` |
| Error | `--error` | `#F87171` |
| Gold accent | `--gold-primary` | `#C9A227` |

#### Light theme colors (summary)

| Role | Token | Hex (approx.) |
|------|-------|---------------|
| Background | `--background` | `#F8FAFC` |
| Primary | `--primary-fixed-dim` | `#1D4ED8` |
| Text | `--on-surface` | `#1E293B` |

#### Effects

| Token | Purpose |
|-------|---------|
| `--page-bg` | Radial mesh gradients (indigo + blue hints) |
| `--glass-border` | Frosted panel borders |
| `--shadow-glow-blue` | Primary hover glow |
| `--shadow-glow-primary` | CTA button glow |
| `--shadow-glow-orange` | Secondary/indigo glow |
| `--gold-shadow` | Gold card elevation |

### Portal modifier classes

Applied on the root layout wrapper:

| Class | Dashboard | Theming |
|-------|-----------|---------|
| `.portal--student` | Student | Blue/indigo + gold luxury cards; wizard/step overrides |
| `.portal--parent` | Parent | Cyan/violet accent vars; parent-hero styles defined |
| `.portal--chief` | Chief | Gold premium theme; extensive dark/light overrides |
| `.portal--mca` | MCA | Class applied in JSX; **no dedicated CSS block yet** |
| `.portal--no-nav` | Any | Hides bottom-nav padding; full-width main on review pages |

### Responsive breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< 640px` | Single column; bottom nav fixed; tables stack as cards |
| `640–899px` | Wider padding; quick grids expand to 4 columns |
| `≥ 900px` | Bottom nav becomes **left sidebar** (288px); dashboard 2-column grid |
| `≥ 1100px` | Dashboard grid ratio `1.15fr / 1fr` |

### Motion & accessibility

- Transition easing: `--ease: 0.22s cubic-bezier(0.4, 0, 0.2, 1)`
- `prefers-reduced-motion: reduce` disables animations
- `:focus-visible` outline on interactive elements
- Icons paired with text labels in navigation (never icon-only tabs)
- Minimum 44–48px touch targets on buttons and nav tabs

---

## 4. Universal shell (all dashboards)

Every dashboard uses a **Layout** component with the same hierarchy:

```
.portal.portal--{role}
├── {Role}Header          (sticky site-header)
├── main.main[.main--dashboard|.main--list]
│   └── .main__content
│       └── {page children}
├── {Role}Footer          (site-footer)
├── {Role}BottomNav       (bottom-nav → sidebar ≥900px)
├── {Role}SlideMenu       (overlay nav + logout)
└── NotificationModal     (shared component)
```

### 4.1 Header (`site-header`)

**Structure (left → right):**

| # | Element | Class | Behavior |
|---|---------|-------|----------|
| 1 | Menu button | `.header-icon-btn.header-icon-btn--hamburger` | Opens slide menu |
| 2 | Page title | `.site-header__page-title` | Current page name (`h1`) |
| 3 | Branding block | `.header-branding` | NG-CDF logo + "Tendeno/Sorget Bursary Portal" |
| 4 | Theme toggle | `.header-icon-btn` | Cycles dark/light |
| 5 | Notifications | `.header-icon-btn` + `.header-icon-btn--pulse` if unread | Opens notification modal |
| 6 | Profile avatar | `.header-avatar` | Link to role profile route; shows initials |

**Styling:**
- Sticky top, 88px min-height
- Frosted glass: `backdrop-filter: blur(20px)`
- Background: semi-transparent `--background`
- Border: `--glass-border`
- Icon buttons: circular, 44px, hover scale + glow

### 4.2 Footer (`site-footer`)

**Structure:**

```
.site-footer
└── .site-footer__inner
    ├── nav.site-footer__links
    │   ├── Support
    │   ├── Privacy Policy
    │   ├── Terms
    │   └── Ward Office Contacts
    └── p.site-footer__version — "Version 1.0.0"
```

**Styling:** Compact, muted links, top border, does not compete with bottom nav.

### 4.3 Bottom navigation (`bottom-nav`)

**Mobile:** Fixed bottom bar, 5 tabs, icon (22px) + label.

**Desktop (≥900px):** Sticky left sidebar, vertical tabs, row layout (icon + label).

| State | Class | Styling |
|-------|-------|---------|
| Default tab | `.nav-tab` | Muted text `--text-3` |
| Active tab | `.nav-tab--active` | Primary color + gradient pill background + glow |
| Role inner | `.bottom-nav__inner--{student\|parent\|chief\|mca}` | Role-specific active colors |

### 4.4 Slide menu (`slide-menu`)

**Structure:**

```
.slide-menu__backdrop
aside.slide-menu.slide-menu--{role}
├── .slide-menu__header
│   ├── .slide-menu__title ("Student menu" / etc.)
│   └── close button (×)
└── nav.slide-menu__nav
    ├── NavLink × 5 (same routes as bottom nav)
    └── Logout button (.slide-menu__link--logout)
```

**Behavior:** Escape closes; body scroll locked; closes on route change; demo logout shows alert.

**Styling:** 288px width, glass background, slide-in from left, active link glow.

### 4.5 Notification modal (`NotificationModal`)

**Structure:**

```
.modal-root
├── .modal-root__backdrop
└── .modal-panel
    ├── header: "Notifications" + close
    └── body: NotificationList (feed items)
```

**Styling:** Backdrop blur 20px; glass panel; slide-up animation on mobile; centered on desktop.

### 4.6 Main content layouts

| Class | Max width | Grid |
|-------|-----------|------|
| `.main` | 720px | Single column |
| `.main--dashboard` | 1280px (inline) | 2-column on desktop |
| `.main--list` | 720px | 2-column card grid on desktop |

**Padding:** `32px 0 64px` on `.main__content`; horizontal `24px` on main.

---

## 5. Shared components

Located in `src/components/` unless noted.

### 5.1 `Icon.jsx`

- Unified SVG icon set, 24×24 viewBox, 2px stroke, `currentColor`.
- Names: `home`, `applications`, `documents`, `support`, `profile`, `bell`, `upload`, `appeal`, `calendar`, `check`, `clock`, `chevronLeft/Right`, `info`, `shield`, `logout`, `plus`, `funds`, `draft`, `review`, `approved`, `rejected`, `submitted`, `arrowRight`.
- Sizes: 20px header, 22px nav, 16–28px inline.

### 5.2 `SectionCard.jsx`

Unified section container used heavily on Chief (and legacy parent) pages.

```
.section-card
├── .section-card__header
│   └── h1|h2.section-card__title
└── .section-card__body
```

**Styling:** Glass elevated surface, `border-radius: var(--radius-xl)`, gradient header band, hover border glow.

### 5.3 `StatusPill.jsx`

Status display with icon + label + hint (never color-only).

```
.status-pill[.status-pill--large]
├── .status-pill__icon.status-pill__icon--{tone}
└── .status-pill__title + .status-pill__hint
```

**Tones:** `pending`, `success`, `info`, `rejected`, `neutral` — configured in `utils/statusConfig.js`.

### 5.4 `Timeline.jsx`

Horizontal step track for application progress.

```
.step-track
├── .step-track__heading
└── ol.step-track__list
    └── .step-track__step
        ├── .step-track__node--{done|current|pending|failed}
        └── .step-track__label
```

### 5.5 Data display components

| Component | Use |
|-----------|-----|
| `TableFilters` | Dropdown filter rows (Chief, Parent intended) |
| `TableSearchSort` | Search input + sort select (Chief) |
| `ChiefApplicationsTable` | Application queue table |
| `ChiefAppealsTable` | Appeals queue table |
| `StudentCard` | Parent household child summary card |
| `LinkedStudentCard` | Parent profile linked student card |
| `AddChildModal` | Parent add-child overlay |
| `ReviewActionModal` | Chief approve/reject/clarify modal |
| `NotificationList` | Feed inside modal |
| `PremiumInfoCard` | Reusable premium card (Chief) |

### 5.6 Form & utility classes

| Class | Purpose |
|-------|---------|
| `.field` | Label + input/select/textarea group |
| `.field__help` | Helper text below field |
| `.btn` | Base button (full width, 48px min-height) |
| `.btn--primary` | Blue fill + glow hover |
| `.btn--secondary` | Ghost bordered |
| `.btn--accent` | Gradient CTA |
| `.btn--ghost` | Text-only link style |
| `.btn--compact` | Inline width auto |
| `.btn--danger` | Rose destructive |
| `.detail-grid` | Key-value definition list |
| `.feed-list` / `.feed-item` | Notification rows |
| `.feed-item--unread` | Gradient border + glow |
| `.feed-item--urgent` | Rose accent edge |
| `.notice` | Info/warning callout box |
| `.skeleton` / `.skeleton-wrap` | Loading shimmer placeholders |
| `.back-link` | Page back navigation |
| `.badge` | Status/access chips |
| `.data-table` | Responsive data tables |
| `.modal-root` / `.modal-panel` | Overlay dialogs |

---

## 6. Student dashboard

**Portal class:** `.portal--student`  
**Layout:** `StudentLayout.jsx`  
**Data:** Supabase via `useSecureData` + `lib/queries.js`  
**Design language:** **Stitch / luxury gold** — classes prefixed `stitch-*`, `dash-*`, `luxury-*`

### 6.1 Navigation tabs

| # | Label | Route | Icon |
|---|-------|-------|------|
| 1 | Home | `/student/dashboard` | home |
| 2 | Applications | `/student/applications` | applications |
| 3 | Documents | `/student/documents` | documents |
| 4 | Contact | `/student/messages` | support |
| 5 | Profile | `/student/profile` | profile |

Notifications accessed via **header bell only** (not in bottom nav).

---

### 6.2 Page: Dashboard (`/student/dashboard`)

**File:** `StudentDashboardPage.jsx`  
**Layout props:** `layout="dashboard"`, `studentName`, `notificationBadge`

#### Element hierarchy

```
.stitch-dashboard
├── 1. Greeting hero (inline-styled section)
│   ├── Avatar circle (initials, gold gradient)
│   ├── h1 greeting — "Good {time}, {name}"
│   ├── Institution subtitle
│   └── Readiness ring
│       ├── Circular progress (%)
│       ├── "Overall Readiness" label
│       └── Readiness description
│
├── 2. .stitch-primary-card.ambient-shadow
│   ├── .stitch-primary-card__glow (decorative)
│   ├── .stitch-primary-card__content
│   │   ├── .stitch-primary-card__badge — "Active Process"
│   │   ├── .stitch-primary-card__title
│   │   └── .stitch-primary-card__btn (CTA link if no application)
│   └── .stitch-primary-card__stepper
│       └── .stitch-stepper
│           └── .stitch-step × 5 (Personal Info → Documents → Reference → Review → Submit)
│               ├── .stitch-step__node (--done | --active | --pending)
│               └── .stitch-step__label
│
├── 3. .dash-suite — "Management Suite"
│   └── .dash-suite__grid
│       ├── .dash-suite__card.luxury-gradient-card → Applications
│       ├── .dash-suite__card.luxury-gradient-card → Documents
│       ├── .dash-suite__card.luxury-gradient-card → Contact (messages)
│       └── .dash-suite__card.luxury-gradient-card → Notifications
│           Each: .dash-suite__icon--{primary|secondary|tertiary|error}
│                   .dash-suite__card-title, .dash-suite__card-desc
│
└── 4. .dash-activity — "Recent Activity"
    └── .dash-activity__card.ambient-shadow.stitch-card
        ├── .dash-activity__head (clock icon + "Timeline")
        └── .dash-activity__list
            └── .dash-activity__item × N
                ├── .dash-activity__item-icon
                ├── .dash-activity__item-body
                │   ├── .dash-activity__item-title
                │   └── .stitch-body-text
                └── .stitch-label.stitch-label--muted (date)
```

#### Styling notes

| Element | Styling |
|---------|---------|
| Greeting hero | Gold gradient background `rgba(212,175,55,…)`, `border-radius: 1.5rem`, champagne shadow |
| Avatar | Gold gradient `#DDBB6A → #E6D3A3`, circular, responsive clamp sizing |
| Readiness ring | 4px gold border, partial arc effect |
| Primary card | Glass + glow overlay; badge uppercase mono; stepper nodes gold/green states |
| Suite cards | `.luxury-gradient-card`: white→lavender gradient, gold border, hover lift |
| Activity card | Frosted stitch-card, row hover highlight |

#### States

- **Loading:** `.skeleton-wrap` with hero + line skeletons
- **Error:** `.notice` with retry button

---

### 6.3 Page: Applications (`/student/applications`)

**File:** `StudentApplicationsPage.jsx`

#### Element hierarchy

```
.stitch-apps-header
├── h1.stitch-apps-header__title — "My Applications"
└── p.stitch-apps-header__sub

.stitch-apps-active (if active application)
├── h2.stitch-apps-active__heading (+ icon)
└── .stitch-apps-active__card
    ├── .stitch-apps-active__card-bg (decorative large icon)
    └── .stitch-apps-active__card-content
        ├── .stitch-apps-active__badge
        ├── .stitch-apps-active__card-title
        ├── .stitch-apps-active__card-id (tracking ID)
        ├── .stitch-apps-progress (progress bar)
        └── .stitch-apps-active__next-step

.stitch-apps-history
├── h2 section title
└── .stitch-apps-table
    └── rows: year, status badge, tracking, action button
        Status: .stitch-status-badge--{admitted|withdrawn|declined|review}

.stitch-apps-support
└── Info cards linking to support/messages
```

#### Styling

- Active card: large gradient card with background watermark icon
- Status badges: color-coded pills (green admitted, red declined, amber review)
- Table: glass rows, hover highlight, compact action buttons

---

### 6.4 Page: Documents (`/student/documents`)

**File:** `StudentDocumentsPage.jsx`

#### Element hierarchy

```
.stitch-docs-header
├── Title + subtitle
└── "Upload" button → opens UploadModal

.stitch-docs-verify
└── Verification progress summary

.stitch-docs-checklist
└── Document items with status (ok / missing)

.stitch-docs-history
└── Previously uploaded files list

UploadModal (.modal-root)
├── Document type select (.field)
├── File input (images/PDF, max 10MB)
└── Submit button
```

#### Styling

- Checklist uses `.doc-checklist__status--ok` (green) / missing (red)
- Modal: standard glass modal panel
- Upload CTA: primary button with upload icon

---

### 6.5 Page: New Application (`/student/new-application`)

**File:** `StudentWizardPage.jsx`

#### Element hierarchy

```
.back-link → /student/applications

.stitch-support-hero (page intro)

.wizard-panel
├── .wizard-progress (3 segments)
├── .wizard-step-label — "Step N of 3: …"
├── Step 1 fields: firstName, lastName, institution, cycle
├── Step 2 fields: guardianName, guardianPhone
├── Step 3: .detail-grid review summary
├── .btn-row: Previous | Continue/Submit
└── .field__help — offline tip
```

#### Styling

- Single panel (not multiple SectionCards) per spec
- Progress bar: gradient fill on active/done segments
- Primary CTA: `.btn.btn--primary` with chevron icons

---

### 6.6 Page: Notifications (`/student/notifications`)

**File:** `StudentNotificationsPage.jsx`  
**Layout:** `showBottomNav={false}`

#### Elements

- `.back-link` → dashboard
- `.stitch-docs-header` (title block)
- `.feed-list` of `.feed-item.feed-item--lively` (+ `--unread`, `--urgent`)
- Empty state: `.notice`

---

### 6.7 Page: Appeals (`/student/appeals`)

**File:** `StudentAppealsPage.jsx`

#### Elements

- `.stitch-support-hero`
- `details.collapsible-panel` — current decision + deadline
- `.upload-panel` — appeal form (textarea + optional file + submit)

---

### 6.8 Page: Support (`/student/support`)

**File:** `StudentSupportPage.jsx`

#### Elements

- `.stitch-support-hero`
- `.stitch-support-grid` of `.stitch-support-card` × 4 (Chief, MCA, Upload, Deadlines)
- `.stitch-faq` accordion
- `.stitch-support-break` — security notice banner

---

### 6.9 Page: Messages / Contact (`/student/messages`)

**File:** `StudentMessagesPage.jsx`

#### Elements

- `.stitch-support-hero`
- `.stitch-support-grid` with contact cards:
  - Chief Office — WhatsApp + email links
  - MCA Office — WhatsApp + email
  - Help Desk — WhatsApp + email
- Inline hover styles on cards

---

### 6.10 Page: Profile (`/student/profile`)

**File:** `StudentProfilePage.jsx`

#### Element hierarchy

```
Gold verification hero (.stitch-profile-verify__*)
├── Avatar + name + verification badges

.stitch-profile-grid
├── .stitch-profile-section — Personal information
│   └── .stitch-profile-form (view/edit toggle)
│       └── .detail-grid rows with VerifyBadge
├── .stitch-profile-section — Account security
│   └── .stitch-profile-security__* buttons
│       (Verify phone OTP, Change password, Log out)
└── .stitch-profile-promo — informational card

Modals: OtpModal, IdUploadModal (.modal-root)
```

#### Styling

- Gold/champagne verification hero matching dashboard greeting
- Verified badge: green uppercase; unverified: red "Verify" button
- Security section: secondary buttons in `.btn-row`

---

## 7. Parent dashboard

**Portal class:** `.portal--parent`  
**Layout:** `ParentLayout.jsx`  
**Status:** **Placeholder pages** — shell and navigation fully wired; content not yet implemented.

### 7.1 Navigation tabs

| # | Label | Route | Icon |
|---|-------|-------|------|
| 1 | Dashboard | `/parent/dashboard` | home |
| 2 | Applications | `/parent/applications` | applications |
| 3 | Documents | `/parent/documents` | documents |
| 4 | Notifications | `/parent/notifications` | bell |
| 5 | Profile | `/parent/profile` | profile |

### 7.2 Pages (intended design from spec)

The following structure is **defined in `STUDENT_DASHBOARD_UI_SPEC_AND_STYLING_PROMPT.md`** and partially styled in CSS (`.parent-hero`, `.student-cards-grid`, etc.) but **not yet rendered** in current parent page components.

#### Dashboard (intended)

```
.parent-hero
├── .parent-hero__greeting
├── .parent-hero__title — "Household overview"
├── .parent-hero__sub
└── .parent-hero__chips
    ├── .stat-chip.stat-chip--blue — Linked students
    ├── .stat-chip.stat-chip--orange — Need attention
    └── .stat-chip.stat-chip--green — Approved/disbursed

.alert-banner (conditional)

SectionCard "Linked students"
└── .student-cards-grid → StudentCard × N

SectionCard "Recent household notifications"
AddChildModal
```

#### StudentCard (shared component — ready)

```
article.student-card[.student-card--attention]
├── .student-card__top (avatar, name, school, access badge)
├── .student-card__stats (application, allocated, profile, documents)
├── .student-card__feed (latest notification + activity)
└── Link.btn.btn--primary → /student/dashboard ("View profile")
```

#### Other parent pages (intended)

- **Applications:** aggregate read-only table + filters
- **Documents:** document completeness table + filters
- **Notifications:** filter tabs + grouped feed
- **Profile:** parent info + LinkedStudentCard grids + delegation summary

### 7.3 Current page content

All five parent pages render only:

```html
<h1>Parent {PageName}</h1>
<p>Welcome / stub text</p>
```

Wrapped in `ParentLayout` with appropriate `pageTitle` and `layout="dashboard"` on dashboard.

### 7.4 Parent styling (CSS ready)

| Class | Description |
|-------|-------------|
| `.portal--parent` | Cyan/violet accent CSS variables |
| `.parent-hero` | Gradient hero band with glass blur |
| `.stat-chip--blue/orange/green` | Compact stat pills |
| `.student-card` | Linked child summary tile |
| `.alert-banner` | Urgent household alert strip |
| `.linked-student-card` | Profile management card |
| `.data-table--parent` | Aggregate tables |

---

## 8. Chief dashboard

**Portal class:** `.portal--chief`  
**Layout:** `ChiefLayout.jsx`  
**Data:** Mock data from `data/chiefMock.js`  
**Design language:** **Premium gold** — classes prefixed `chief-*`, `soft-gold-gradient`, `premium-glow`

### 8.1 Navigation tabs

| # | Label | Route | Icon |
|---|-------|-------|------|
| 1 | Home | `/chief/dashboard` | home |
| 2 | Applications | `/chief/applications` | applications |
| 3 | Appeals | `/chief/appeals` | appeal |
| 4 | Profile | `/chief/profile` | profile |

---

### 8.2 Page: Dashboard (`/chief/dashboard`)

**File:** `ChiefDashboardPage.jsx`

#### Element hierarchy

```
1. .soft-gold-gradient.chief-premium-card.premium-glow
   ├── .chief-premium-card__heading — greeting + chief name
   ├── .chief-premium-card__text — ward status copy
   └── .chief-premium-stats
       ├── .chief-premium-stat (Pending)
       ├── .chief-premium-stat (Appeals)
       └── .chief-premium-stat (Urgent)

2. .chief-quick-actions
   └── .chief-quick-action-btn × 5
       ├── .chief-quick-action-btn__icon-wrap--{gold|tertiary|error|secondary|muted}
       └── .chief-quick-action-btn__label

3. .chief-dashboard-grid
   ├── .chief-stats-section — "Applications Statistics"
   │   └── .chief-stats-grid
   │       └── .chief-stat-card × 6 (Total, Approved, Rejected, Flagged, %)
   └── .chief-stats-section — "Appeals Statistics"
       └── .chief-stat-card × 3

4. .chief-notif-preview
   └── .chief-notif-item × 3 (icon, title, body)
```

#### Styling

| Element | Styling |
|---------|---------|
| Premium card | Soft gold gradient background, glow shadow, large greeting typography |
| Stats | Large numeric values with `--gold`, `--tertiary`, `--error` color modifiers |
| Quick actions | Horizontal scroll/wrap pills with colored icon wraps |
| Stat cards | Glass cards with icon header, metric value, label |

---

### 8.3 Page: Applications (`/chief/applications`)

**File:** `ChiefApplicationsPage.jsx`  
**Layout:** `layout="list"`

#### Elements

```
SectionCard "Applications review" (h1 + lead)

SectionCard "Search & sort"
└── TableSearchSort (search input + sort dropdown)

SectionCard "Filters"
└── TableFilters (status, school, location, etc.)

SectionCard "Applications queue"
└── ChiefApplicationsTable
    Columns: student, school, status, dates, Review button
```

**Table styling:** `.data-table.data-table--chief`, sticky header, row hover, `.btn--table` actions.

---

### 8.4 Page: Application Review (`/chief/application-review`)

**File:** `ChiefApplicationReviewPage.jsx`  
**Layout:** `showBottomNav={false}`

#### Elements

```
SectionCard — workspace intro
SectionCard — Application information (.detail-grid)
SectionCard — Student & guardian details
SectionCard — Documents table (.data-table--chief)
SectionCard — AI extraction results (if present)
SectionCard — Review notes textarea
SectionCard — Action history (.action-history list)
Action bar: .review-actions
├── Approve (.btn--primary)
├── Reject (.btn--danger)
└── Request clarification (.btn--accent)
ReviewActionModal (overlay)
```

---

### 8.5 Page: Appeals (`/chief/appeals`)

**File:** `ChiefAppealsPage.jsx`

Same pattern as Applications: search, sort, filters, `ChiefAppealsTable`.

---

### 8.6 Page: Appeal Review (`/chief/appeal-review`)

**File:** `ChiefAppealReviewPage.jsx`  
**Layout:** `showBottomNav={false}`

Appeal details, supporting documents, original application link, action history, approve/reject/escalate actions + modal.

---

### 8.7 Page: Profile (`/chief/profile`)

**File:** `ChiefProfilePage.jsx`

```
SectionCard "Chief profile"
SectionCard "Personal information" — .detail-grid
SectionCard "Assigned area"
SectionCard "Account security" — .btn-row (verify phone, change password)
```

---

### 8.8 Chief styling summary

| Class prefix | Purpose |
|--------------|---------|
| `.chief-premium-*` | Dashboard hero card |
| `.chief-quick-action-*` | Shortcut buttons |
| `.chief-stats-*` | Metric grids |
| `.chief-stat-card` | Individual KPI tile |
| `.chief-notif-*` | Notification preview list |
| `.soft-gold-gradient` | Gold background gradient |
| `.premium-glow` | Gold shadow elevation |

Chief portal includes **extended dark/light theme overrides** for gold tokens in `styles.css` (~lines 5346+).

---

## 9. MCA dashboard

**Portal class:** `.portal--mca` (applied in JSX; CSS block not yet defined)  
**Layout:** `MCALayout.jsx`  
**Status:** **Placeholder pages** — shell and navigation wired.

### 9.1 Navigation tabs

| # | Label | Route | Icon |
|---|-------|-------|------|
| 1 | Home | `/mca/dashboard` | home |
| 2 | Applications | `/mca/applications` | applications |
| 3 | Documents | `/mca/documents` | documents |
| 4 | Notifications | `/mca/notifications` | bell |
| 5 | Profile | `/mca/profile` | profile |

### 9.2 Pages

All five pages render stub `<h1>` + welcome paragraph inside `MCALayout`.

### 9.3 Intended role

MCA (Member of County Assembly) committee layer for ward-level bursary oversight — structure mirrors parent portal (dashboard, applications, documents, notifications, profile) but scoped to committee workflows.

---

## 10. Login page

**File:** `src/pages/LoginPage.jsx`  
**Route:** `/login`

### Elements

```
Full-viewport centered card (inline styles)
├── h1 "Student Login"
├── Subtitle
├── Error banner (conditional, rose)
└── Form
    ├── Email input
    ├── Password input
    └── Submit button ("Sign In" / "Signing in...")
```

### Behavior

1. Authenticates via Supabase
2. Reads role from `user_roles`
3. Redirects to role dashboard:
   - `student` → `/student/dashboard`
   - `parent` → `/parent/dashboard`
   - `chief` → `/chief/dashboard`
   - `mca` → `/mca/dashboard`

### Styling

Uses CSS variables (`--background`, `--surface-elevated`, `--glass-border`, `--primary-fixed-dim`) with inline fallbacks. Card: 400px max-width, 24px border-radius, 32px padding.

---

## 11. Source file map

```
src/
├── App.jsx                          # Root router + role dispatch
├── main.jsx                         # React entry, imports styles.css
├── styles.css                       # Full design system
├── styles/theme/variables.css       # Additional theme tokens (if used)
├── context/
│   ├── AuthContext.jsx              # Supabase session + role
│   └── ThemeContext.jsx             # Dark/light toggle
├── lib/
│   ├── supabase.js                  # Supabase client
│   ├── queries.js                   # Student data fetchers
│   ├── useSecureData.js             # Data hook with loading/error
│   └── ProtectedRoute.jsx           # Auth guard
├── pages/
│   └── LoginPage.jsx
├── data/
│   ├── studentMock.js               # Legacy demo data
│   ├── parentMock.js                # Parent household mock
│   └── chiefMock.js                 # Chief queue mock
├── components/                      # Shared UI
│   ├── Icon.jsx
│   ├── SectionCard.jsx
│   ├── StatusPill.jsx
│   ├── Timeline.jsx
│   ├── NotificationModal.jsx
│   ├── StudentCard.jsx
│   ├── chief/*                      # Chief tables, modals, search
│   └── student/                     # PageIntro, QuickTile
└── dashboards/
    ├── student/
    │   ├── routes/StudentRoutes.jsx
    │   ├── components/              # StudentLayout, Header, Nav, Menu, Footer
    │   └── pages/                   # 9 student pages
    ├── parent/
    │   ├── routes/ParentRoutes.jsx
    │   ├── components/
    │   └── pages/                   # 5 placeholder pages
    ├── chief/
    │   ├── routes/ChiefRoutes.jsx
    │   ├── components/
    │   └── pages/                   # 6 chief pages
    └── mca/
        ├── routes/MCARoutes.jsx
        ├── components/
        └── pages/                   # 5 placeholder pages
```

---

## Appendix A — Stitch design class reference (Student)

| Class | Purpose |
|-------|---------|
| `.stitch-dashboard` | Page wrapper, typography baseline |
| `.stitch-primary-card` | Dominant status/process card |
| `.stitch-stepper` / `.stitch-step` | Horizontal application steps |
| `.stitch-section-title` | Section headings |
| `.stitch-body-text` | Secondary body copy |
| `.stitch-label` / `.stitch-label--muted` | Metadata labels |
| `.stitch-apps-*` | Applications page blocks |
| `.stitch-docs-*` | Documents page blocks |
| `.stitch-support-*` | Support/messages page blocks |
| `.stitch-profile-*` | Profile page blocks |
| `.stitch-status-badge--*` | Application status pills |
| `.dash-suite*` / `.dash-activity*` | Dashboard quick links + timeline |
| `.luxury-gradient-card` | Gold-tinted gradient tile |
| `.ambient-shadow` | Soft colored elevation |

---

## Appendix B — Implementation maturity matrix

| Feature | Student | Parent | Chief | MCA |
|---------|---------|--------|-------|-----|
| Layout shell | ✅ | ✅ | ✅ | ✅ |
| Bottom nav / sidebar | ✅ | ✅ | ✅ | ✅ |
| Slide menu + logout | ✅ | ✅ | ✅ | ✅ |
| Notification modal | ✅ | ✅ | ✅ | ✅ |
| Page content | ✅ Full | ⚠️ Stub | ✅ Full | ⚠️ Stub |
| Supabase data | ✅ | ❌ | ❌ (mock) | ❌ |
| Dedicated CSS theme | ✅ | ✅ (partial) | ✅ | ❌ |
| Dark/light themes | ✅ | ✅ | ✅ | ✅ |

---

## Appendix C — Dev commands

```bash
npm run dev          # Default dev server → http://localhost:5173/
npm run dev:student  # Port 5175 → #/student/dashboard
npm run dev:parent   # Port 5173 → #/parent/dashboard
npm run dev:chief    # Port 5174 → #/chief/dashboard
npm run build        # Production build to dist/
```

---

*End of website analysis.*
