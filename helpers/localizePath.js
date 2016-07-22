// (c) Andrew Wei

const _ = require('lodash');

/**
 * Localizes a path.
 *
 * @param {string} path - Path to normalize.
 * @param {string} [currentLocale] - Current locale.
 * @param {Array} [locales] - Supported locales.
 *
 * @return {string} Localized path.
 */
function localizePath(path, currentLocale, locales) {
  // Permalinks in the default locale do not require any locale prefixes, so
  // return the string untouched.
  if (!currentLocale || !locales || (currentLocale === locales[0])) return path;

  // Prefix the permalink with the correct locale ID. Account for cases
  // where the permalink is already prefixed with the locale.
  let parts = _.compact(path.split('/'));
  if (locales.indexOf(parts[0]) < 0) parts.unshift(currentLocale);
  return '/' + parts.join('/');
}

module.exports = localizePath;
