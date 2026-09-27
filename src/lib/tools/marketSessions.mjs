export const SESSION_DEFINITIONS = [
  {
    id: 'sydney',
    name: 'Sydney',
    timeZone: 'Australia/Sydney',
    openHour: 8,
    closeHour: 17
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    timeZone: 'Asia/Tokyo',
    openHour: 9,
    closeHour: 18
  },
  {
    id: 'london',
    name: 'London',
    timeZone: 'Europe/London',
    openHour: 8,
    closeHour: 17
  },
  {
    id: 'new_york',
    name: 'New York',
    timeZone: 'America/New_York',
    openHour: 8,
    closeHour: 17
  }
];

const formatterCache = new Map();

function formatter(timeZone) {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(timeZone, new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }));
  }
  return formatterCache.get(timeZone);
}

export function getZonedParts(date, timeZone) {
  const values = {};
  for (const part of formatter(timeZone).formatToParts(date)) {
    if (part.type !== 'literal') values[part.type] = Number(part.value);
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second
  };
}

function zoneOffsetMilliseconds(date, timeZone) {
  const parts = getZonedParts(date, timeZone);
  const wallClockAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  const dateWithoutMilliseconds = Math.trunc(date.getTime() / 1000) * 1000;
  return wallClockAsUtc - dateWithoutMilliseconds;
}

export function zonedDateTimeToUtc(localDateTime, timeZone) {
  const wallClockAsUtc = Date.UTC(
    localDateTime.year,
    localDateTime.month - 1,
    localDateTime.day,
    localDateTime.hour ?? 0,
    localDateTime.minute ?? 0,
    localDateTime.second ?? 0
  );

  let guess = wallClockAsUtc;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const offset = zoneOffsetMilliseconds(new Date(guess), timeZone);
    const adjusted = wallClockAsUtc - offset;
    if (Math.abs(adjusted - guess) < 1000) return new Date(adjusted);
    guess = adjusted;
  }

  return new Date(guess);
}

function shiftLocalDate(parts, amountDays) {
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amountDays));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate()
  };
}

function isWeekday(localDate) {
  const day = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day)).getUTCDay();
  return day >= 1 && day <= 5;
}

function buildIntervals(now, definition) {
  const localNow = getZonedParts(now, definition.timeZone);
  const intervals = [];

  for (let offset = -2; offset <= 10; offset += 1) {
    const localDate = shiftLocalDate(localNow, offset);
    if (!isWeekday(localDate)) continue;

    const open = zonedDateTimeToUtc({
      ...localDate,
      hour: definition.openHour,
      minute: 0,
      second: 0
    }, definition.timeZone);

    const close = zonedDateTimeToUtc({
      ...localDate,
      hour: definition.closeHour,
      minute: 0,
      second: 0
    }, definition.timeZone);

    intervals.push({ open, close, localDate });
  }

  return intervals;
}

export function getSessionSnapshot(now, definition) {
  const intervals = buildIntervals(now, definition);
  const active = intervals.find(({ open, close }) => now >= open && now < close) ?? null;
  const nextOpen = intervals.find(({ open }) => open > now) ?? null;
  const transitionAt = active?.close ?? nextOpen?.open ?? null;

  return {
    ...definition,
    state: active ? 'open' : 'closed',
    transitionType: active ? 'closes' : 'opens',
    transitionAt,
    millisecondsUntilTransition: transitionAt ? Math.max(0, transitionAt.getTime() - now.getTime()) : null,
    localParts: getZonedParts(now, definition.timeZone)
  };
}

export function getSessionDashboard(now = new Date(), definitions = SESSION_DEFINITIONS) {
  const sessions = definitions.map((definition) => getSessionSnapshot(now, definition));
  const activeSessions = sessions.filter((session) => session.state === 'open');

  return {
    now,
    sessions,
    activeSessions,
    overlap: activeSessions.length >= 2 ? activeSessions.map((session) => session.name) : []
  };
}
