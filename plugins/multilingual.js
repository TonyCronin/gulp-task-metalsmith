// (c) Andrew Wei

const _ = require('lodash');

/**
 * Create i18n file paths.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function(locale) {
  return function(files, metalsmith, done) {
    if (locale) {
      Object.keys(files).forEach(file => {
        if (!_.startsWith(file, locale)) {
          const data = files[file];
          files[`${locale}/${file}`] = data;
          delete files[file];
        }
      });
    }

    done();
  };
};
