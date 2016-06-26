// (c) Andrew Wei

const path = require('path');

module.exports = function() {
  return function(files, metalsmith, done) {
    // Disable permalinks for certain files.
    let regex = new RegExp(`^(404|500)\.html`);

    Object.keys(files).forEach(file => {
      if (regex.test(path.basename(file))) files[file].permalink = false;
    });

    done();
  };
}
