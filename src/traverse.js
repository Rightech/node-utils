/*
 *  name        : Rightech IoT Cloud ~.
 *  description : ~
 *  author      : Oleg Prohazko
 *
 *  LLC, Komnet, Russian Federation, Moscow, 2016
 *
 */


function walk(child, callback, parent) {
  callback(child, parent);

  parent = child;
  const children = child.children || [];
  for (const child of children) {
    walk(child, callback, parent);
  }
}

function walkFind(tree, callback) {
  if (callback(tree)) {
    return tree;
  }

  for (const child of tree.children || []) {
    const result = walkFind(child, callback);
    if (result) {
      return result;
    }
  }
}

function walkFindWithStats(tree, callback, stats = {}) {
  if (!stats.level) {
    stats.level = 0;
  }
  if (!stats.path) {
    stats.path = [tree];
  }
  stats.node = tree;
  if (callback(tree)) {
    stats.level = stats.path.length - 1; 
    stats.path.pop();
    return stats;
  }

  for (const child of tree.children || []) {
    stats.path.push(child);
    const result = walkFindWithStats(child, callback, stats);
    if (result) {
      return result;
    }
    stats.path.pop();
  }
}

function walkFilter(child, callback, result) {
  if (callback(child)) {
    result.push(child);
  }

  const children = child.children || [];
  for (const child of children) {
    walkFilter(child, callback, result);
  }
}


module.exports = function traverse(tree) {
  return {
    each: callback => walk(tree, callback),
    find: callback => walkFind(tree, callback),
    findWithStats: callback => walkFindWithStats(tree, callback, {}),
    filter: callback => {
      const result = [];
      walkFilter(tree, callback, result);
      return result;
    }
  };
};
