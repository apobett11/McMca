# Student & Parent Bursary Portal — UI Specification & Futuristic Styling Prompt

This document describes the **full dashboard system** as implemented and intended: a **parent/guardian household layer** (aggregation) and a **per-student operational dashboard** (where applications, uploads, and appeals happen). Use **Part 1** for structure and hierarchy; use **Part 2** as the complete prompt for an AI to apply futuristic styling without breaking usability.

---

# PART 1 — UI STRUCTURE & ELEMENT HIERARCHY

## 0. System overview

| Layer | User | Purpose |
|-------|------|---------|
| **Household dashboard** | Parent / guardian | See all linked children, urgency, read-only aggregates |
| **Student operational dashboard** | Student (or parent acting on their behalf) | Apply, upload documents, appeal, profile — one child, one workflow |
| **Chief portal** (separate) | Area chief | Review applications and appeals — not covered in styling detail here |

**Routes (parent layer, current app):** `#/dashboard` · `#/applications` · `#/documents` · `#/notifications` · `#/profile`

**Routes (student layer, intended when “View profile / View dashboard” is opened):** `#/student/dashboard` · `#/student/applications` · `#/student/documents` · `#/student/new-application` · `#/student/notifications` · `#/student/appeals` · `#/student/support` · `#/student/profile`

---

## 1. Universal shell (every page)

All pages share the same **PageShell** wrapper. Hierarchy top → bottom:

```
Portal (portal--parent | portal--chief)
├── Site Header (sticky)
├── Main content area
│   └── main__content (page-specific children)
├── Site Footer
├── Bottom Navigation (fixed mobile / sidebar desktop)
├── Slide Menu (overlay, opened from header)
└── Notification Modal (overlay, opened from header)
```

### 1.1 Site Header (`Header`)

**Role:** Global orientation, wayfinding, account access, theme, alerts.

**Hierarchy (left → right):**

| Order | Element | Type | Label / content | Behavior |
|-------|---------|------|-----------------|----------|
| 1 | Menu button | `button` | `aria-label="Open navigation menu"` | Opens Slide Menu |
| 2 | Brand block | `Link` → home | Ward mark (letter) + **“MCA”** + portal label (“Parent portal” / “Chief portal”) | Returns to dashboard |
| 3 | Page title | `h1.site-header__page-title` | Current page name (“Dashboard”, “Applications”, …) | Identifies location |
| 4 | Theme toggle | `button` | Cycles **Dark → Light → Neon** | `data-theme` on `<html>` |
| 5 | Notifications | `button` | Bell icon; pulse if unread | Opens Notification Modal |
| 6 | Profile avatar | `Link` → profile | User initials (e.g. “MK”) | Opens profile page |

**Visual zones:** Left cluster (menu + brand) · Center (page title, truncates on narrow screens) · Right cluster (theme, bell, avatar).

**Icons required:** menu (hamburger), theme, bell, profile — consistent 20–22px stroke SVG, labeled for screen readers.

---

### 1.2 Site Footer (`Footer`)

**Role:** Legal, support links, version — never primary workflow.

**Hierarchy:**

```
footer.site-footer
└── site-footer__inner
    ├── nav.site-footer__links (horizontal / wrap)
    │   ├── Support
    │   ├── Privacy Policy
    │   ├── Terms
    │   └── Ward Office Contacts
    └── p.site-footer__version — "Version 1.0.0"
```

**Placement:** Below main content, above bottom nav on mobile; scrolls with content on desktop sidebar layout.

---

### 1.3 Bottom Navigation (`BottomNav`)

**Role:** Primary app navigation — always visible on mobile; becomes **left sidebar** from ~900px+.

**Parent portal tabs (5):**

| # | Label | Route | Icon |
|---|--------|-------|------|
| 1 | Dashboard | `/dashboard` | home |
| 2 | Applications | `/applications` | applications |
| 3 | Documents | `/documents` | documents |
| 4 | Notifications | `/notifications` | bell |
| 5 | Profile | `/profile` | profile |

**Each tab:** Icon (22px) + text label (never icon-only). Active state: `nav-tab--active`.

**Student portal tabs (intended, 5):** Home · Applications · Documents · Support · Profile — with Notifications via header only.

---

### 1.4 Slide Menu (`SlideMenu`)

**Role:** Secondary navigation + logout; duplicates bottom nav with larger touch targets.

**Hierarchy:**

```
backdrop (click to close)
aside.slide-menu
├── slide-menu__header
│   ├── slide-menu__title ("Parent menu")
│   └── close button (×)
└── nav.slide-menu__nav
    ├── NavLink × 5 (same routes as bottom nav, icon + label)
    └── Logout button (icon + "Logout")
```

**Behavior:** Escape closes; body scroll locked when open; closes on route change.

---

### 1.5 Notification Modal (`NotificationModal`)

**Role:** Quick scan of alerts without leaving the page.

**Hierarchy:**

```
modal-root
├── backdrop button
└── modal-panel (dialog)
    ├── header: "Notifications" + close
    └── body: NotificationList (feed items)
```

---

### 1.6 Theme system (`ThemeContext`)

**Three themes** on `<html data-theme="dark|light|neon">`:

| Theme | Mood |
|-------|------|
| **dark** | Default; deep surfaces, high contrast accents |
| **light** | Daylight; soft neutrals, readable outdoors |
| **neon** | Futuristic accent; glowing borders on key UI (use sparingly) |

Styling must look **equally polished** in **dark** and **light**; neon is an optional “energy” mode, not a broken third skin.

---

### 1.7 Shared components (cross-page)

| Component | Use |
|-----------|-----|
| `SectionCard` | Section title (`h1` or `h2`) + body — **candidate to replace with collapsible panels** |
| `Icon` | Unified SVG icon set (stroke, 24 viewBox) |
| `StatusPill` / badges | Status with icon + text (never color-only) |
| `Timeline` | Step progress (completed · current · upcoming) |
| `btn` variants | primary · secondary · accent · ghost · compact |
| `feed-list` / `feed-item` | Notifications and activity rows |
| `TableFilters` + data tables | Parent Applications / Documents pages |
| `skeleton-*` | Loading placeholders |

---

## 2. Parent household dashboard (`/dashboard`)

**Mental model:** “What is happening across my children right now?” — **not** where uploads or applications are edited.

**Layout class:** `main--dashboard` (2-column on desktop: status left, feeds right).

### Hierarchy (top → bottom)

```
1. parent-hero [full width]
   ├── parent-hero__content
   │   ├── parent-hero__greeting — "Good morning, Mary"
   │   ├── parent-hero__title (h1) — "Household overview"
   │   └── parent-hero__sub — explanatory copy
   └── parent-hero__chips (stat row)
       ├── stat-chip stat-chip--blue — Linked students (count)
       ├── stat-chip stat-chip--orange — Need attention (count)
       └── stat-chip stat-chip--green — Approved / disbursed (count)

2. alert-banner [conditional, full width] — if urgent > 0
   ├── Icon bell
   ├── strong + paragraph
   └── Link btn → /documents

3. SectionCard "Linked students" [full width]
   ├── section-card__lead — read-only summary note
   └── button btn--accent "Add child"

4. student-cards-grid [full width]
   └── StudentCard × N (one per linked child)

5. SectionCard "Recent household notifications" [full width]
   ├── feed-list (up to 3 items, student name tag)
   └── Link btn--ghost → /notifications

6. AddChildModal (portal overlay, when open)
```

### StudentCard hierarchy (summary card — reduce visual weight vs operational UI)

```
article.student-card
├── student-card__top
│   ├── avatar (initial, color variant)
│   ├── identity: name (h3), school, meta (level · grade)
│   └── access badge (Full Control / Delegated / Viewer)
├── student-card__stats (4-up grid)
│   Application status badge | Allocated amount | Profile badge | Documents badge
├── student-card__feed
│   ├── latest notification (icon + text)
│   └── latest activity (icon + text)
└── CTA btn--primary "View profile" → opens STUDENT operational dashboard
```

---

## 3. Parent applications page (`/applications`)

**Mental model:** Read-only aggregate table — filter, sort, scan.

```
1. SectionCard "Applications overview" (h1)
   └── lead paragraph

2. SectionCard "Filters" — collapsible candidate
   └── TableFilters (status, level, cycle, attention, …)

3. SectionCard "All applications"
   └── ParentApplicationsTable
       └── rows: student name, school, cycle, status, amount, link to student dashboard
```

---

## 4. Parent documents page (`/documents`)

**Mental model:** Document completeness across household — read-only.

```
1. SectionCard "Documents overview" (h1)
   ├── lead
   └── notice notice--warm (read-only; uploads in student dashboard)

2. SectionCard "Filters" — collapsible candidate
   └── TableFilters (document status, education level, access type, cycle, attention)

3. SectionCard "Document status by student"
   └── ParentDocumentsTable
```

---

## 5. Parent notifications page (`/notifications`)

**Mental model:** Full history, filterable.

```
1. SectionCard "Notifications" (h1)
   └── lead

2. filter-tabs (role=tablist) — All | Urgent | Applications | Documents | Appeals

3. Per group: SectionCard titled by student name or "System alert"
   └── feed-list
       └── feed-item--notify (+ feed-item--urgent if needed)
           ├── icon (by notification type)
           └── type tag, title, body, time
```

---

## 6. Parent profile page (`/profile`)

**Mental model:** Account + linked students management.

```
1. SectionCard "Parent profile" (h1) + lead

2. SectionCard "Parent information"
   └── detail-grid (name, ID, phone, email, verification badge)

3. SectionCard "Dependent students"
   └── linked-students-grid → LinkedStudentCard (variant=dependent)
       └── actions: Reset password, Disable access, Update phone, View dashboard

4. SectionCard "Linked adult students"
   └── LinkedStudentCard (variant=adult, viewer-only note)

5. SectionCard "Delegated access overview"
   └── delegation-summary (3 access-type explanations)

6. SectionCard "Account security"
   └── btn-row: Verify phone, Change password
```

---

## 7. Student operational dashboard (intended — opened from “View profile”)

**Mental model:** “What is happening with **my** application?” — orientation only; one primary status, one next action.

**Shell:** Same PageShell with `portalLabel="Student portal"`, student name in header subtitle, bottom nav: Home · Applications · Documents · Support · Profile.

### Hierarchy (top → bottom)

```
1. page-intro
   ├── greeting — "Good evening, Brian"
   ├── meta — institution name
   └── cycle chip — "2025/2026 Bursary Cycle"

2. status-hero [DOMINANT — full width, highest visual priority]
   ├── status-hero__band (tone: pending | success | info | rejected | neutral)
   │   ├── status-hero__label — "Your current application"
   │   └── StatusPill (large): label + hint + icon
   ├── status-hero__body
   │   ├── status-hero__deadline (icon + date)
   │   ├── action-panel [if action required]
   │   │   ├── title, message, primary CTA → documents
   │   └── Timeline (vertical steps: submitted → verified → review → MCA → funds)

3. quick-grid (2×2 mobile, 4×1 tablet+)
   └── quick-tile × 4: Applications | Upload documents | Support | Appeals

4. Optional: btn secondary "Start new application"

5. Section: Recent alerts (preview, max 3) + ghost link → full notifications

6. Section: Recent activity (transparency log, 3 items)
```

**Status types (always icon + text):** Draft · Submitted · Under Review · Chief Approved · MCA Review · Approved · Rejected · Funds Sent

---

## 8. Student applications page

```
1. page-intro / SectionCard h1 + lead
2. Primary CTA — Start new application
3. List of application rows (year, StatusPill, safe tracking code, View details)
   — prefer **stepper or expandable rows** over many cards
```

---

## 9. Student new application wizard (`/new-application`)

**Mental model:** One workflow — **use step UI, not cards.**

```
1. back-link → applications
2. page-intro + lead
3. wizard-progress (3 segments)
4. wizard-step-label — "Step 1 of 3: …"
5. Single panel (not 3 separate cards):
   Step 1: Student details (name, institution, cycle)
   Step 2: Guardian contact (name, phone)
   Step 3: Review summary (dl) + Submit
6. Previous / Continue buttons
7. field__help — offline tip
```

---

## 10. Student documents page

```
1. page-intro h1
2. Collapsible "What you need" checklist (doc-checklist: missing | received per item)
3. Upload panel (single surface):
   document type select, file input, Upload button, security help text
```

---

## 11. Student notifications page

```
1. back-link
2. page-intro h1
3. Full feed-list (grouped optional) — no bottom nav distraction (showBottomNav=false optional)
```

---

## 12. Student appeals page

```
1. page-intro
2. notice — current decision + deadline (collapsible detail)
3. Form: reason textarea, optional file, Submit
```

---

## 13. Student support page

```
1. page-intro
2. support-topic buttons × 4 (Chief, MCA, Upload help, Deadlines) — list, not cards
3. notice — security (no OTP in chat)
```

**Messages page (optional route `/messages`):** Channel picker → chat window; same shell.

---

## 14. Student profile & security

```
1. SectionCard h1
2. detail-grid — name, institution, hidden student ID, phone
3. Security actions: OTP, Change password, Log out
4. field__help — OTP warning
```

---

# PART 2 — AI STYLING PROMPT (copy from here down)

---

## ROLE

You are a senior product designer and frontend engineer. Restyle the **McMCA Bursary Portal** (parent household layer + student operational layer) with a **futuristic, 2030-grade** visual system. **Do not remove or reorder functional elements** described in Part 1. **Do not sacrifice usability for aesthetics.**

---

## DESIGN NORTH STAR

- Feels like **public infrastructure from the near future**: precise, calm, trustworthy, fast.
- **Teen- and parent-friendly**: modern, confident, not childish, not corporate-1990s.
- **Mobile-first** (360px), **desktop-enhanced** (900px+ sidebar nav, multi-column dashboard).
- **Normal website typography**: body **14px** (0.875rem), secondary **13px**, page titles **18–20px**, avoid oversized hero text.
- **Accessibility**: WCAG AA contrast in **both** primary themes; focus rings; 44px min touch targets; icons always paired with text labels in nav.

---

## THEMES (mandatory — both must look best-in-class)

Implement CSS variables on `[data-theme="light"]` and `[data-theme="dark"]`. Optional `[data-theme="neon"]` may extend dark with accent glow.

### Light theme
- Background: cool off-white with **subtle mesh gradient** (lavender + cyan hints, very low opacity).
- Surfaces: white / frosted glass (`backdrop-filter: blur(12px)`).
- Primary accent: electric violet `#7C3AED` → cyan `#06B6D4` gradient for CTAs.
- Text: `#0F172A` / muted `#64748B`.

### Dark theme
- Background: deep blue-black `#0B0F1A` with soft nebula gradients (not pure #000).
- Surfaces: `#151B2E` with 1px luminous borders `rgba(124, 58, 237, 0.25)`.
- Primary accent: same gradient, slightly brighter; text `#F1F5F9`.

### Shared tokens
- Success: emerald · Warning: amber · Error: rose (muted, not aggressive).
- Radius: 12px default, 16px cards, 999px pills.
- Shadows: **layered colored shadows** (e.g. `0 8px 32px rgba(124, 58, 237, 0.15)`) — not flat gray only.
- Motion: 180–220ms ease; respect `prefers-reduced-motion`.

---

## LAYOUT RULES

1. **Reduce card clutter**
   - Merge related content into **one surface** with internal dividers instead of stacked `SectionCard` boxes.
   - Use **collapsible sections** (`<details>` or accordion) for: Filters, “What you need” checklists, delegation overview, long notification groups.
   - Parent dashboard: hero + chips = **one band**; student cards = primary tiles (max 1 elevated card style).

2. **Prefer steps over cards** where workflow exists
   - Application wizard: horizontal **step indicator** with glowing active step.
   - Student status: **timeline as connected stepper** (horizontal on desktop, vertical on mobile).
   - Application list: expandable rows, not one card per field.

3. **Header**
   - Frosted sticky bar, 1px gradient bottom edge.
   - Hamburger, brand, page title, theme, bell, avatar — unchanged order.
   - Avatar: ring gradient when active.

4. **Footer**
   - Compact, muted links, subtle top border — never competes with bottom nav.

5. **Bottom nav / sidebar**
   - Mobile: fixed bottom, frosted, active tab = **gradient pill** + icon tint.
   - Desktop: left sidebar 200px, icons + labels, same active style.
   - Icons: **single consistent set** — 2px stroke, rounded caps; replace outdated paths with Lucide-equivalent shapes (home, file-text, folder, bell, user, menu, sun/moon, sparkles for theme).

6. **Buttons**
   - Primary: gradient fill + soft glow on hover; active scale 0.98.
   - Secondary: ghost border with hover luminance.
   - Never icon-only for primary actions.

---

## COMPONENT STYLING SPECIFICS

### status-hero (student dashboard)
- Most important element: full-width, **gradient top band** by status tone, inner body on glass surface.
- Deadline row: inset panel with calendar icon.
- action-panel: left border accent (amber), not full yellow box.

### StudentCard / stat-chip
- StudentCard: hover lift 2px, colored left accent if `requiresAttention`.
- stat-chip: compact pill, number large but not hero-sized, label 12px.

### Tables (parent pages)
- Sticky header row, zebra optional, row hover highlight, status badges inline.
- Filters: **collapsed by default** on mobile, expanded on desktop.

### feed-item
- Unread: subtle gradient border + dot indicator.
- Urgent: rose accent edge, not flashing.

### Modals (notifications, add child)
- Center sheet mobile / centered panel desktop; backdrop blur 8px; enter animation slide-up.

### Skeleton loaders
- Shimmer with theme-tinted gradient (violet/cyan), not gray bars only.

---

## ICONS (all pages, header, footer, nav)

- One `Icon` component: 24×24 viewBox, `currentColor`, stroke 2.
- Required names: home, applications, documents, bell, profile, support, upload, appeal, calendar, clock, shield, logout, plus, arrowRight, chevronLeft, chevronRight, info, approved, rejected, funds, menu, theme (sun/moon/sparkles).
- **Responsive:** 20px in header, 22px in nav, 16–18px inline in lists.
- Footer links: optional small external-link icon — do not add icon-only footer.

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Behavior |
|------------|----------|
| &lt; 640px | Single column, bottom nav, collapsibles closed by default |
| 640–899px | Wider padding, quick-grid 4 columns |
| ≥ 900px | Sidebar nav, dashboard 2-column, tables full width, max content ~1080px centered |

---

## DO NOT

- Hide critical status, deadlines, or rejection reasons.
- Use color alone for status (always label + icon).
- Add heavy parallax, spinning logos, or neon everywhere (neon theme is optional accent only).
- Increase font sizes “for mobile” beyond standard web scale.
- Remove footer, header, bottom nav, or slide menu.
- Turn every section into an identical card — **vary hierarchy**: hero > stepper > list > collapsible > table.

---

## DELIVERABLES

1. Rewrite `src/styles.css` with theme variables, component classes, responsive rules, hover/active/focus states.
2. Ensure `ThemeContext` cycles light/dark/(neon) with polished tokens for **light and dark**.
3. Upgrade `Icon.jsx` paths or swap to a modern icon approach (inline SVG still fine).
4. Optionally refactor `SectionCard` usage to collapsible panels where noted — **without changing copy or routes**.
5. Verify all routes: `/dashboard`, `/applications`, `/documents`, `/notifications`, `/profile`, plus student routes when wired.

---

## SUCCESS CRITERIA

- [ ] User understands household/student status in **under 3 seconds** on dashboard.
- [ ] Light and dark themes both feel intentional and premium.
- [ ] Fewer visual boxes than today; more steppers, collapsibles, and lists.
- [ ] Every nav icon has a visible text label.
- [ ] Works on low-end Android (no huge images, CSS-only effects).
- [ ] Hover states on desktop; active states on touch; keyboard focus visible.

---

*End of styling prompt.*
