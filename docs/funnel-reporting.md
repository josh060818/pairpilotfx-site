# PairPilotFX Phase 6F funnel reporting

Phase 6F uses Google Analytics 4 (GA4) as the external reporting layer while preserving the public site's
versioned PairPilotFX event contract.

The private PairPilotFX automation/Radar backend is not an analytics collector and remains private.

## Architecture

```text
Instagram / Facebook / YouTube / X / TikTok / LinkedIn / Search
                              ↓
                     pairpilotfx.com
                              ↓
              PairPilotFX analytics contract
                              ↓
             visitor analytics choice (consent)
                    ↙                    ↘
          Essential only            Allow analytics
          browser-local only        GA4 web stream
                                         ↓
                             GA4 reports / explorations

Weekly Brief CTA
      ↓
pairpilotfx.substack.com
      ↓
same GA4 property
      ↓
Substack page views + subscription conversions
```

No analytics endpoint is routed through the private PairPilotFX automation service.

## Production configuration

The GitHub Pages workflow reads the repository Actions variable:

```text
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

The same GA4 Measurement ID should also be entered in the PairPilotFX Substack publication under its
Analytics settings. Substack's GA4 integration can then report publication page views and subscription
conversions into the same property.

The site keeps `PUBLIC_ANALYTICS_ENDPOINT` optional. It is not required for Phase 6F and should remain
empty unless PairPilotFX intentionally adds a separate public analytics collector later.

## Consent model

External analytics is opt-in by default:

```text
PUBLIC_ANALYTICS_CONSENT_REQUIRED=true
```

Before a visitor allows analytics:

- PairPilotFX still computes the browser-local event contract;
- events can be inspected through `window.dataLayer` and the `pairpilotfx:analytics` browser event;
- GA4 is not loaded;
- the optional analytics endpoint is not called.

After the visitor chooses **Allow analytics**, GA4 is loaded and PairPilotFX events are sent to that web stream.

The GA4 configuration disables Google Signals and ad-personalization signals. PairPilotFX does not use
Phase 6 analytics for advertising or remarketing.

Visitors can reopen the analytics preference control through **Analytics choices** in the site footer.

## Funnel stages

### Acquisition

Primary dimensions:

- source / medium;
- campaign;
- content;
- landing page;
- new vs returning users.

The Phase 6E social links provide deterministic UTM attribution such as:

```text
utm_source=instagram
utm_medium=social
utm_campaign=daily_radar
utm_content=radar_check
```

### Weekly Brief

Site funnel:

```text
page_view (/weekly/)
    ↓
weekly_brief_subscribe_click
    ↓
Substack
    ↓
completed Substack subscription
```

The click is a PairPilotFX site event. The completed subscription is owned by Substack and becomes measurable
in the same GA4 property only after the same Measurement ID is configured in Substack.

Do not treat `weekly_brief_subscribe_click` as a completed signup.

### Free tool

```text
free_tool_cta_click
    ↓
tool_open
    ↓
tool_complete
```

Useful measures:

- tool opens by acquisition source;
- tool completion rate;
- repeat tool visits;
- Weekly Brief CTA usage after tool interaction.

Checklist scenario labels, preparation notes, and individual answers must never be sent to GA4.

### Radar interest

```text
page_view (/radar/)
    ↓
early_access_cta_click
    ↓
early_access_view
    ↓
early_access_signup
```

Useful measures:

- Radar page views by source/campaign;
- Radar → Early Access click-through rate;
- Early Access form completion rate;
- returning-user behavior around Radar.

Waitlist email addresses, names, selected pairs, and free-text answers must never be sent to GA4.

## GA4 events

PairPilotFX sends the existing event names directly to GA4 when analytics is allowed:

- `page_view`
- `weekly_brief_cta_click`
- `weekly_brief_subscribe_click`
- `weekly_brief_learn_more_click`
- `substack_click`
- `radar_cta_click`
- `methodology_cta_click`
- `free_tool_cta_click`
- `tool_open`
- `tool_complete`
- `tool_reset`
- `early_access_cta_click`
- `early_access_view`
- `early_access_signup`
- `early_access_submit_error`

GA4 receives only privacy-safe event parameters from the PairPilotFX contract. High-cardinality browser session
IDs remain part of the browser-local contract and are not intentionally forwarded as GA4 event parameters.

## Recommended key events

After the GA4 property starts receiving data, mark these as key events:

- `weekly_brief_subscribe_click` — newsletter intent on the PairPilotFX site;
- the Substack-provided completed subscription event once it appears in the GA4 property;
- `tool_complete` — meaningful free-tool engagement;
- `early_access_signup` — Radar early-access conversion.

The Substack completed-signup event name should be taken from the actual GA4 event stream after Substack is
connected. PairPilotFX must not invent or alias a click as a completed subscription.

## Recommended custom dimensions

Create event-scoped custom dimensions only for parameters that need regular reporting:

| Display name | Event parameter |
| --- | --- |
| PairPilot placement | `placement` |
| PairPilot destination | `destination` |
| PairPilot product | `product` |
| PairPilot tool | `tool_id` |
| PairPilot page path | `ppfx_page_path` |

Use GA4's built-in traffic-source dimensions for source, medium, campaign, and ad/content attribution when
possible instead of duplicating them as custom dimensions.

## Core reports

### Acquisition report

Break down users, sessions, and key events by:

- Session source / medium;
- Session campaign;
- Landing page.

This answers which social channels and campaigns actually move people into PairPilotFX-owned surfaces.

### Weekly Brief funnel

Explore:

1. `page_view` where page path is `/weekly/`;
2. `weekly_brief_subscribe_click`;
3. completed Substack signup.

### Tool engagement funnel

Explore:

1. `page_view` where page path is `/tools/trade-preparation-checklist/`;
2. `tool_open`;
3. `tool_complete`.

### Radar / Early Access funnel

Explore:

1. `page_view` where page path is `/radar/`;
2. `early_access_cta_click`;
3. `early_access_view`;
4. `early_access_signup`.

### Return behavior

Use GA4 returning-user and engagement metrics to compare:

- first-time vs returning visitors;
- tool users who return;
- Weekly Brief visitors who return;
- Radar visitors who later submit Early Access.

## Phase 6F operational checklist

Phase 6F is operational when all of the following are true:

- the public site is deployed with a real `G-...` Measurement ID;
- the same GA4 property is connected to PairPilotFX Substack;
- a consented site visit appears in GA4;
- UTM-attributed social traffic appears with the expected source / medium / campaign values;
- site events appear without personal form/checklist contents;
- Substack subscription completion appears in the same property;
- the Weekly Brief, tool, Radar/Early Access, acquisition, and return-behavior reports can be produced;
- the private PairPilotFX backend remains unexposed.
