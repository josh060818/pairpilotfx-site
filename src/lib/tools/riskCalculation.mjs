export const ACCOUNT_CURRENCIES = [
  'USD', 'CAD', 'AUD', 'NZD', 'EUR', 'GBP', 'JPY', 'CHF'
];

export const INSTRUMENTS = [
  { id: 'AUDUSD', label: 'AUD/USD', type: 'fx', base: 'AUD', quote: 'USD', pipSize: 0.0001 },
  { id: 'NZDUSD', label: 'NZD/USD', type: 'fx', base: 'NZD', quote: 'USD', pipSize: 0.0001 },
  { id: 'AUDCAD', label: 'AUD/CAD', type: 'fx', base: 'AUD', quote: 'CAD', pipSize: 0.0001 },
  { id: 'NZDCAD', label: 'NZD/CAD', type: 'fx', base: 'NZD', quote: 'CAD', pipSize: 0.0001 },
  { id: 'EURUSD', label: 'EUR/USD', type: 'fx', base: 'EUR', quote: 'USD', pipSize: 0.0001 },
  { id: 'GBPUSD', label: 'GBP/USD', type: 'fx', base: 'GBP', quote: 'USD', pipSize: 0.0001 },
  { id: 'USDJPY', label: 'USD/JPY', type: 'fx', base: 'USD', quote: 'JPY', pipSize: 0.01 },
  { id: 'USDCAD', label: 'USD/CAD', type: 'fx', base: 'USD', quote: 'CAD', pipSize: 0.0001 },
  { id: 'USDCHF', label: 'USD/CHF', type: 'fx', base: 'USD', quote: 'CHF', pipSize: 0.0001 },
  { id: 'EURGBP', label: 'EUR/GBP', type: 'fx', base: 'EUR', quote: 'GBP', pipSize: 0.0001 },
  { id: 'EURJPY', label: 'EUR/JPY', type: 'fx', base: 'EUR', quote: 'JPY', pipSize: 0.01 },
  { id: 'GBPJPY', label: 'GBP/JPY', type: 'fx', base: 'GBP', quote: 'JPY', pipSize: 0.01 },
  { id: 'XAUUSD', label: 'XAU/USD', type: 'metal', base: 'XAU', quote: 'USD', contractSize: 100 }
];

const INSTRUMENT_MAP = new Map(INSTRUMENTS.map((instrument) => [instrument.id, instrument]));

export function getInstrument(instrumentId) {
  return INSTRUMENT_MAP.get(String(instrumentId ?? '').toUpperCase()) ?? null;
}

export function requiresManualConversion(instrumentId, accountCurrency) {
  const instrument = getInstrument(instrumentId);
  if (!instrument) return false;

  const account = String(accountCurrency ?? '').toUpperCase();
  if (!account) return false;

  if (instrument.type === 'fx') {
    return account !== instrument.quote && account !== instrument.base;
  }

  return account !== instrument.quote;
}

export function conversionPrompt(instrumentId, accountCurrency) {
  const instrument = getInstrument(instrumentId);
  const account = String(accountCurrency ?? '').toUpperCase();
  if (!instrument || !account || !requiresManualConversion(instrumentId, account)) return null;

  return {
    label: '1 ' + instrument.quote + ' =',
    suffix: account,
    help: 'Enter how many ' + account + ' one ' + instrument.quote + ' is worth. This rate is used only in your browser.'
  };
}

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function quoteToAccountRate(instrument, accountCurrency, stopPrice, manualConversionRate) {
  if (accountCurrency === instrument.quote) {
    return { rate: 1, source: 'quote_currency' };
  }

  if (instrument.type === 'fx' && accountCurrency === instrument.base) {
    return { rate: 1 / stopPrice, source: 'base_currency_at_stop' };
  }

  return { rate: manualConversionRate, source: 'manual_conversion' };
}

export function calculateRiskPosition(input) {
  const instrument = getInstrument(input?.instrumentId);
  const accountCurrency = String(input?.accountCurrency ?? '').toUpperCase();
  const balance = Number(input?.accountBalance);
  const riskPercent = Number(input?.riskPercent);
  const entryPrice = Number(input?.entryPrice);
  const stopPrice = Number(input?.stopPrice);
  const manualConversionRate = input?.manualConversionRate === '' || input?.manualConversionRate == null
    ? null
    : Number(input.manualConversionRate);

  const errors = {};
  const warnings = [];

  if (!instrument) errors.instrumentId = 'Choose a supported instrument.';
  if (!ACCOUNT_CURRENCIES.includes(accountCurrency)) errors.accountCurrency = 'Choose a supported account currency.';
  if (!finiteNumber(balance) || balance <= 0) errors.accountBalance = 'Enter an account balance greater than zero.';
  if (!finiteNumber(riskPercent) || riskPercent <= 0) errors.riskPercent = 'Enter a risk percentage greater than zero.';
  else if (riskPercent > 100) errors.riskPercent = 'Risk percentage cannot exceed 100%.';
  if (!finiteNumber(entryPrice) || entryPrice <= 0) errors.entryPrice = 'Enter a valid entry price greater than zero.';
  if (!finiteNumber(stopPrice) || stopPrice <= 0) errors.stopPrice = 'Enter a valid stop-loss price greater than zero.';
  if (finiteNumber(entryPrice) && finiteNumber(stopPrice) && entryPrice === stopPrice) {
    errors.stopPrice = 'Entry and stop-loss price must be different.';
  }

  const manualRequired = instrument ? requiresManualConversion(instrument.id, accountCurrency) : false;
  if (manualRequired && (!finiteNumber(manualConversionRate) || manualConversionRate <= 0)) {
    errors.manualConversionRate = 'Enter a valid quote-to-account conversion rate greater than zero.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, warnings };
  }

  if (riskPercent >= 10) {
    warnings.push('The entered risk percentage is unusually large. Verify the value before using the result.');
  }

  const riskAmount = balance * (riskPercent / 100);
  const stopDistance = Math.abs(entryPrice - stopPrice);
  const conversion = quoteToAccountRate(instrument, accountCurrency, stopPrice, manualConversionRate);

  if (!finiteNumber(conversion.rate) || conversion.rate <= 0) {
    return {
      ok: false,
      errors: { manualConversionRate: 'Unable to determine a valid conversion rate.' },
      warnings
    };
  }

  if (instrument.type === 'fx') {
    const lossPerBaseUnit = stopDistance * conversion.rate;
    const units = riskAmount / lossPerBaseUnit;
    const standardLots = units / 100000;
    const pipDistance = stopDistance / instrument.pipSize;
    const pipValuePerStandardLot = 100000 * instrument.pipSize * conversion.rate;

    return {
      ok: true,
      warnings,
      instrument,
      accountCurrency,
      conversion,
      riskAmount,
      stopDistance,
      pipDistance,
      units,
      standardLots,
      miniLots: standardLots * 10,
      microLots: standardLots * 100,
      pipValuePerStandardLot
    };
  }

  const lossPerStandardLot = stopDistance * instrument.contractSize * conversion.rate;
  const standardLots = riskAmount / lossPerStandardLot;
  const ounces = standardLots * instrument.contractSize;

  return {
    ok: true,
    warnings,
    instrument,
    accountCurrency,
    conversion,
    riskAmount,
    stopDistance,
    standardLots,
    ounces,
    contractSize: instrument.contractSize,
    lossPerStandardLot
  };
}
