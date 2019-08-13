const colors = require('colors');
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');

console.log(colors.blue('Cleaning up export files'));

glob(path.join(process.cwd(), '*.js'), {}, (err, files) => {
  files
    .filter((filePath) => !/\.config\.js$/gi.test(path.basename(filePath)))
    .forEach((filePath) => fs.removeSync(filePath));
});
