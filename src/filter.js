function unique(array = []) {
  return array.filter((item, pos, self) => {
    return self.indexOf(item) === pos;
  });
}

function only(object = {}, keys = []) {
  keys = Array.isArray(keys) ? keys : [keys];
  return keys.reduce((result, key) => {
    result[key] = object[key];
    return result;
  }, {});
}

module.exports = {
  unique,
  only,
};
