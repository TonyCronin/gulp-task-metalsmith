// (c) Andrew Wei

const _ = require('lodash');

/**
 * Creates multilingual versions of the same file.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function(opts) {
  const locales = _.get(opts, 'locales');
  const defaultLocale = (locales instanceof Array) && locales.shift();

  return function(files, metalsmith, done) {
    Object.keys(files).forEach((file, i) => {
      const data = files[file];

      locales.forEach((locale) => {
        if (!files[`${locale}/${file}`]) {
          const clone = _.cloneDeep(data);
          console.log(clone.path);
          files[`${locale}/${file}`] = clone;
        }
      });
    });

    done();
  };
};
