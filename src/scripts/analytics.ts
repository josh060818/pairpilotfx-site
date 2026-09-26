const CONTRACT_VERSION = '1.1';
const SESSION_KEY = 'ppfx.analytics.session.v1';
const ATTRIBUTION_KEY = 'ppfx.analytics.attribution.v1';
const CONSENT_KEY = 'ppfx.analytics.consent.v1';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

type UtmKey = typeof UTM_KEYS[number];
type Attribution = Partial<Record<UtmKey, string>>;
type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;
export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';

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
  getConsent: () => AnalyticsConsent;
  setConsent: (consent: Exclude<AnalyticsConsent, 'unknown'>) => void;
  externalCollectionConfigured: () => boolean;
}

type Gtag = (...args: unknown[]) => void;

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown> | IArguments | unknown[]>;
  gtag?: Gtag;
  pairpilotfxAnalytics?: PairPilotAnalyticsApi;
};

const analyticsWindow = window as AnalyticsWindow;
const endpoint = import.meta.env.PUBLIC_ANALYTICS_ENDPOINT?.trim() ?? '';
const measurementId = import.meta.env.PUBLIC_GA_MEASUREMENT_ID?.trim() ?? '';
const debug = import.meta.env.PUBLIC_ANALYTICS_DEBUG === 'true';
const consentRequired = import.meta.env.PUBLIC_ANALYTICS_CONSENT_REQUIRED !== 'false';

let gaStarted = false;
let activeTrack: ((eventName: string, properties?: AnalyticsProperties) => void) | null = null;

function sessionStorageSafe(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function localStorageSafe(): Storage | null {
  try {
    return window.localStorage;
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
  const store = sessionStorageSafe();
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
  const store = sessionStorageSafe();
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
  const store = sessionStorageSafe();

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

function readConsent(): AnalyticsConsent {
  if (!consentRequired) return 'granted';

  try {
    const value = localStorageSafe()?.getItem(CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : 'unknown';
  } catch {
    return 'unknown';
  }
}

function writeConsent(consent: Exclude<AnalyticsConsent, 'unknown'>): void {
  try {
    localStorageSafe()?.setItem(CONSENT_KEY, consent);
  } catch {
    // A blocked storage API leaves the choice session-only.
  }
}

function externalCollectionAllowed(): boolean {
  return readConsent() === 'granted';
}

function setGaDisabled(disabled: boolean): void {
  if (!measurementId) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${measurementId}`] = disabled;
}

function clearGaCookies(): void {
  try {
    const hostname = window.location.hostname;
    const cookieNames = document.cookie
      .split(';')
      .map((entry) => entry.split('=')[0]?.trim())
      .filter((name): name is string => Boolean(name && name.startsWith('_ga')));

    for (const name of cookieNames) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${hostname}; SameSite=Lax`;
      if (hostname.includes('.')) {
        document.cookie = `${name}=; Max-Age=0; path=/; domain=.${hostname}; SameSite=Lax`;
      }
    }
  } catch {
    // Cookie cleanup is best-effort and must not affect site behavior.
  }
}

function gaParams(payload: AnalyticsEventPayload): Record<string, string | number | boolean | null> {
  const current = payload.attribution.currentTouch;
  return {
    ppfx_contract_version: payload.contract_version,
    ppfx_page_path: payload.page.path,
    ppfx_referrer_host: payload.page.referrer_host,
    ppfx_utm_source: current.utm_source ?? null,
    ppfx_utm_medium: current.utm_medium ?? null,
    ppfx_utm_campaign: current.utm_campaign ?? null,
    ppfx_utm_content: current.utm_content ?? null,
    ppfx_utm_term: current.utm_term ?? null,
    ...payload.properties
  };
}

function startGoogleAnalytics(): void {
  if (gaStarted || !measurementId || !externalCollectionAllowed()) return;
  gaStarted = true;
  setGaDisabled(false);

  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  analyticsWindow.gtag = (...args: unknown[]) => {
    analyticsWindow.dataLayer!.push(args);
  };

  analyticsWindow.gtag('js', new Date());
  const referrerHost = getReferrerHost();

  analyticsWindow.gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: `${window.location.origin}${window.location.pathname}`,
    page_referrer: referrerHost ? `https://${referrerHost}/` : ''
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.dataset.pairpilotAnalytics = 'ga4';
  document.head.appendChild(script);
}

function sendToGoogleAnalytics(payload: AnalyticsEventPayload): void {
  if (!measurementId || !externalCollectionAllowed()) return;
  startGoogleAnalytics();
  analyticsWindow.gtag?.('event', payload.event_name, gaParams(payload));
}

function sendToEndpoint(payload: AnalyticsEventPayload): void {
  if (!endpoint || !externalCollectionAllowed()) return;

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

function send(payload: AnalyticsEventPayload): void {
  analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
  analyticsWindow.dataLayer.push({
    event: 'pairpilotfx_event',
    pairpilotfx_event_name: payload.event_name,
    pairpilotfx: payload
  });

  window.dispatchEvent(new CustomEvent('pairpilotfx:analytics', { detail: payload }));

  if (debug) {
    console.debug('[PairPilotFX analytics]', {
      payload,
      consent: readConsent(),
      gaConfigured: Boolean(measurementId),
      endpointConfigured: Boolean(endpoint)
    });
  }

  sendToGoogleAnalytics(payload);
  sendToEndpoint(payload);
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

  activeTrack = track;

  analyticsWindow.pairpilotfxAnalytics = {
    track,
    getAttribution: () => attribution,
    getConsent: readConsent,
    setConsent: (consent) => {
      const previous = readConsent();
      writeConsent(consent);

      if (consent === 'granted') {
        setGaDisabled(false);
        startGoogleAnalytics();

        if (previous !== 'granted') {
          track('page_view', { consent_activation: true });
        }
        return;
      }

      setGaDisabled(true);
      clearGaCookies();
    },
    externalCollectionConfigured: () => Boolean(measurementId || endpoint)
  };

  if (externalCollectionAllowed()) {
    startGoogleAnalytics();
  }

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

export function trackAnalytics(eventName: string, properties: AnalyticsProperties = {}): void {
  activeTrack?.(eventName, properties);
}
