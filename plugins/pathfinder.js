// (c) Andrew Wei

const _ = require('lodash');
const helpers = require('../helpers');

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
        data.path = helpers.getNormalizedPath(helpers.getLocalizedPath(data.path, currentLocale, locales));

      if (data.pagination)
        data.pagination.pages.forEach(val => val.path = helpers.getNormalizedPath(helpers.getLocalizedPath(val.path, currentLocale, locales)));
    });

    done();
  };
};
