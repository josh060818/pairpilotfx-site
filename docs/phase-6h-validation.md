# PairPilotFX Phase 6H end-to-end validation

Phase 6H validates the complete public acquisition path after Phases 6A–6G.

## Funnel under test

```text
social CTA
   ↓
pairpilotfx.com landing route
   ↓
consent + GA4 attribution
   ↓
Weekly Brief / free tool / Radar
   ↓
Substack subscription intent or Radar Early Access
   ↓
conversion event in the same GA4 property
```

The private PairPilotFX automation/Radar backend remains outside the public website boundary.

## Acceptance checks

### Social acquisition

- Phase 6E CTA routing remains deterministic:
  - general daily / structure content → `/tools/`
  - Radar content → `/radar/`
  - Weekly / recap content → `/weekly/`
- social links carry `utm_source`, `utm_medium=social`, `utm_campaign`, and `utm_content`;
- sanitized UTM values are mapped to GA4 campaign fields for built-in acquisition reporting.

### Consent and analytics

- no GA4 collection occurs before a visitor grants analytics;
- pre-choice first-load events are retained only in memory while consent is unknown;
- granting analytics replays those queued events;
- choosing Essential only clears the queue and does not replay it;
- GA4 page views and PairPilotFX events do not include checklist notes, scenario text, waitlist email/name, or free-text answers.

### Weekly Brief / Substack

- `/weekly/` records `weekly_brief_subscribe_click`;
- outbound Substack links preserve acquisition attribution and append CTA placement;
- PairPilotFX Substack uses the same GA4 property;
- a completed Substack subscription must be identified from Substack's actual event stream rather than inferred from the click.

### Free tool

- checklist initializes;
- Incomplete / Waiting / Complete states work;
- local save/restore works;
- `tool_open` and `tool_complete` are externally reportable after consent;
- scenario labels, notes, and individual answers remain browser-local.

### Radar / Early Access

- `/radar/` routes to `/early-access/`;
- `early_access_view` survives first-load consent timing;
- accepted submissions emit `early_access_signup`;
- provider errors emit `early_access_submit_error`;
- personal form contents are not included in analytics events.

## Production evidence already completed

- website GA4 transport returned HTTP 204 for `G-0NSF8EP7K0`;
- GA4 Realtime showed PairPilotFX website page views;
- PairPilotFX Substack emitted a successful GA4 request to the same Measurement ID;
- the Phase 6C checklist was manually validated in production for initialization, persistence, Waiting, and Complete states.

## Remaining live validation

Before Phase 6 can be formally closed, validate in production:

1. one social-style UTM visit appears in GA4 with the expected source / medium / campaign;
2. first-load `tool_open` or `early_access_view` appears after granting consent;
3. one controlled Radar Early Access submission produces `early_access_signup`;
4. one completed Substack subscription event is identified in the same GA4 property;
5. key reporting dimensions/events can be used to reproduce the acquisition, tool, Weekly Brief, and Radar funnels.
