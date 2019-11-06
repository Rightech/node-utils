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


function bit(value, bit) {
  return ((value) & (1 << bit)) !== 0;
}

function get(object, path) {
  if (!object) {
    return object;
  }

  if (path in object) {
    return object[path];
  }
  const keys = path.split('.');
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (typeof object === 'number' && isFinite(key)) {
      return bit(object, +key);
    }

    if (!object || !object.hasOwnProperty(key)) {
      object = undefined;
      break;
    }
    object = object[key];
  }
  return object;
}

function set(object, path, value) {
  const keys = path.split('.');
  let i = 0;
  for (; i < keys.length - 1; i++) { // eslint-disable-line no-magic-numbers
    const key = keys[i];
    if (!object.hasOwnProperty(key)) {
      object[key] = {};
    }
    object = object[key];
  }
  if (value === undefined) {
    delete object[keys[i]];
  } else {
    object[keys[i]] = value;
  }

  return value;
}

function unset(object, path) {
  return set(object, path, undefined);
}

function copy(object, path, target, fallback) {
  const hasFallback = typeof fallback !== 'undefined';
  let value = get(object, path);

  if (typeof value === 'undefined') {
    if (hasFallback) {
      value = fallback;
    } else {
      return value;
    }
  }
  set(object, target, value);
  return value;
}

function swap(object, path, target) {
  const value = copy(object, path, target);
  if (typeof value === 'undefined') {
    return value;
  }
  set(object, target, value);
  unset(object, path);
  return value;
}

module.exports = {
  bit,
  get,
  set,
  unset,
  copy,
  swap
};
