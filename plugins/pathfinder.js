// (c) Andrew Wei

const _ = require('lodash');

/**
 * Resolves the path for each file data.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function() {
  return function(files, metalsmith, done) {
    Object.keys(files).forEach((file, i) => {
      const data = files[file];

      if (typeof data.path === 'string')
        data.path = normalize(data.path);

      if (data.pagination)
        data.pagination.pages.forEach(val => val.path = normalize(val.path));
    });

    done();
  };
};

/**
 * Normalizes a path so that relative paths are converted to absolute paths and
 * a trailing '/' is ensured.
 *
 * @param {string} path - Path to normalize.
 *
 * @return {string} Normalized path.
 */
function normalize(path) {
  if (/((\/)?([a-zA-Z0-9\-\_\/\.]+))/g.test(path)) {
    if (!_.startsWith(path, '/')) path = `/${path}`;
    if (!_.endsWith(path, '.html') && !_.endsWith(path, '/')) path = `${path}/`;
  }

  return path;
}
