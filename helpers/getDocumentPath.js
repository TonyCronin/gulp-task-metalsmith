// (c) Andrew Wei

const getNormalizedPath = require('./getNormalizedPath');

/**
 * Gets the path to the document under the given options.
 *
 * @param {Object} doc
 * @param {Object} options
 *
 * @return {string}
 */
function getDocumentPath(doc, options) {
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

    return getNormalizedPath(ret);
  }

  return null;
}

module.exports = getDocumentPath;
