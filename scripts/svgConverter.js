const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const colors = require('colors');
const glob = require('glob');

const [node, script, ...globs] = process.argv;

if (globs.length === 0) {
  console.info(
    `Pass a selection of files or file globs to "Convert" to our format. The location of the file will not be changed but we will ensure the excess formatting is removed correctly.`
      .blue
  );
}

globs.forEach((fileOrGlob) => {
  glob(path.join(process.cwd(), fileOrGlob), {}, (err, files) => {
    if (err) {
      console.error(`Failed to load "${fileOrGlob}"`.red.bold);
      return;
    }
    files.forEach((file) => {
      const filePath = path.resolve(process.cwd(), file);
      const $ = cheerio.load(fs.readFileSync(filePath));
      const [x, y, width, height] = $('svg')
        .attr('viewBox')
        .split(' ');
      const paths = $('path')
        .map((i, el) => $(el).attr('d'))
        .get();

      if (paths.length !== 1) {
        console.warn(
          `An incorrect number of paths have been defined, to prevent issues please use non-zero path subtraction and a single path.`
            .yellow
        );
      }

      if (height !== '512') {
        console.error(
          `SVG Must have a height of 512, failed to import "${file}"`.red
        );
        return;
      }
      if (parseInt(height, 10) > 512) {
        console.error(
          `SVG Must have a maximum width of 512, failed to import "${file}"`.red
        );
        return;
      }

      fs.writeFileSync(
        filePath,
        `<svg width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}" version="1.1" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="${paths.join(
          ' '
        )}"></path></svg>`
      );
      console.log(`Successfully imported "${file}"!`.green.bold);
    });
  });
});
