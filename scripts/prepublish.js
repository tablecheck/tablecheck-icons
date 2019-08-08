const colors = require('colors');
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');

console.log(colors.blue('Building Package Files'));

// Build files
require('./svg2Js.js');
require('./svg2Font.js');

glob(path.join(process.cwd(), 'js/*.js'), {}, (err, files) => {
  console.log(colors.blue('Moving to correct directory and cleaning up.'));
  files.forEach((filePath) =>
    fs.moveSync(filePath, path.join(process.cwd(), path.basename(filePath)))
  );
  fs.removeSync(path.join(process.cwd(), 'js'));
});
