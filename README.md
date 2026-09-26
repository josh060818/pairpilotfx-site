# PairPilotFX public site

Public acquisition website for **PairPilotFX — Guiding Better Trading Decisions.**

## Product phase

This repository owns the public website for **Original Roadmap Phase 6 — Audience Funnel**.

The private PairPilotFX automation/Radar backend remains a separate system and is not exposed by this site.

## Stack

- Astro 7
- static output
- GitHub Pages
- custom domain: `pairpilotfx.com`
- Node.js 24 for builds

## Current Phase 6A routes

- `/` — public homepage
- `/about/` — PairPilot methodology and Radar overview
- `/privacy/` — Privacy Policy
- `/terms/` — Terms of Service

The Weekly Brief currently routes directly to the existing PairPilotFX Substack. Dedicated `/weekly/`, free-tool, Radar product, analytics, and early-access work belong to later Phase 6 increments.

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Astro writes the static site to `dist/`.

## Deployment

`.github/workflows/deploy-pages.yml` validates pull requests and deploys `dist/` to GitHub Pages after changes reach `main`.

The deployment artifact contains:

- `public/CNAME` → `pairpilotfx.com`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/favicon.svg`

The existing root-level static site files are intentionally retained during the Phase 6A migration so the current branch-based GitHub Pages deployment remains safe until the Actions deployment source is explicitly switched and validated.

## Google / YouTube OAuth URLs

These public URLs must remain operational throughout deployment changes:

```text
https://pairpilotfx.com/
https://pairpilotfx.com/privacy/
https://pairpilotfx.com/terms/
```

Google Auth Platform values:

```text
Application home page:
https://pairpilotfx.com/

Application privacy policy:
https://pairpilotfx.com/privacy/

Application terms of service:
https://pairpilotfx.com/terms/

Authorized domain:
pairpilotfx.com
```

Review Privacy and Terms whenever PairPilotFX changes OAuth scopes, data handling, analytics, public account features, hosting, or business model.
