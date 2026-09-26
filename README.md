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

## Current Phase 6 routes

- `/` — public homepage
- `/about/` — PairPilot methodology and Radar overview
- `/weekly/` — Weekly FX Brief acquisition page
- `/tools/` — free trader tools landing page
- `/tools/trade-preparation-checklist/` — interactive PairPilot Trade Preparation Checklist
- `/privacy/` — Privacy Policy
- `/terms/` — Terms of Service

Phase 6B routes site-level Weekly Brief CTAs through `/weekly/` before the final Substack subscription handoff. Phase 6C adds the first free trader tool. Dedicated Radar product and early-access work belong to later Phase 6 increments.

## Analytics foundation

The Phase 6 analytics foundation is implemented.

- inbound UTM attribution is captured for the active browser session;
- first-touch and current-touch campaign values are preserved in `sessionStorage`;
- page views and acquisition CTA clicks follow a versioned event contract;
- tracked Substack links preserve inbound attribution and add on-site CTA placement;
- events are pushed to `window.dataLayer` and emitted as `pairpilotfx:analytics` browser events;
- an optional `PUBLIC_ANALYTICS_ENDPOINT` can receive the same event envelope without changing site instrumentation.

The full UTM/event contract is documented in [docs/analytics.md](docs/analytics.md).

No analytics vendor is hard-coded into the public site. This keeps the foundation portable while the later Phase 6 reporting increment selects the collector/storage layer.

## Phase 6B — Weekly Brief acquisition

The Weekly Brief acquisition layer is implemented.

- `/weekly/` explains the Brief's purpose, structure, and decision framework before asking for a subscription;
- homepage, methodology, header, and footer Weekly Brief CTAs route to the owned PairPilotFX landing page instead of jumping directly to Substack;
- final subscription CTAs hand off to the PairPilotFX Substack with preserved campaign attribution;
- the analytics contract separates landing-page interest from outbound subscription intent through `weekly_brief_cta_click` and `weekly_brief_subscribe_click`;
- the existing Substack publication remains the subscription and delivery platform.

## Phase 6C — First free trader tool

The PairPilot Trade Preparation Checklist is implemented.

- `/tools/` establishes a public tools surface that can grow without exposing the private Radar backend;
- `/tools/trade-preparation-checklist/` implements the Context → Strength → Structure → Liquidity → Confirmation → Risk process;
- each preparation item can be marked `Confirmed` or `Waiting`, with an explanation of why it matters;
- the neutral summary states are `Incomplete`, `Waiting`, and `Complete`;
- `Complete` explicitly means the checklist review is complete, not that PairPilotFX recommends BUY or SELL;
- instrument/scenario labels, optional notes, and checklist answers are persisted in browser `localStorage` and are not included in analytics;
- tool acquisition and usage are measurable through `free_tool_cta_click`, `tool_open`, `tool_complete`, and `tool_reset`;
- the tool links naturally back to the Weekly FX Brief as the next owned-audience step.

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
