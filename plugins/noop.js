// (c) Andrew Wei

const _ = require('lodash');

/**
 * Blank op.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function() {
  return function(files, metalsmith, done) {
    done();
  };
};
