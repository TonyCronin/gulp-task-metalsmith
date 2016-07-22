// (c) Andrew Wei

const _ = require('lodash');
const normalizePath = require('../helpers/normalizePath');
const localizePath = require('../helpers/localizePath');

/**
 * Resolves the path for each file data.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function(currentLocale, locales) {
  return function(files, metalsmith, done) {
    Object.keys(files).forEach((file, i) => {
      const data = files[file];

      if (typeof data.path === 'string')
        data.path = normalizePath(localizePath(data.path, currentLocale, locales));

      if (data.pagination)
        data.pagination.pages.forEach(val => val.path = normalizePath(localizePath(data.path, currentLocale, locales)));
    });

    done();
  };
};
