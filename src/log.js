const colors = require('colors/safe');

const LEVELS = Object.freeze({
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4
});

const COLORS = Object.freeze({
  1: 'red',
  2: 'yellow',
  3: 'green',
  4: 'white'
});

const FORMAT = Object.freeze({
  ascii: 'ascii',
  text: 'text',
  json: 'json'
});

function getDefaultOptions() {
  return {
    level: LEVELS.INFO,
    width: {
      category: 40
    }
  };
}


module.exports = {
  LEVELS,
  COLORS,
  FORMAT

}
