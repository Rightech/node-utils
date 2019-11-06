
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


const path = require('path');
const stackTrace = require('stack-trace');

function isMongoId(id) {
  return id && id._bsontype && id._bsontype === 'ObjectID';
}

function callers() {
  if (!require.main) {
    return [];
  }

  const rootPath = path.dirname(require.main.filename);
  const modulesPath = path.join(rootPath, '..', 'modules');

  return stackTrace.get()
    .filter(entry => {
      const name = entry.getFileName();
      return name && name.includes(modulesPath);
    })
    .map(origin => {
      const filename = origin.getFileName();
      const parts = filename.split(path.sep);
      const name = parts[parts.indexOf('modules') + 1];
      return {
        name,
        line: origin.getLineNumber(),
        file: path.basename(filename),
        module: `system [${name || 'unknown'}]`
      };
    });
}

function caller(skip, name) {
  skip = skip || 0;
  name = name || 'system';
  return callers()[skip] || { name, module: name };
}

module.exports = {
  isMongoId,
  callers,
  caller,
}
