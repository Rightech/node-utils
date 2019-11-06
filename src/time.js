/**
 * 
 * Copyright 2019 Rightech IoT. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


const DAY_START = [0, 0, 0, 0]; // eslint-disable-line no-magic-numbers
const DAY_END = [23, 59, 59, 999]; // eslint-disable-line no-magic-numbers


const timeSpan = {
  seconds: count => count * 1000, // eslint-disable-line no-magic-numbers
  minutes: count => count * timeSpan.seconds(60), // eslint-disable-line no-magic-numbers
  hours: count => count * timeSpan.minutes(60), // eslint-disable-line no-magic-numbers
  days: count => count * timeSpan.hours(24), // eslint-disable-line no-magic-numbers
  months: (count, from) => count * timeSpan.days(30), // eslint-disable-line no-magic-numbers, no-unused-vars
  years: (count, from) => count * timeSpan.months(12) // eslint-disable-line no-magic-numbers, no-unused-vars
};

let systemOffset = new Date().getTimezoneOffset();
let currentOffset = new Date().getTimezoneOffset();

let luxon = null;

function of(count) {
  const result = {};
  for (const measure of Object.keys(timeSpan)) {
    result[measure] = timeSpan[measure](count);
  }
  return result;
}

function getOffset() {
  return currentOffset;
}

function setOffset(offset) {
  const previous = currentOffset;
  currentOffset = offset;
  return { offset, previous, system: systemOffset };
}

function getDateTime(date) {
  return luxon.DateTime.fromJSDate(new Date(date || Date.now()));
}

function getLocalTime(date) {
  if (date && date.isLocal) {
    return date;
  }
  date = new Date(date || Date.now());
  date.setTime(date.getTime() + systemOffset * 60 * 1000);
  date.setTime(date.getTime() - currentOffset * 60 * 1000);
  date.__locale = date.isLocal = true;
  return date;
}

function unsetLocaleTime(date) {
  date = new Date(date);
  date.setTime(date.getTime() + currentOffset * 60 * 1000);
  date.setTime(date.getTime() - systemOffset * 60 * 1000);
  delete date.__locale;
  delete date.isLocal;
  return date;
}

function getLuxon() {
  return luxon;
}

function setLuxon(inst) {
  luxon = inst;
}

function startOfHour(date) {
  if (luxon) {
    return getDateTime(date).startOf('hour').toJSDate();
  }
  const start = DAY_START.concat([]);
  date = new Date(date || Date.now());
  start[0] = date.getHours(); // eslint-disable-line no-magic-numbers
  date.setHours(...start);
  return date;
}

function startOfDay(date) {
  if (luxon) {
    return getDateTime(date).startOf('day').toJSDate();
  }
  date = new Date(date || Date.now());
  date.setHours(...DAY_START);
  return date;
}

function startOfMonth(date) {
  if (luxon) {
    return getDateTime(date).startOf('month').toJSDate();
  }
  date = new Date(date || Date.now());
  date = new Date(date.getFullYear(), date.getMonth(), 1); // eslint-disable-line no-magic-numbers
  return startOfDay(date);
}

function startOfYear(date) {
  if (luxon) {
    return getDateTime(date).startOf('year').toJSDate();
  }
  date = new Date(date || Date.now());
  date = new Date(date.getFullYear(), 0, 1); // eslint-disable-line no-magic-numbers
  return startOfDay(date);
}


function endOfHour(date) {
  if (luxon) {
    return getDateTime(date).endOf('hour').toJSDate();
  }
  const end = DAY_END.concat([]);
  date = new Date(date || Date.now());
  end[0] = date.getHours(); // eslint-disable-line no-magic-numbers
  date.setHours(...end);
  return date;
}

function endOfDay(date) {
  if (luxon) {
    return getDateTime(date).endOf('day').toJSDate();
  }
  date = new Date(date || Date.now());
  date.setHours(...DAY_END);
  return date;
}

function endOfMonth(date) {
  if (luxon) {
    return getDateTime(date).endOf('month').toJSDate();
  }
  date = new Date(date || Date.now());
  date = new Date(date.getFullYear(), date.getMonth() + 1, 0); // eslint-disable-line no-magic-numbers
  return endOfDay(date);
}

function endOfYear(date) {
  if (luxon) {
    return getDateTime(date).endOf('year').toJSDate();
  }
  date = new Date(date || Date.now());
  date = new Date(date.getFullYear(), 11, 31); // eslint-disable-line no-magic-numbers
  return endOfDay(date);
}


function startOf(date) {
  return {
    hour: startOfHour(date),
    day: startOfDay(date),
    month: startOfMonth(date),
    year: startOfYear(date)
  };
}

function endOf(date) {
  return {
    hour: endOfHour(date),
    day: endOfDay(date),
    month: endOfMonth(date),
    year: endOfYear(date)
  };
}

function timezoneOffset() {
  return of(new Date().getTimezoneOffset()).minutes;
}

module.exports = {
  span: timeSpan,

  getLuxon,
  setLuxon,
  getOffset,
  setOffset,
  getLocalTime,
  unsetLocaleTime,

  startOf, endOf,
  startOfHour, endOfHour,
  startOfDay, endOfDay,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
  timezoneOffset,
  of,
  timeOf: of
};
