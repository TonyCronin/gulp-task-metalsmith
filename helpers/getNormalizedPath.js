// (c) Andrew Wei

const _ = require('lodash');

/**
 * Normalizes a path so that relative paths are converted to absolute paths and
 * a trailing '/' is ensured.
 *
 * @param {string} path - Path to normalize.
 *
 * @return {string} Normalized path.
 */
function getNormalizedPath(path) {
  if (/((\/)?([a-zA-Z0-9\-\_\/\.]+))/g.test(path)) {
    if (!_.startsWith(path, '/')) path = `/${path}`;
    if (!_.endsWith(path, '.html') && !_.endsWith(path, '/')) path = `${path}/`;
  }

  return path;
}

module.exports = getNormalizedPath;
