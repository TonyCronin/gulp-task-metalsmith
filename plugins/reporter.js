// (c) Andrew Wei

const util = require('gulp-util');

/**
 * Writes Metalsmith file report to console.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function(locale) {
  return function(files, metalsmith, done) {
    Object.keys(files).forEach(file => {
      if (locale)
        util.log(util.colors.blue('[metalsmith]'), util.colors.green(`[${locale}]`), 'Generated', util.colors.magenta(file));
      else
        util.log(util.colors.blue('[metalsmith]'), 'Generated', util.colors.magenta(file));
    });

    done();
  };
};
