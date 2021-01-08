const colors = require('colors');
const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');

console.log(colors.blue('Cleaning up export files'));

const files = glob.sync(path.join(process.cwd(), '*.{js,ts}'));
files
  .filter((filePath) => !/\.config\.js$/gi.test(path.basename(filePath)))
  .forEach((filePath) => fs.removeSync(filePath));

console.log(colors.blue('Restoring config files'));
const tempFolder = path.join(process.cwd(), 'configTemp');
const tempFolderFiles = glob.sync(path.join(tempFolder, '*'));
tempFolderFiles.forEach((filePath) => {
  fs.moveSync(filePath, path.join(process.cwd(), path.basename(filePath)));
});
fs.removeSync(tempFolder);
