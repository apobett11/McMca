# Student Portal System (MVP) — Frontend Architecture

This folder contains the frontend-only MVP for the **Student Portal System**.

## What’s included (frontend only)
- Mobile-first page structure for:
  - Dashboard
  - Applications
  - New Application Wizard (step-based)
  - Document Upload Center
  - Support Center
  - Notifications
  - Appeals
  - Profile & Security
- Shared UI component patterns:
  - Bottom navigation
  - Status language + timeline rendering
  - Offline-friendly copy and loading skeletons (client-side only)
- No backend integration and **no database schema/migrations**.

## Tech stack
- Plain HTML/CSS/JS (low setup friction)
- Each page is route-based (hash routing) so it works as a static site.

## Run
Open `index.html` in a browser.

## Notes
- This MVP prepares for secure auth and protected uploads, but does **not** implement those flows yet.

