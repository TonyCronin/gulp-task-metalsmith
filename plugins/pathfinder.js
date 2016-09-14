// (c) Andrew Wei

const _ = require('lodash');
const getNormalizedPath = require('../helpers/getNormalizedPath');
const getLocalizedPath = require('../helpers/getLocalizedPath');

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
        data.path = getNormalizedPath(getLocalizedPath(data.path, currentLocale, locales));

      if (data.pagination)
        data.pagination.pages.forEach(val => val.path = getNormalizedPath(getLocalizedPath(val.path, currentLocale, locales)));
    });

    done();
  };
};
