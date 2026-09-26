const JOINED_KEY = 'ppfx.radar.waitlist.joined.v1';
const DEFAULT_ENDPOINT = 'https://formsubmit.co/ajax/pairpilotfx@gmail.com';

type Attribution = Partial<Record<'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content' | 'utm_term', string>>;

type AnalyticsApi = {
  track?: (eventName: string, properties?: Record<string, string | number | boolean | null>) => void;
  getAttribution?: () => { firstTouch?: Attribution; currentTouch?: Attribution };
};

type PairPilotWindow = Window & {
  pairpilotfxAnalytics?: AnalyticsApi;
};

function analytics(): AnalyticsApi | undefined {
  return (window as PairPilotWindow).pairpilotfxAnalytics;
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function wasJoinedLocally(): boolean {
  try {
    return storage()?.getItem(JOINED_KEY) === 'true';
  } catch {
    return false;
  }
}

function markJoinedLocally(): void {
  try {
    storage()?.setItem(JOINED_KEY, 'true');
  } catch {
    // Submission success must not depend on browser storage.
  }
}

function waitForAnalytics(callback: (api?: AnalyticsApi) => void): void {
  const existing = analytics();
  if (existing) {
    callback(existing);
    return;
  }

  window.addEventListener('load', () => callback(analytics()), { once: true });
}

function selectedPairs(form: HTMLFormElement): string[] {
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[name="pairs"]:checked'))
    .map((input) => input.value)
    .filter(Boolean)
    .slice(0, 12);
}

function currentAttribution(): Attribution {
  return analytics()?.getAttribution?.()?.currentTouch ?? {};
}

function buildPayload(form: HTMLFormElement): Record<string, string> {
  const data = new FormData(form);
  const attribution = currentAttribution();
  const pairs = selectedPairs(form);

  return {
    _subject: 'PairPilot Radar early access signup',
    _template: 'table',
    _captcha: 'false',
    _honey: String(data.get('_honey') ?? ''),
    email: String(data.get('email') ?? '').trim(),
    first_name: String(data.get('first_name') ?? '').trim(),
    experience: String(data.get('experience') ?? '').trim(),
    pairs: pairs.join(', '),
    scanning_problem: String(data.get('scanning_problem') ?? '').trim(),
    desired_help: String(data.get('desired_help') ?? '').trim(),
    consent: String(data.get('consent') ?? ''),
    utm_source: attribution.utm_source ?? '',
    utm_medium: attribution.utm_medium ?? '',
    utm_campaign: attribution.utm_campaign ?? '',
    utm_content: attribution.utm_content ?? '',
    utm_term: attribution.utm_term ?? '',
    landing_page: window.location.pathname,
    submitted_at: new Date().toISOString()
  };
}

function initEarlyAccess(): void {
  const root = document.querySelector<HTMLElement>('[data-early-access]');
  if (!root) return;

  const form = root.querySelector<HTMLFormElement>('[data-waitlist-form]');
  const submitButton = root.querySelector<HTMLButtonElement>('[data-waitlist-submit]');
  const status = root.querySelector<HTMLElement>('[data-waitlist-status]');
  const success = root.querySelector<HTMLElement>('[data-waitlist-success]');
  const returning = root.querySelector<HTMLElement>('[data-waitlist-returning]');

  if (!form || !submitButton || !status || !success) return;

  const joined = wasJoinedLocally();
  if (joined && returning) {
    returning.hidden = false;
  }

  waitForAnalytics((api) => {
    api?.track?.('early_access_view', {
      product: 'pairpilot_radar',
      joined_local: joined
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const honeypot = form.querySelector<HTMLInputElement>('input[name="_honey"]');
    if (honeypot?.value) {
      form.reset();
      success.hidden = false;
      form.hidden = true;
      return;
    }

    const endpoint = import.meta.env.PUBLIC_WAITLIST_ENDPOINT?.trim() || DEFAULT_ENDPOINT;
    const payload = buildPayload(form);
    const pairCount = selectedPairs(form).length;
    const originalText = submitButton.textContent ?? 'Join Radar Early Access';

    submitButton.disabled = true;
    submitButton.textContent = 'Joining…';
    status.textContent = '';
    status.dataset.state = 'working';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let result: unknown = null;
      try {
        result = await response.json();
      } catch {
        // A 2xx response is sufficient even if the provider changes its JSON envelope.
      }

      const explicitlyFailed =
        typeof result === 'object' &&
        result !== null &&
        'success' in result &&
        (result as { success?: unknown }).success === false;

      if (!response.ok || explicitlyFailed) {
        throw new Error('Waitlist provider rejected the submission.');
      }

      markJoinedLocally();

      analytics()?.track?.('early_access_signup', {
        product: 'pairpilot_radar',
        provider: 'formsubmit',
        experience: payload.experience || 'not_provided',
        pair_count: pairCount,
        has_scanning_problem: Boolean(payload.scanning_problem),
        has_desired_help: Boolean(payload.desired_help)
      });

      form.reset();
      form.hidden = true;
      success.hidden = false;
      status.textContent = '';
      if (returning) returning.hidden = true;
    } catch {
      status.textContent = 'We could not submit the waitlist form right now. Please try again in a moment.';
      status.dataset.state = 'error';

      analytics()?.track?.('early_access_submit_error', {
        product: 'pairpilot_radar',
        provider: 'formsubmit'
      });
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}

initEarlyAccess();
