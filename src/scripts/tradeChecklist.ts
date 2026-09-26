const STORAGE_KEY = 'ppfx.trade-preparation-checklist.v1';
const TOOL_ID = 'trade_preparation_checklist';

type CheckState = 'confirmed' | 'waiting';
type SavedChecklist = {
  version: 1;
  instrument: string;
  planContext: string;
  responses: Record<string, CheckState>;
};

type AnalyticsApi = {
  track?: (eventName: string, properties?: Record<string, string | number | boolean | null>) => void;
};

function analytics(): AnalyticsApi | undefined {
  return (window as Window & { pairpilotfxAnalytics?: AnalyticsApi }).pairpilotfxAnalytics;
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readSaved(): SavedChecklist | null {
  const storage = safeStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedChecklist;
    if (parsed.version !== 1 || typeof parsed.responses !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSaved(state: SavedChecklist): void {
  try {
    safeStorage()?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Local persistence is a convenience; tool use must not depend on it.
  }
}

function removeSaved(): void {
  try {
    safeStorage()?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function initTradeChecklist(): void {
  const root = document.querySelector<HTMLElement>('[data-trade-checklist]');
  if (!root) return;

  const instrument = root.querySelector<HTMLInputElement>('[data-tool-instrument]');
  const planContext = root.querySelector<HTMLTextAreaElement>('[data-tool-context]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-tool-reset]');
  const statusLabel = root.querySelector<HTMLElement>('[data-tool-status]');
  const statusDetail = root.querySelector<HTMLElement>('[data-tool-status-detail]');
  const reviewedLabel = root.querySelector<HTMLElement>('[data-tool-reviewed]');
  const progress = root.querySelector<HTMLProgressElement>('[data-tool-progress]');
  const saveState = root.querySelector<HTMLElement>('[data-tool-save-state]');
  const groups = Array.from(root.querySelectorAll<HTMLElement>('[data-check-group]'));

  if (!instrument || !planContext || !resetButton || !statusLabel || !statusDetail || !reviewedLabel || !progress) {
    return;
  }

  const itemNames = groups
    .map((group) => group.dataset.checkGroup)
    .filter((value): value is string => Boolean(value));

  let completionTracked = false;
  let saveTimer: number | undefined;
  const saved = readSaved();

  if (saved) {
    instrument.value = saved.instrument ?? '';
    planContext.value = saved.planContext ?? '';

    for (const [name, value] of Object.entries(saved.responses ?? {})) {
      const input = root.querySelector<HTMLInputElement>(
        `input[type="radio"][name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`
      );
      if (input) input.checked = true;
    }
  }

  const getResponses = (): Record<string, CheckState> => {
    const responses: Record<string, CheckState> = {};

    for (const name of itemNames) {
      const checked = root.querySelector<HTMLInputElement>(
        `input[type="radio"][name="${CSS.escape(name)}"]:checked`
      );
      if (checked?.value === 'confirmed' || checked?.value === 'waiting') {
        responses[name] = checked.value;
      }
    }

    return responses;
  };

  const getState = (): SavedChecklist => ({
    version: 1,
    instrument: instrument.value.trim().slice(0, 60),
    planContext: planContext.value.slice(0, 1200),
    responses: getResponses()
  });

  const scheduleSave = () => {
    if (saveTimer) window.clearTimeout(saveTimer);
    if (saveState) saveState.textContent = 'Saving locally…';

    saveTimer = window.setTimeout(() => {
      writeSaved(getState());
      if (saveState) saveState.textContent = 'Saved on this device';
    }, 180);
  };

  const render = () => {
    const responses = getResponses();
    const total = itemNames.length;
    const reviewed = Object.keys(responses).length;
    const waiting = Object.values(responses).filter((value) => value === 'waiting').length;
    const confirmed = Object.values(responses).filter((value) => value === 'confirmed').length;

    reviewedLabel.textContent = `${reviewed} of ${total} reviewed`;
    progress.max = total;
    progress.value = reviewed;

    statusLabel.classList.remove('status-incomplete', 'status-waiting', 'status-complete');

    if (reviewed < total) {
      statusLabel.textContent = 'Incomplete';
      statusLabel.classList.add('status-incomplete');
      statusDetail.textContent = 'Review every preparation check before treating this pass as complete.';
      completionTracked = false;
      return;
    }

    if (waiting > 0) {
      statusLabel.textContent = 'Waiting';
      statusLabel.classList.add('status-waiting');
      statusDetail.textContent = `${waiting} condition${waiting === 1 ? '' : 's'} still marked waiting. This is a preparation status, not a trade signal.`;
      completionTracked = false;
      return;
    }

    statusLabel.textContent = 'Complete';
    statusLabel.classList.add('status-complete');
    statusDetail.textContent = 'Every checklist condition is confirmed. Complete means the preparation review is finished—not that a trade is recommended.';

    if (!completionTracked && confirmed === total) {
      completionTracked = true;
      analytics()?.track?.('tool_complete', {
        tool_id: TOOL_ID,
        reviewed_checks: reviewed,
        total_checks: total
      });
    }
  };

  const handleChange = () => {
    render();
    scheduleSave();
  };

  root.addEventListener('change', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      handleChange();
    }
  });

  root.addEventListener('input', (event) => {
    const target = event.target;
    if (target === instrument || target === planContext) {
      scheduleSave();
    }
  });

  resetButton.addEventListener('click', () => {
    const confirmed = window.confirm('Reset this checklist and remove its locally saved answers?');
    if (!confirmed) return;

    root.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach((input) => {
      input.checked = false;
    });
    instrument.value = '';
    planContext.value = '';
    completionTracked = false;
    removeSaved();
    if (saveState) saveState.textContent = 'No saved checklist';
    render();

    analytics()?.track?.('tool_reset', { tool_id: TOOL_ID });
  });

  render();

  const trackOpen = () => {
    analytics()?.track?.('tool_open', {
      tool_id: TOOL_ID,
      restored_local_state: Boolean(saved)
    });
  };

  if (document.readyState === 'complete') {
    trackOpen();
  } else {
    window.addEventListener('load', trackOpen, { once: true });
  }
}

initTradeChecklist();
