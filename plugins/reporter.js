// (c) Andrew Wei

const util = require('gulp-util');

/**
 * Writes Metalsmith file report to console.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function() {
  return function(files, metalsmith, done) {
    Object.keys(files).forEach(file => {
      util.log(util.colors.blue('[metalsmith]'), 'Generated', util.colors.magenta(file));
    });

    done();
  };
};
