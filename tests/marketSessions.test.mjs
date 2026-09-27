import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SESSION_DEFINITIONS,
  getSessionDashboard,
  getSessionSnapshot,
  zonedDateTimeToUtc
} from '../src/lib/tools/marketSessions.mjs';

function session(id) {
  return SESSION_DEFINITIONS.find((item) => item.id === id);
}

test('converts New York wall time correctly on both sides of DST', () => {
  assert.equal(
    zonedDateTimeToUtc({ year: 2026, month: 3, day: 6, hour: 8 }, 'America/New_York').toISOString(),
    '2026-03-06T13:00:00.000Z'
  );
  assert.equal(
    zonedDateTimeToUtc({ year: 2026, month: 3, day: 9, hour: 8 }, 'America/New_York').toISOString(),
    '2026-03-09T12:00:00.000Z'
  );
});

test('converts London wall time correctly across British Summer Time', () => {
  assert.equal(
    zonedDateTimeToUtc({ year: 2026, month: 3, day: 27, hour: 8 }, 'Europe/London').toISOString(),
    '2026-03-27T08:00:00.000Z'
  );
  assert.equal(
    zonedDateTimeToUtc({ year: 2026, month: 3, day: 30, hour: 8 }, 'Europe/London').toISOString(),
    '2026-03-30T07:00:00.000Z'
  );
});

test('converts Sydney wall time correctly across Australian DST', () => {
  assert.equal(
    zonedDateTimeToUtc({ year: 2026, month: 4, day: 3, hour: 8 }, 'Australia/Sydney').toISOString(),
    '2026-04-02T21:00:00.000Z'
  );
  assert.equal(
    zonedDateTimeToUtc({ year: 2026, month: 4, day: 6, hour: 8 }, 'Australia/Sydney').toISOString(),
    '2026-04-05T22:00:00.000Z'
  );
});

test('identifies the London/New York overlap in winter', () => {
  const dashboard = getSessionDashboard(new Date('2026-01-15T14:00:00.000Z'));
  assert.deepEqual(dashboard.overlap, ['London', 'New York']);
});

test('identifies the London/New York overlap in summer despite shifted UTC offsets', () => {
  const dashboard = getSessionDashboard(new Date('2026-07-15T13:00:00.000Z'));
  assert.deepEqual(dashboard.overlap, ['London', 'New York']);
});

test('keeps sessions closed on their local weekend and points to a future opening', () => {
  const now = new Date('2026-09-26T16:00:00.000Z');
  const dashboard = getSessionDashboard(now);
  assert.equal(dashboard.activeSessions.length, 0);
  for (const item of dashboard.sessions) {
    assert.equal(item.state, 'closed');
    assert.equal(item.transitionType, 'opens');
    assert.ok(item.transitionAt > now);
  }
});

test('marks a session open at its local open and closed at its local close', () => {
  const london = session('london');
  const open = getSessionSnapshot(new Date('2026-01-15T08:00:00.000Z'), london);
  const close = getSessionSnapshot(new Date('2026-01-15T17:00:00.000Z'), london);
  assert.equal(open.state, 'open');
  assert.equal(open.transitionType, 'closes');
  assert.equal(close.state, 'closed');
  assert.equal(close.transitionType, 'opens');
});
