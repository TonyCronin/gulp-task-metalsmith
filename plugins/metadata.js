// (c) Andrew Wei

const _ = require('lodash');
const minimatch = require('minimatch');

/**
 * Merges additional metadata into a file if that file matches the specified
 * pattern.
 *
 * @param  {Object} metadata - Each value in this object is a file pattern with
 *                             additional metadata to be merged if a file
 *                             matches that file pattern.
 *
 * @return {Function} Metalsmith plugin.
 */
module.exports = function(metadata) {
  return function(files, metalsmith, done) {
    if (metadata) {
      Object.keys(files).forEach(file => {
        const data = files[file];
        _.merge(data, matchedMetadata(file, metadata) || {});
      });
    }

    done();
  };
};

/**
 * Checks if the given file matches the pattern in the metadata object and
 * returns the metadata if there is a match.
 *
 * @param {string} file - File path.
 * @param {Object} metadata - Object containing all metadata of all file
 *                            patterns.
 *
 * @return {Object} Matching metadata.
 */
function matchedMetadata(file, metadata) {
  for (let name in metadata) {
    const data = metadata[name];
    if (!data.pattern) return undefined;
    if (minimatch(file, data.pattern)) return data.metadata;
  }
  return undefined;
}
