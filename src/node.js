
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
