const path = require('path');
const fs = require('fs-extra');
const glob = require('glob');
const { prefix } = require('./constants');

const ICONS_PER_ROW = 4;

function getOrderedPages(nameResolveFn) {
  const files = glob
    .sync(path.join(process.cwd(), 'svg/**/*.svg'))
    .map((filepath) => path.parse(filepath).name);
  const previousOrder = fs
    .readJsonSync(path.join(__dirname, 'orderedNames.json'))
    // remove files that no longer exist on the drive
    .map((row) => row.map((file) => (files.indexOf(file) >= 0 ? file : '')));
  // make one array for checking
  const previousFiles = previousOrder.reduce(
    (result, filesRow) =>
      result.concat(filesRow.filter((filename) => !!filename)),
    []
  );
  const newFiles = files.filter((file) => previousFiles.indexOf(file) === -1);
  let currentNewFilesIndex = 0;
  previousOrder.map((page) => {
    page.map((file) => {
      if (currentNewFilesIndex >= newFiles.length || !!file) {
        return file;
      }
      const insertFile = newFiles[currentNewFilesIndex];
      currentNewFilesIndex += 1;
      return insertFile;
    });
  });
  while (currentNewFilesIndex < newFiles.length) {
    const lastPage = previousOrder[previousOrder.length - 1];
    const insertFile = newFiles[currentNewFilesIndex];
    if (!lastPage || lastPage.length >= ICONS_PER_ROW) {
      previousOrder.push([insertFile]);
    } else {
      lastPage.push(insertFile);
    }
    currentNewFilesIndex += 1;
  }
  fs.writeJsonSync(path.join(__dirname, 'orderedNames.json'), previousOrder);
  return previousOrder.map((page, index) => [
    index + 1,
    page.map((filepath) =>
      nameResolveFn(`${prefix}-${path.parse(filepath).name}`)
    )
  ]);
}

module.exports = {
  ICONS_PER_ROW,
  getOrderedPages
};
