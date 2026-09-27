import {
  calculateRiskPosition,
  conversionPrompt,
  requiresManualConversion
} from '../lib/tools/riskCalculation.mjs';

type AnalyticsApi = {
  track?: (eventName: string, properties?: Record<string, string | number | boolean | null>) => void;
};

function analytics(): AnalyticsApi | undefined {
  return (window as Window & { pairpilotfxAnalytics?: AnalyticsApi }).pairpilotfxAnalytics;
}

function initRiskCalculator(): void {
  const form = document.querySelector<HTMLFormElement>('[data-risk-calculator]');
  if (!form) return;

  const balance = form.querySelector<HTMLInputElement>('[name="accountBalance"]');
  const riskPercent = form.querySelector<HTMLInputElement>('[name="riskPercent"]');
  const accountCurrency = form.querySelector<HTMLSelectElement>('[name="accountCurrency"]');
  const instrument = form.querySelector<HTMLSelectElement>('[name="instrumentId"]');
  const entryPrice = form.querySelector<HTMLInputElement>('[name="entryPrice"]');
  const stopPrice = form.querySelector<HTMLInputElement>('[name="stopPrice"]');
  const conversionRate = form.querySelector<HTMLInputElement>('[name="manualConversionRate"]');
  const conversionField = form.querySelector<HTMLElement>('[data-conversion-field]');
  const conversionLabel = form.querySelector<HTMLElement>('[data-conversion-label]');
  const conversionSuffix = form.querySelector<HTMLElement>('[data-conversion-suffix]');
  const conversionHelp = form.querySelector<HTMLElement>('[data-conversion-help]');
  const errorSummary = form.querySelector<HTMLElement>('[data-error-summary]');
  const warningSummary = form.querySelector<HTMLElement>('[data-warning-summary]');
  const resultPanel = document.querySelector<HTMLElement>('[data-risk-result]');
  const reset = form.querySelector<HTMLButtonElement>('[data-risk-reset]');

  if (!balance || !riskPercent || !accountCurrency || !instrument || !entryPrice || !stopPrice || !conversionRate || !conversionField || !errorSummary || !warningSummary || !resultPanel || !reset) {
    return;
  }

  const fieldMap: Record<string, HTMLElement | null> = {
    accountBalance: balance,
    riskPercent,
    accountCurrency,
    instrumentId: instrument,
    entryPrice,
    stopPrice,
    manualConversionRate: conversionRate
  };

  const setText = (selector: string, value: string) => {
    const target = resultPanel.querySelector<HTMLElement>(selector);
    if (target) target.textContent = value;
  };

  const formatNumber = (value: number, maximumFractionDigits = 2) => new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(value);

  const formatMoney = (value: number, currency: string) => new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2
  }).format(value);

  const clearValidation = () => {
    errorSummary.hidden = true;
    errorSummary.innerHTML = '';
    warningSummary.hidden = true;
    warningSummary.innerHTML = '';

    for (const element of Object.values(fieldMap)) {
      element?.removeAttribute('aria-invalid');
    }

    form.querySelectorAll<HTMLElement>('[data-field-error]').forEach((element) => {
      element.textContent = '';
      element.hidden = true;
    });
  };

  const renderConversionField = () => {
    const prompt = conversionPrompt(instrument.value, accountCurrency.value);
    const required = requiresManualConversion(instrument.value, accountCurrency.value);
    conversionField.hidden = !required;
    conversionRate.required = required;

    if (!required || !prompt) {
      conversionRate.value = '';
      return;
    }

    if (conversionLabel) conversionLabel.textContent = prompt.label;
    if (conversionSuffix) conversionSuffix.textContent = prompt.suffix;
    if (conversionHelp) conversionHelp.textContent = prompt.help;
  };

  const showErrors = (errors: Record<string, string>) => {
    const messages = Object.entries(errors);
    errorSummary.hidden = false;
    errorSummary.innerHTML = '<strong>Check the highlighted inputs.</strong><ul>' + messages.map(([, message]) => '<li>' + message + '</li>').join('') + '</ul>';

    for (const [field, message] of messages) {
      fieldMap[field]?.setAttribute('aria-invalid', 'true');
      const inline = form.querySelector<HTMLElement>('[data-field-error="' + field + '"]');
      if (inline) {
        inline.textContent = message;
        inline.hidden = false;
      }
    }

    errorSummary.focus();
  };

  const showWarnings = (warnings: string[]) => {
    if (warnings.length === 0) return;
    warningSummary.hidden = false;
    warningSummary.innerHTML = warnings.map((warning) => '<p>' + warning + '</p>').join('');
  };

  const renderResult = (result: any) => {
    setText('[data-result-risk]', formatMoney(result.riskAmount, result.accountCurrency));
    setText('[data-result-stop]', formatNumber(result.stopDistance, result.instrument.type === 'fx' ? 5 : 2));
    setText('[data-result-lots]', formatNumber(result.standardLots, 4));

    const fxRows = resultPanel.querySelectorAll<HTMLElement>('[data-result-fx]');
    const metalRows = resultPanel.querySelectorAll<HTMLElement>('[data-result-metal]');

    fxRows.forEach((row) => { row.hidden = result.instrument.type !== 'fx'; });
    metalRows.forEach((row) => { row.hidden = result.instrument.type !== 'metal'; });

    if (result.instrument.type === 'fx') {
      setText('[data-result-pips]', formatNumber(result.pipDistance, 1));
      setText('[data-result-units]', formatNumber(result.units, 0));
      setText('[data-result-mini]', formatNumber(result.miniLots, 2));
      setText('[data-result-micro]', formatNumber(result.microLots, 2));
      setText('[data-result-pip-value]', formatMoney(result.pipValuePerStandardLot, result.accountCurrency));
    } else {
      setText('[data-result-ounces]', formatNumber(result.ounces, 2));
      setText('[data-result-contract]', formatNumber(result.contractSize, 0) + ' troy oz / standard lot');
    }

    let conversionText = 'No conversion required because ' + result.accountCurrency + ' is the quote currency.';
    if (result.conversion.source === 'base_currency_at_stop') {
      conversionText = 'Quote-to-account conversion is derived from the stop price because ' + result.accountCurrency + ' is the base currency.';
    } else if (result.conversion.source === 'manual_conversion') {
      conversionText = 'A manual ' + result.instrument.quote + ' → ' + result.accountCurrency + ' conversion rate is included in this calculation.';
    }
    setText('[data-result-conversion]', conversionText);

    resultPanel.hidden = false;
    resultPanel.focus();
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearValidation();

    const result = calculateRiskPosition({
      accountBalance: Number(balance.value),
      riskPercent: Number(riskPercent.value),
      accountCurrency: accountCurrency.value,
      instrumentId: instrument.value,
      entryPrice: Number(entryPrice.value),
      stopPrice: Number(stopPrice.value),
      manualConversionRate: conversionRate.value
    });

    if (!result.ok) {
      resultPanel.hidden = true;
      showErrors(result.errors);
      showWarnings(result.warnings ?? []);
      return;
    }

    showWarnings(result.warnings);
    renderResult(result);

    analytics()?.track?.('tool_complete', {
      tool_id: 'risk_calculator',
      instrument_type: result.instrument.type,
      conversion_mode: result.conversion.source
    });
  });

  reset.addEventListener('click', () => {
    form.reset();
    clearValidation();
    resultPanel.hidden = true;
    renderConversionField();
    analytics()?.track?.('tool_reset', { tool_id: 'risk_calculator' });
    balance.focus();
  });

  instrument.addEventListener('change', renderConversionField);
  accountCurrency.addEventListener('change', renderConversionField);
  renderConversionField();

  const trackOpen = () => analytics()?.track?.('tool_open', { tool_id: 'risk_calculator' });
  if (document.readyState === 'complete') trackOpen();
  else window.addEventListener('load', trackOpen, { once: true });
}

initRiskCalculator();
