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


const expressions = require('angular-expressions');
const mustache = require('mustache');
const walk = require('acorn-walk');

const nanoid = require('nanoid');

const format = require('./format');
const safe = require('./safe');

function every(input, value) {
  if (!input || !input.every) {
    return false;
  }
  if (!value || !value.includes) {
    return false;
  }
  return input.every(one => value.includes(one));
}

function some(input, value) {
  if (!input || !input.some) {
    return false;
  }
  if (!value || !value.includes) {
    return false;
  }
  return input.some(one => value.includes(one));
}

function none(input, value) {
  return !some(input, value);
}

Object.assign(expressions.filters, {
  isoDateTime: format.isoDateTime,
  isoDate: format.isoDate,
  isoTime: format.isoTime,

  date: format.date,
  time: format.time,
  dateTime: format.dateTime,
  dateOrTime: format.dateOrTime,
  timeSpan: format.timeSpan,

  number: format.number,
  currency: format.currency,
  percent: format.percent,
  
  every,
  some,
  none
});

function normalizePath(path) {
  if (!path.includes('-')) {
    return path;
  }
  const [first, ...rest] = path.split('.');
  if (!rest.length) {
    return first;
  }
  const normalized = rest.map(name => `["${name}"]`).join('');
  return `${first}${normalized}`;
}

function logEvalError(text, context, value, err) {
  console.log(new Date, 'parseTemplate err', err);
  console.log('. text', text);
  console.log('. value', value);
  if (context['_@id']) {
    console.log('. _@id', context['_@id']);
  }
}

module.exports = function parseTemplate(text = '', context = {}, opts = {}) {
  let result = '';
  const parsed = mustache.parse(text);

  context = Object.assign({}, context);
  context.$now = Date.now();
  context.$nanoid = nanoid();
  context.$random = Math.random();

  for (let tpl of parsed) {
    let [type, value] = tpl;
    if (type === 'name') {
      if (opts.normalizePaths) {
        value = normalizePath(value);
      }
      try {
        const evaluate = expressions.compile(value);
        walk.full(evaluate.ast, node => {
          if (!opts.allowAssignments && node.type === 'AssignmentExpression') {
            throw new Error('no assignments allowed');
          }
        });
        value = evaluate(context);
      } catch (err) {
        if (opts.noSilentError) {
          throw err;
        }
        logEvalError(text, context, value, err);

        value = safe.get(context, value);
      }
    }
    if (type === '&') {
      const param = safe.get(context, value);
      value = JSON.stringify(param);
    }
    result += value;
  }
  return result;
};
