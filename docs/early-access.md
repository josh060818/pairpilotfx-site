# PairPilot Radar early-access waitlist

Phase 6G adds a public Radar-interest waitlist without exposing the private PairPilotFX automation backend.

## Public route

`/early-access/`

The form requires an email address and makes the following tester-fit fields optional:

- first name;
- trading experience range;
- markets regularly watched;
- current scanning/preparation problem;
- desired Radar help.

Joining the list does not guarantee access. The waitlist is intended to help select a small Phase 7 private-alpha tester group.

## Transport boundary

The static GitHub Pages site cannot persist form submissions itself.

The production client therefore uses a dedicated public form-processing boundary:

```text
pairpilotfx.com/early-access/
        ↓
FormSubmit form endpoint
        ↓
pairpilotfx@gmail.com
```

This boundary is deliberately separate from the private PairPilotFX automation/Radar backend. No Workspace,
scheduler, Telegram, SQLite, health, or administrative API is exposed for waitlist collection.

The client uses `PUBLIC_WAITLIST_ENDPOINT` when configured. If it is empty, the current fallback is:

```text
https://formsubmit.co/ajax/pairpilotfx@gmail.com
```

The HTML form also has a standard non-JavaScript fallback through FormSubmit and redirects successful fallback
submissions to `/early-access/thanks/?submitted=1`.

## Analytics boundary

Implemented events:

- `early_access_cta_click`
- `early_access_view`
- `early_access_signup`
- `early_access_submit_error`

Waitlist analytics do not include email address, first name, selected markets, or free-text answers.

The successful signup event may include only coarse metadata:

- experience bucket;
- number of markets selected;
- whether the optional scanning-problem field was provided;
- whether the optional desired-help field was provided.

## Consent and deletion

The form includes explicit waitlist-contact consent and states that joining does not guarantee access.

Deletion requests are directed to `pairpilotfx@gmail.com`.

## Provider migration

The waitlist form is intentionally isolated behind one client endpoint so the transport can later move to a
dedicated public waitlist API or another provider without changing the Radar acquisition routes or analytics contract.
