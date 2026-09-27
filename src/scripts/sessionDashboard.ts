import { getSessionDashboard } from '../lib/tools/marketSessions.mjs';

type AnalyticsApi = {
  track?: (eventName: string, properties?: Record<string, string | number | boolean | null>) => void;
};

function analytics(): AnalyticsApi | undefined {
  return (window as Window & { pairpilotfxAnalytics?: AnalyticsApi }).pairpilotfxAnalytics;
}

function formatCountdown(milliseconds: number | null): string {
  if (milliseconds == null) return 'Unavailable';
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return days + 'd ' + hours + 'h ' + minutes + 'm';
  if (hours > 0) return hours + 'h ' + minutes + 'm';
  return minutes + 'm';
}

function formatTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short'
  }).format(date);
}

function initSessionDashboard(): void {
  const root = document.querySelector<HTMLElement>('[data-session-dashboard]');
  if (!root) return;

  const utcClock = root.querySelector<HTMLElement>('[data-utc-clock]');
  const localClock = root.querySelector<HTMLElement>('[data-local-clock]');
  const localZone = root.querySelector<HTMLElement>('[data-local-zone]');
  const overlap = root.querySelector<HTMLElement>('[data-overlap]');
  const overlapDetail = root.querySelector<HTMLElement>('[data-overlap-detail]');

  const userZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local browser time';
  if (localZone) localZone.textContent = userZone;

  const render = () => {
    const now = new Date();
    const dashboard = getSessionDashboard(now);

    if (utcClock) utcClock.textContent = formatTime(now, 'UTC');
    if (localClock) localClock.textContent = formatTime(now);

    for (const session of dashboard.sessions) {
      const card = root.querySelector<HTMLElement>('[data-session-card="' + session.id + '"]');
      if (!card) continue;

      card.dataset.state = session.state;
      const state = card.querySelector<HTMLElement>('[data-session-state]');
      const marketTime = card.querySelector<HTMLElement>('[data-session-local-time]');
      const transition = card.querySelector<HTMLElement>('[data-session-transition]');

      if (state) state.textContent = session.state === 'open' ? 'OPEN' : 'CLOSED';
      if (marketTime) marketTime.textContent = formatTime(now, session.timeZone);
      if (transition) {
        const verb = session.transitionType === 'closes' ? 'Closes' : 'Opens';
        transition.textContent = verb + ' in ' + formatCountdown(session.millisecondsUntilTransition);
      }
    }

    if (dashboard.overlap.length >= 2) {
      if (overlap) overlap.textContent = dashboard.overlap.join(' + ');
      if (overlapDetail) overlapDetail.textContent = 'These PairPilot reference session windows are currently overlapping.';
    } else {
      if (overlap) overlap.textContent = 'No major overlap active';
      if (overlapDetail) {
        const active = dashboard.activeSessions.map((session) => session.name);
        overlapDetail.textContent = active.length === 1
          ? active[0] + ' is the only reference session currently open.'
          : 'All four PairPilot reference session windows are currently closed.';
      }
    }
  };

  render();
  const timer = window.setInterval(render, 1000);
  window.addEventListener('pagehide', () => window.clearInterval(timer), { once: true });

  const trackOpen = () => analytics()?.track?.('tool_open', { tool_id: 'session_dashboard' });
  if (document.readyState === 'complete') trackOpen();
  else window.addEventListener('load', trackOpen, { once: true });
}

initSessionDashboard();
