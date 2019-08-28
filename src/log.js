const colors = require('colors/safe');
const merge = require('deepmerge');
const { inspect } = require('util');

const { caller } = require('./node');

const LEVELS = Object.freeze({
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4
});

const COLORS = Object.freeze({
  1: 'red',
  2: 'yellow',
  3: 'green',
  4: 'white'
});

const FORMAT = Object.freeze({
  term: 'term',
  text: 'text',
  json: 'json'
});

const TIMEOF = Object.freeze({
  iso: 'iso',
  ru: 'ru',
  en: 'en'
});

function getDefaultOptions() {
  return {
    level: LEVELS.info,
    time : TIMEOF.iso,
    width: {
      object: 40
    }
  };
}

let options = getDefaultOptions();

function setOptions(opts = {}) {
  options = getOptions(opts);
}

function getOptions(opts = {}) {
  return merge.all([getDefaultOptions(), options || {}, opts]);
}

function summary(message) {
  if (!message) {
    return '[undefined]';
  }
  if (message instanceof Error) {
    const joiner = colors.red('* ');
    return message.stack.split('  at').join(joiner);
  }
  return inspect(message);
}

function log(message = '?', object = caller(), level = LEVELS.info) {
  const opts = getOptions();

  if (level > opts.level || level === LEVELS.NONE) {
    return;
  }
  if (message && message._silent) {
    return;
  }
  const color = COLORS[level];
  let date = new Date().toISOString(); //utils.formatDate(new Date());

  let line = '';

  if (typeof object === 'object' && object.module) {
    object = object.module;
  }

  if (object) {
    if (!isNaN(+object)) {
      object = `[${object}]`;
    }
    object = (object || '').toString().substring(0, opts.width.object);
    object = `${object.padEnd(opts.width.object, ' ')} : `;
    line += colors.bold(object);
  }

  if (typeof message === 'object') {
    message = summary(message);
  } else {
    message = message + '';
  }
  if (color) {
    date = colors[color](date);
    line = colors[color](line);
  }
  console.log(`${date} ${line} ${message}`);
}

log.LEVELS = LEVELS;
log.COLORS = COLORS;
log.FORMAT = FORMAT;

log.setOptions = setOptions;
log.getOptions = getOptions;

log.debug = (message, object) => log(message, object || caller(), LEVELS.debug);
log.info = (message, object) => log(message, object || caller(), LEVELS.info);
log.warn = (message, object) => log(message, object || caller(), LEVELS.warn);
log.error = (message, object) => log(message, object || caller(), LEVELS.error);


module.exports = log;
