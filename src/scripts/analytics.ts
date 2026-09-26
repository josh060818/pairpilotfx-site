const CONTRACT_VERSION = '1.0';
const SESSION_KEY = 'ppfx.analytics.session.v1';
const ATTRIBUTION_KEY = 'ppfx.analytics.attribution.v1';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

type UtmKey = typeof UTM_KEYS[number];
type Attribution = Partial<Record<UtmKey, string>>;
type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

interface AttributionState {
  firstTouch: Attribution;
  currentTouch: Attribution;
}

interface AnalyticsEventPayload {
  contract_version: string;
  event_name: string;
  occurred_at: string;
  session_id: string;
  page: {
    path: string;
    title: string;
    referrer_host: string | null;
  };
  attribution: AttributionState;
  properties: Record<string, string | number | boolean | null>;
}

interface PairPilotAnalyticsApi {
  track: (eventName: string, properties?: AnalyticsProperties) => void;
  getAttribution: () => AttributionState;
}

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
  pairpilotfxAnalytics?: PairPilotAnalyticsApi;
};

const analyticsWindow = window as AnalyticsWindow;
const endpoint = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT?.trim() ?? '';
const debug = import.meta.env.PUBLIC_ANALYTICS_DEBUG === 'true';

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function sanitize(value: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\s+/g, '_').slice(0, 120);
  return normalized || undefined;
}

function readIncomingAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const attribution: Attribution = {};

  for (const key of UTM_KEYS) {
    const value = sanitize(params.get(key));
    if (value) attribution[key] = value;
  }

  return attribution;
}

function hasAttribution(value: Attribution): boolean {
  return UTM_KEYS.some((key) => Boolean(value[key]));
}

function readStoredAttribution(): AttributionState | null {
  const store = storage();
  if (!store) return null;

  try {
    const raw = store.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttributionState;
    return {
      firstTouch: parsed.firstTouch ?? {},
      currentTouch: parsed.currentTouch ?? {}
    };
  } catch {
    return null;
  }
}

function initializeAttribution(): AttributionState {
  const store = storage();
  const stored = readStoredAttribution();
  const incoming = readIncomingAttribution();

  const state: AttributionState = {
    firstTouch: stored?.firstTouch && hasAttribution(stored.firstTouch)
      ? stored.firstTouch
      : incoming,
    currentTouch: hasAttribution(incoming)
      ? incoming
      : (stored?.currentTouch ?? {})
  };

  try {
    store?.setItem(ATTRIBUTION_KEY, JSON.stringify(state));
  } catch {
    // Analytics must never interfere with site navigation.
  }

  return state;
}

function getSessionId(): string {
  const store = storage();

  try {
    const existing = store?.getItem(SESSION_KEY);
    if (existing) return existing;

    const generated = typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `ppfx-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

    store?.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return `ppfx-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

function getReferrerHost(): string | null {
  if (!document.referrer) return null;

  try {
    return new URL(document.referrer).hostname || null;
  } catch {
    return null;
  }
}

function cleanProperties(properties: AnalyticsProperties): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value ?? null])
  ) as Record<string, string | number | boolean | null>;
}

function destinationFor(anchor: HTMLAnchorElement): string {
  try {
    const url = new URL(anchor.href, window.location.origin);
    if (url.protocol === 'mailto:') return 'mailto';
    if (url.origin === window.location.origin) return url.pathname;
    return `${url.hostname}${url.pathname}`;
  } catch {
    return 'unknown';
  }
}

function send(payload: AnalyticsEventPayload): void {
  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  analyticsWindow.dataLayer.push({
    event: 'pairpilotfx_event',
    pairpilotfx_event_name: payload.event_name,
    pairpilotfx: payload
  });

  window.dispatchEvent(new CustomEvent('pairpilotfx:analytics', { detail: payload }));

  if (debug) {
    console.debug('[PairPilotFX analytics]', payload);
  }

  if (!endpoint) return;

  void fetch(endpoint, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    keepalive: true,
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8'
    },
    body: JSON.stringify(payload)
  }).catch(() => {
    // Telemetry failures must remain invisible to visitors.
  });
}

export function initAnalytics(): void {
  const attribution = initializeAttribution();
  const sessionId = getSessionId();

  const track = (eventName: string, properties: AnalyticsProperties = {}) => {
    const payload: AnalyticsEventPayload = {
      contract_version: CONTRACT_VERSION,
      event_name: eventName,
      occurred_at: new Date().toISOString(),
      session_id: sessionId,
      page: {
        path: window.location.pathname,
        title: document.title,
        referrer_host: getReferrerHost()
      },
      attribution,
      properties: cleanProperties(properties)
    };

    send(payload);
  };

  analyticsWindow.pairpilotfxAnalytics = {
    track,
    getAttribution: () => attribution
  };

  document.querySelectorAll<HTMLAnchorElement>('a[data-analytics-outbound]').forEach((anchor) => {
    try {
      const url = new URL(anchor.href, window.location.origin);
      const placement = sanitize(anchor.dataset.analyticsPlacement ?? null) ?? 'unknown';
      const campaign = sanitize(anchor.dataset.utmCampaign ?? null) ?? 'weekly_brief';
      const current = attribution.currentTouch;

      url.searchParams.set('utm_source', current.utm_source ?? 'pairpilotfx.com');
      url.searchParams.set('utm_medium', current.utm_medium ?? 'website');
      url.searchParams.set('utm_campaign', current.utm_campaign ?? campaign);

      const content = [current.utm_content, placement].filter(Boolean).join('__');
      url.searchParams.set('utm_content', content || placement);

      if (current.utm_term) {
        url.searchParams.set('utm_term', current.utm_term);
      }

      anchor.href = url.toString();
    } catch {
      // Leave the original destination untouched if URL parsing fails.
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const anchor = target.closest<HTMLAnchorElement>('a[data-analytics-event]');
    if (!anchor) return;

    const eventName = sanitize(anchor.dataset.analyticsEvent ?? null);
    if (!eventName) return;

    track(eventName, {
      placement: sanitize(anchor.dataset.analyticsPlacement ?? null) ?? 'unknown',
      destination: destinationFor(anchor)
    });
  }, { capture: true });

  track('page_view');
}
