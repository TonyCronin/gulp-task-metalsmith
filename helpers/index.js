// (c) Andrew Wei

const _ = require('lodash');

/**
 * Normalizes a path so that relative paths are converted to absolute paths and
 * a trailing '/' is ensured.
 *
 * @param {string} path - Path to normalize.
 *
 * @return {string} Normalized path.
 */
exports.getNormalizedPath = function(path) {
  if (/((\/)?([a-zA-Z0-9\-\_\/\.]+))/g.test(path)) {
    if (!_.startsWith(path, '/')) path = `/${path}`;
    if (!_.endsWith(path, '.html') && !_.endsWith(path, '/')) path = `${path}/`;
  }

  return path;
};

/**
 * Localizes a path.
 *
 * @param {string} path - Path to normalize.
 * @param {string} [currentLocale] - Current locale.
 * @param {Array} [locales] - Supported locales.
 *
 * @return {string} Localized path.
 */
exports.getLocalizedPath = function(path, currentLocale, locales) {
  // Permalinks in the default locale do not require any locale prefixes, so
  // return the string untouched.
  if (!currentLocale || !locales || (currentLocale === locales[0])) return path;

  // Prefix the permalink with the correct locale ID. Account for cases
  // where the permalink is already prefixed with the locale.
  let parts = _.compact(path.split('/'));
  if (locales.indexOf(parts[0]) < 0) parts.unshift(currentLocale);
  return '/' + parts.join('/');
};

/**
 * Gets the path to the document under the given options.
 *
 * @param {Object} doc
 * @param {Object} options
 *
 * @return {string}
 */
exports.getDocumentPath = function(doc, options) {
  let pattern = _.get(options, `${doc.type}.permalink`);
  let ret = pattern;

  if (pattern) {
    const regex = /:(\w+)/g;
    let params = [];
    let m;
    while (m = regex.exec(pattern)) params.push(m[1]);

    for (let i = 0, key; key = params[i++];) {
      let val = doc[key];
      if (!val) return null;

      ret = ret.replace(`:${key}`, val);
    }

    return exports.getNormalizedPath(ret);
  }

  return null;
};

/**
 * Gets the pagination metadata with arguments provided.
 *
 * @param {string} collectionName
 * @param {Object} collection
 * @param {number} currentPage
 *
 * @return {Object}
 */
exports.getPaginationData = function(collectionName, collection, currentPage) {
  if (!collection.length) return undefined;

  const config = $.documents[collection[0].type];
  const perPage = _.get(config, 'paginate.perPage');

  if (!config || isNaN(perPage)) return undefined;

  const chunks = _.chunk(collection, perPage);
  const pages = [];

  for (let i = 0; i < chunks.length; i++) {
    pages.push({
      path: (i === 0) ? `/${collectionName}/` : `/${collectionName}/${i+1}/`
    });
  }

  if (chunks.length >= currentPage) {
    return {
      files: chunks[currentPage-1],
      index: currentPage - 1,
      num: currentPage,
      pages: pages,
      next: (chunks.length > currentPage) && {
        path: `/${collectionName}/${currentPage+1}/`
      },
      previous: (currentPage > 1) && {
        path: ((currentPage - 1) === 1) ? `/${collectionName}/` : `/${collectionName}/${currentPage-1}/`
      }
    };
  }

  return undefined;
};
