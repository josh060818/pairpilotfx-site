# PairPilotFX analytics contract

This document defines the public-site attribution and event contract for Original Roadmap Phase 6.

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

Every browser event follows contract version `1.0`:

```json
{
  "contract_version": "1.0",
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

The site intentionally records the page path rather than the full page URL and records only the referrer hostname rather than the full referrer URL.

For the Trade Preparation Checklist, analytics events do not include the visitor's instrument/scenario label,
preparation notes, or individual checklist answers. Those values are used only for the browser-local tool state.

## Event names

Implemented now:

| Event | Trigger |
| --- | --- |
| `page_view` | each page load |
| `weekly_brief_cta_click` | CTA that routes a visitor to the dedicated Weekly Brief acquisition page |
| `weekly_brief_subscribe_click` | outbound subscription CTA from the Weekly Brief page to Substack |
| `weekly_brief_learn_more_click` | Weekly Brief page jump to the content/benefits section |
| `substack_click` | general research/Substack link |
| `radar_cta_click` | Radar methodology/product-interest link |
| `methodology_cta_click` | homepage methodology CTA |
| `free_tool_cta_click` | CTA that routes a visitor to a free PairPilotFX tool |
| `tool_open` | Trade Preparation Checklist loaded in the browser |
| `tool_complete` | all checklist conditions transition to Confirmed during the active visit |
| `tool_reset` | visitor resets the locally saved checklist |

Reserved for later Phase 6 increments:

| Event | Intended use |
| --- | --- |
| `early_access_cta_click` | Radar early-access CTA |
| `waitlist_signup` | successful waitlist conversion |

## Delivery

The client always:

1. pushes the event into `window.dataLayer`;
2. dispatches a browser `pairpilotfx:analytics` custom event.

If `PUBLIC_ANALYTICS_ENDPOINT` is configured at build time, it also POSTs the JSON event envelope to that collector. With no endpoint configured, the site remains provider-neutral and events stay browser-local/dataLayer-only.

The analytics endpoint is deliberately optional so a later Phase 6 reporting implementation can select the storage/reporting provider without changing the public event contract.

## Environment variables

```text
PUBLIC_ANALYTICS_ENDPOINT=
PUBLIC_ANALYTICS_DEBUG=false
```

`PUBLIC_ANALYTICS_DEBUG=true` logs events in the browser console and should be used only for development/validation.
