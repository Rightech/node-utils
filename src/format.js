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

const { startOfDay, timeOf, getLocalTime, getOffset } = require('./time');

const DEFAULT_FALLBACK = '-';
const DEFAULT_LOCALE = 'en';
const DEFAULT_24H_LOCALE = 'en-GB';

const timeOf1 = timeOf(1);

let fallback = DEFAULT_FALLBACK;
let currentLocale = DEFAULT_LOCALE;

const intlCache = {};

function getIntl(type, key, locale, options) {
  if (!locale) {
    locale = currentLocale;
  }
  key = `${type}.${key}.${locale}`;
  if (key in intlCache) {
    return intlCache[key];
  }
  return intlCache[key] = options
    ? new Intl[type](locale, options)
    : new Intl[type](locale);
}

function setLocale(locale) {
  currentLocale = locale;
  return { locale, currentLocale };
}

function date(value, locale) {
  if (typeof value === 'string') {
    value = +value;
  }
  if (!value || isNaN(value)) {
    return fallback;
  }
  return getIntl('DateTimeFormat', 'date', locale)
    .format(getLocalTime(value));
}

function time(value, locale) {
  if (typeof value === 'string') {
    value = +value;
  }
  if (!value || isNaN(value)) {
    return fallback;
  }
  const options = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  };
  return getIntl('DateTimeFormat', 'time', locale, options)
    .format(getLocalTime(value));
}

function dateTime(value, locale) {
  if (!value || isNaN(value)) {
    return fallback;
  }
  return `${date(value, locale)} ${time(value, locale)}`;
}

function dateOrTime(value, from, locale) {
  if (!value || isNaN(value)) {
    return fallback;
  }
  let local = getLocalTime(value || Date.now());
  return local >= startOfDay(from)
    ? time(value, locale)
    : date(value, locale);
}

function timeSpan(date) {
  if (typeof date === 'undefined' || date === 0) { // eslint-disable-line no-magic-numbers
    return fallback;
  }
  let days = Math.floor(+date / timeOf(1).days); // eslint-disable-line no-magic-numbers
  days = days > 0 ? (`${days}:`) : ''; // eslint-disable-line no-magic-numbers
  date = (+date + getOffset() * 60 * 1000);
  return days + time(date, DEFAULT_24H_LOCALE);
}


function number(value, fixed) {
  if (isNaN(value) || !isFinite(value)) {
    return value || fallback;
  }
  if (typeof fixed === 'undefined') {
    fixed = 2;
  }
  if (value && value.toFixed) {
    let [tmp, exp] = value.toFixed(fixed).split('e+');
    if (exp) {
      tmp = parseFloat(tmp).toFixed(fixed)
    }
    value = parseFloat(tmp);
  }
  return value;
}

function currency(value, currency, locale) {
  if (isNaN(value) || !isFinite(value)) {
    return value || fallback;
  }
  const style = currency ? { style: 'currency', currency } : {};
  return new Intl.NumberFormat(locale, style).format(value);
}

function sinceUnitBestFit(ms) {
  ms = Math.abs(ms);
  if (ms < timeOf1.minutes) {
    return 'second';
  }
  if (ms < timeOf1.hours) {
    return 'minute';
  }
  if (ms < timeOf1.days) {
    return 'hour';
  }
  return 'day';
}

function since(value, locale) {
  if (typeof value === 'string') {
    value = +value;
  }
  if (!value || isNaN(value)) {
    return fallback;
  }
  value = value - getLocalTime();
  const unit = sinceUnitBestFit(value);
  const bestValue =  Math.floor(value / timeOf1[`${unit}s`]);

  return getIntl('RelativeTimeFormat', 'auto', locale, { numeric: 'auto' })
    .format(bestValue, unit);
}

/*
function normalize(term, separator) {
  term = (term || '').toString();
  separator = typeof separator === 'string' ? separator : '_';
  let normalized = inflected.parameterize(term, { separator })
    .replace(/-/g, separator);

  normalized = inflected.humanize(normalized).trim();
  normalized = inflected.parameterize(normalized, { separator })
    .replace(/-/g, separator);
  return normalized;
}
*/

function percent(value, total, format) {
  format = format || '';
  if (!total || !value) {
    return `${0} ${format}`;
  }
  let percent = (value * 100) / total;
  if (format) {
    percent = (+percent).toFixed(0);
  }
  return `${percent} ${format}`;
}

module.exports = {
  setLocale,

  date,
  time,
  dateTime,
  dateOrTime,
  timeSpan,
  number,
  currency,
  percent,
  since
};
