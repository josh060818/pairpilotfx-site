import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateRiskPosition,
  conversionPrompt,
  requiresManualConversion
} from '../src/lib/tools/riskCalculation.mjs';

function closeTo(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, 'Expected ' + actual + ' to be within ' + tolerance + ' of ' + expected);
}

test('sizes AUD/USD when the account currency is the quote currency', () => {
  const result = calculateRiskPosition({
    accountBalance: 10000,
    riskPercent: 1,
    accountCurrency: 'USD',
    instrumentId: 'AUDUSD',
    entryPrice: 0.65,
    stopPrice: 0.645
  });

  assert.equal(result.ok, true);
  closeTo(result.riskAmount, 100);
  closeTo(result.pipDistance, 50);
  closeTo(result.units, 20000);
  closeTo(result.standardLots, 0.2);
  closeTo(result.pipValuePerStandardLot, 10);
});

test('sizes AUD/CAD when the account currency is CAD', () => {
  const result = calculateRiskPosition({
    accountBalance: 20000,
    riskPercent: 0.5,
    accountCurrency: 'CAD',
    instrumentId: 'AUDCAD',
    entryPrice: 0.9,
    stopPrice: 0.895
  });

  assert.equal(result.ok, true);
  closeTo(result.riskAmount, 100);
  closeTo(result.units, 20000);
  closeTo(result.standardLots, 0.2);
});

test('derives quote-to-account conversion at the stop when account currency is the FX base currency', () => {
  const result = calculateRiskPosition({
    accountBalance: 10000,
    riskPercent: 1,
    accountCurrency: 'USD',
    instrumentId: 'USDJPY',
    entryPrice: 150,
    stopPrice: 149
  });

  assert.equal(result.ok, true);
  assert.equal(result.conversion.source, 'base_currency_at_stop');
  closeTo(result.pipDistance, 100);
  closeTo(result.units, 14900);
  closeTo(result.standardLots, 0.149);
  closeTo(result.pipValuePerStandardLot, 1000 / 149);
});

test('requires a deterministic manual conversion when account currency is neither base nor quote', () => {
  assert.equal(requiresManualConversion('AUDCAD', 'USD'), true);
  assert.deepEqual(conversionPrompt('AUDCAD', 'USD'), {
    label: '1 CAD =',
    suffix: 'USD',
    help: 'Enter how many USD one CAD is worth. This rate is used only in your browser.'
  });

  const result = calculateRiskPosition({
    accountBalance: 10000,
    riskPercent: 1,
    accountCurrency: 'USD',
    instrumentId: 'AUDCAD',
    entryPrice: 0.9,
    stopPrice: 0.895,
    manualConversionRate: 0.74
  });

  assert.equal(result.ok, true);
  assert.equal(result.conversion.source, 'manual_conversion');
  closeTo(result.units, 27027.027027027027, 1e-6);
  closeTo(result.standardLots, 0.2702702702702703, 1e-9);
});

test('sizes XAU/USD with the documented 100 oz standard-lot assumption', () => {
  const result = calculateRiskPosition({
    accountBalance: 10000,
    riskPercent: 1,
    accountCurrency: 'USD',
    instrumentId: 'XAUUSD',
    entryPrice: 2600,
    stopPrice: 2595
  });

  assert.equal(result.ok, true);
  closeTo(result.riskAmount, 100);
  closeTo(result.standardLots, 0.2);
  closeTo(result.ounces, 20);
  assert.equal(result.contractSize, 100);
});

test('sizes XAU/USD with a manual USD-to-CAD conversion', () => {
  const result = calculateRiskPosition({
    accountBalance: 10000,
    riskPercent: 1,
    accountCurrency: 'CAD',
    instrumentId: 'XAUUSD',
    entryPrice: 2600,
    stopPrice: 2595,
    manualConversionRate: 1.35
  });

  assert.equal(result.ok, true);
  closeTo(result.standardLots, 0.14814814814814814, 1e-9);
  closeTo(result.ounces, 14.814814814814815, 1e-9);
});

test('rejects zero and negative risk inputs safely', () => {
  for (const riskPercent of [0, -1]) {
    const result = calculateRiskPosition({
      accountBalance: 10000,
      riskPercent,
      accountCurrency: 'USD',
      instrumentId: 'AUDUSD',
      entryPrice: 0.65,
      stopPrice: 0.645
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.riskPercent);
  }
});

test('rejects zero balance, equal entry/stop, malformed prices, and risk over 100%', () => {
  const cases = [
    { accountBalance: 0, riskPercent: 1, entryPrice: 0.65, stopPrice: 0.645, field: 'accountBalance' },
    { accountBalance: 10000, riskPercent: 1, entryPrice: 0.65, stopPrice: 0.65, field: 'stopPrice' },
    { accountBalance: 10000, riskPercent: 1, entryPrice: Number.NaN, stopPrice: 0.645, field: 'entryPrice' },
    { accountBalance: 10000, riskPercent: 101, entryPrice: 0.65, stopPrice: 0.645, field: 'riskPercent' }
  ];

  for (const scenario of cases) {
    const result = calculateRiskPosition({
      accountBalance: scenario.accountBalance,
      riskPercent: scenario.riskPercent,
      accountCurrency: 'USD',
      instrumentId: 'AUDUSD',
      entryPrice: scenario.entryPrice,
      stopPrice: scenario.stopPrice
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors[scenario.field]);
  }
});

test('rejects a missing manual conversion and warns for unusually high but valid risk', () => {
  const missing = calculateRiskPosition({
    accountBalance: 10000,
    riskPercent: 1,
    accountCurrency: 'USD',
    instrumentId: 'AUDCAD',
    entryPrice: 0.9,
    stopPrice: 0.895
  });
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.manualConversionRate);

  const high = calculateRiskPosition({
    accountBalance: 10000,
    riskPercent: 10,
    accountCurrency: 'USD',
    instrumentId: 'AUDUSD',
    entryPrice: 0.65,
    stopPrice: 0.645
  });
  assert.equal(high.ok, true);
  assert.equal(high.warnings.length, 1);
});

test('preserves fractional risk precision without premature rounding', () => {
  const result = calculateRiskPosition({
    accountBalance: 12345.67,
    riskPercent: 0.75,
    accountCurrency: 'USD',
    instrumentId: 'NZDUSD',
    entryPrice: 0.61234,
    stopPrice: 0.60987
  });

  assert.equal(result.ok, true);
  closeTo(result.riskAmount, 92.592525, 1e-9);
  closeTo(result.stopDistance, 0.00247, 1e-12);
  closeTo(result.units, 92.592525 / 0.00247, 1e-6);
});

test('rejects zero or negative manual conversion rates', () => {
  for (const manualConversionRate of [0, -0.5]) {
    const result = calculateRiskPosition({
      accountBalance: 10000,
      riskPercent: 1,
      accountCurrency: 'USD',
      instrumentId: 'AUDCAD',
      entryPrice: 0.9,
      stopPrice: 0.895,
      manualConversionRate
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.manualConversionRate);
  }
});
