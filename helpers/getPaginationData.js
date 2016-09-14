// (c) Andrew Wei

/**
 * Gets the pagination metadata with arguments provided.
 *
 * @param {string} collectionName
 * @param {Object} collection
 * @param {number} currentPage
 *
 * @return {Object}
 */
function getPaginationData(collectionName, collection, currentPage) {
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
}

module.exports = getPaginationData;
