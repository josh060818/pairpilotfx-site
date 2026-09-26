# PairPilotFX analytics contract

This document defines the public-site attribution and event contract for Original Roadmap Phase 6.
Phase 6F keeps this contract vendor-neutral while adding consent-gated Google Analytics 4 delivery for reporting.

## Goals

- keep campaign attribution consistent across social, website, and Substack traffic;
- instrument acquisition CTAs before later funnel work adds more destinations;
- avoid coupling the site to one analytics vendor;
- avoid collecting content that is not needed for funnel measurement.

## UTM contract

PairPilotFX recognizes these inbound parameters:

| Parameter | Purpose | Example |
| --- | --- | --- |
| `utm_source` | originating platform/channel | `instagram` |
| `utm_medium` | traffic class | `social` |
| `utm_campaign` | campaign or content program | `daily_radar` |
| `utm_content` | creative, pair, placement, or variant | `audusd` |
| `utm_term` | optional experiment/detail field | `structure` |

Recommended values are lowercase, short, stable, and machine-friendly.

Examples:

```text
https://pairpilotfx.com/?utm_source=instagram&utm_medium=social&utm_campaign=daily_radar&utm_content=audusd

https://pairpilotfx.com/?utm_source=youtube&utm_medium=social&utm_campaign=weekly_recap&utm_content=short

https://pairpilotfx.com/?utm_source=substack&utm_medium=email&utm_campaign=weekly_brief&utm_content=edition_2026_09_28
```

The browser stores first-touch and current-touch UTM values in `sessionStorage` for the active browser session. PairPilotFX does not use those values to build advertising profiles.

## Outbound attribution

Links marked with `data-analytics-outbound` preserve current inbound attribution when possible.

If a visitor has no inbound UTM values, outbound Weekly Brief/Substack links use:

```text
utm_source=pairpilotfx.com
utm_medium=website
utm_campaign=<link campaign>
utm_content=<placement>
```

The placement is appended to inbound `utm_content` when an inbound value exists so the upstream content and on-site CTA location remain distinguishable.

## Event envelope

Every browser event follows contract version `1.1`:

```json
{
  "contract_version": "1.1",
  "event_name": "weekly_brief_subscribe_click",
  "occurred_at": "ISO-8601 timestamp",
  "session_id": "anonymous session id",
  "page": {
    "path": "/weekly/",
    "title": "Weekly FX Brief — PairPilotFX",
    "referrer_host": "example.com"
  },
  "attribution": {
    "firstTouch": {
      "utm_source": "instagram",
      "utm_medium": "social",
      "utm_campaign": "daily_radar",
      "utm_content": "audusd"
    },
    "currentTouch": {
      "utm_source": "instagram",
      "utm_medium": "social",
      "utm_campaign": "daily_radar",
      "utm_content": "audusd"
    }
  },
  "properties": {
    "placement": "weekly_hero",
    "destination": "pairpilotfx.substack.com/subscribe"
  }
}
```

The site intentionally records the page path rather than the full page URL and records only the referrer hostname rather than the full referrer URL. Sanitized UTM values are also mapped into GA4's `campaign_source`, `campaign_medium`, `campaign_name`, `campaign_content`, and `campaign_term` configuration fields so GA4's built-in acquisition dimensions can report campaign traffic without receiving arbitrary query-string parameters.

For the Trade Preparation Checklist, analytics events do not include the visitor's instrument/scenario label,
preparation notes, or individual checklist answers. Those values are used only for the browser-local tool state.

For Radar early access, analytics events do not include email address, first name, pair selections, or free-text
waitlist answers. The successful `early_access_signup` event records only coarse interaction metadata such as
experience bucket, number of selected markets, and whether optional problem/help fields were provided.

## Event names

Implemented now:

| Event | Trigger |
| --- | --- |
| `page_view` | each page load |
| `weekly_brief_cta_click` | CTA that routes a visitor to the dedicated Weekly Brief acquisition page |
| `weekly_brief_subscribe_click` | outbound subscription CTA from the Weekly Brief page to Substack |
| `weekly_brief_learn_more_click` | Weekly Brief page jump to the content/benefits section |
| `substack_click` | general research/Substack link |
| `radar_cta_click` | CTA that routes a visitor to the dedicated PairPilot Radar product page |
| `methodology_cta_click` | homepage methodology CTA |
| `free_tool_cta_click` | CTA that routes a visitor to a free PairPilotFX tool |
| `tool_open` | Trade Preparation Checklist loaded in the browser |
| `tool_complete` | all checklist conditions transition to Confirmed during the active visit |
| `tool_reset` | visitor resets the locally saved checklist |
| `early_access_cta_click` | CTA that routes a visitor to the Radar early-access waitlist |
| `early_access_view` | Radar early-access waitlist page loaded |
| `early_access_signup` | waitlist provider accepted a Radar early-access submission |
| `early_access_submit_error` | waitlist submission failed before provider acceptance |

Reserved for later Phase 6 increments:

| Event | Intended use |
| --- | --- |
| `waitlist_invite_sent` | selected tester invitation is sent in the future |
| `waitlist_invite_accepted` | selected tester accepts a future private-alpha invitation |

## Delivery

The client always:

1. pushes the PairPilotFX event envelope into `window.dataLayer`;
2. dispatches a browser `pairpilotfx:analytics` custom event.

External collection is consent-gated by default. When a visitor chooses **Allow analytics**:

- GA4 is loaded if `PUBLIC_GA_MEASUREMENT_ID` is configured;
- the PairPilotFX event name is sent directly to GA4 with privacy-safe event parameters;
- the optional `PUBLIC_ANALYTICS_ENDPOINT` receives the same JSON event envelope if it is configured.

When a visitor chooses **Essential only**, the site does not intentionally send the PairPilotFX event stream to
GA4 or the optional collector. Changing a previous Allow choice to Essential only disables further GA4 sends
for the page and performs best-effort cleanup of PairPilotFX GA cookies.

GA4 is configured with Google Signals and ad-personalization signals disabled. PairPilotFX does not use this
instrumentation for personalized advertising or remarketing.

High-cardinality PairPilotFX browser session IDs remain in the browser-local contract and are not intentionally
sent as GA4 event parameters.

## Phase 6F reporting

Phase 6F uses the same GA4 property for `pairpilotfx.com` and PairPilotFX Substack so the acquisition path can
be analyzed across the website handoff and completed newsletter subscription.

The detailed reporting model, recommended key events, custom dimensions, funnel explorations, and operational
checklist are documented in [funnel-reporting.md](funnel-reporting.md).

## Environment variables

```text
PUBLIC_GA_MEASUREMENT_ID=
PUBLIC_ANALYTICS_CONSENT_REQUIRED=true
PUBLIC_ANALYTICS_ENDPOINT=
PUBLIC_ANALYTICS_DEBUG=false
```

`PUBLIC_GA_MEASUREMENT_ID` is the GA4 web-stream Measurement ID in `G-...` format. The GitHub Pages workflow
reads it from the repository Actions variable with the same name.

`PUBLIC_ANALYTICS_CONSENT_REQUIRED=true` is the production privacy default.

`PUBLIC_ANALYTICS_DEBUG=true` logs event/collector state in the browser console and should be used only for
development or deliberate validation.
