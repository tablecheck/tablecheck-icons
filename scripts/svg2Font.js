const colors = require('colors');
const path = require('path');
const fs = require('fs-extra');
const svgicons2svgfont = require('svgicons2svgfont');
const svg2ttf = require('svg2ttf');
const ttf2woff = require('ttf2woff');
const ttf2eot = require('ttf2eot');
const startCase = require('lodash/startCase');
const { prefix, tcColor } = require('./constants');
const glyphsConfig = require('./loadGlyphsConfig.js');

fs.ensureDirSync(path.join(process.cwd(), 'fonts'));

console.log(colors.blue('Generating Font Files'));

const outputName = 'tablecheck-icons';

console.log(colors.blue('Generating SVG Font'));

const stream = new svgicons2svgfont({
  fontName: outputName,
  fixedWidth: false,
  fontHeight: 512,
  error: (err) => {
    console.error('Error Generating SVG Font'.red.bold);
    console.error(err);
  }
});

const cssSrc = [
  `local("*")`,
  `url("${outputName}.eot?#iefix") format("embedded-opentype")`,
  `url("${outputName}.woff") format("woff")`,
  `url("${outputName}.svg") format("svg")`,
  `url("${outputName}.ttf") format("truetype")`
].join(', ');

let cssContent = `/*
** ${outputName}.css -- Web Font Embedding Stylesheet
*/

@font-face {
  font-family: "${outputName}";
  src: url("${outputName}.eot");
  src: ${cssSrc};
  font-style: normal;
  font-weight: normal;
  font-stretch: normal;
  font-variant: normal;
}

[class^="${prefix}-"]:before, 
[class*="${prefix}-"]:before {
  font-family: "${outputName}";
  font-style: normal;
  font-weight: normal;
  font-stretch: normal;
  font-variant: normal;
  font-size: inherit;
  text-rendering: auto;
  display: inline-block;
  transform: translate(0, 0);
  speak: none;
  text-decoration: inherit;
  text-align: center;
  text-transform: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
} 
`;
const htmlContent = [];

const fonts = ['svg', 'ttf', 'eot', 'woff', 'css', 'html'];

const files = fonts.reduce((result, type) => {
  result[type] = path.join(process.cwd(), `fonts/${outputName}.${type}`);
  return result;
}, {});

stream.pipe(fs.createWriteStream(files.svg)).on('finish', () => {
  console.log(colors.blue('Generating TTF Font'));
  const ttf = svg2ttf(fs.readFileSync(files.svg, 'utf8'), {});
  fs.writeFileSync(files.ttf, Buffer.from(ttf.buffer));

  console.log(colors.blue('Generating EOT Font'));
  const eot = ttf2eot(new Uint8Array(fs.readFileSync(files.ttf)), {});
  fs.writeFileSync(files.eot, Buffer.from(eot.buffer));

  console.log(colors.blue('Generating WOFF Font'));
  const woff = ttf2woff(new Uint8Array(fs.readFileSync(files.ttf)), {});
  fs.writeFileSync(files.woff, Buffer.from(woff.buffer));

  console.log(colors.blue('Generating CSS and HTML Font'));
  fs.writeFileSync(files.css, cssContent);
  let currentCategory;
  fs.writeFileSync(
    files.html,
    `<!DOCTYPE html>
<html>
  <head>
    <title>${outputName}</title>
    <style type="text/css">
      body { font-size: 16pt; font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol; margin: 40px; }
      h1 { margin-bottom: 0; }
      .sample { width: 100%; display: flex; flex-wrap: wrap; }
      .sample h2 { width: 100%; display: flex; }
      .sample .icon { width: 20%; display: inline-flex; }
      .sample .icon i { width: 20%; display: inline-block; color: ${tcColor}; }
      .sample .icon span { width: auto; display: inline-block; }
    </style>
    <link href="${outputName}.css" rel="stylesheet" type="text/css" />
  </head>
  <body>
    <h1>${outputName}</h1>
    <div class="sample">
      ${htmlContent
        .sort((a, b) => {
          const aString = `${a[0]}/${a[1]}`;
          const bString = `${b[0]}/${b[1]}`;
          return aString < bString ? -1 : aString > bString ? 1 : 0;
        })
        .reduce((withHeaders, [category, name, htmlCode]) => {
          if (category !== currentCategory) {
            currentCategory = category;
            withHeaders.push(
              `<h2 id="${category}">${startCase(category)}</h2>`
            );
          }
          withHeaders.push(htmlCode);
          return withHeaders;
        }, [])
        .join('\n      ')}
    </div>
  </body>
</html>`
  );

  console.log(
    colors.green(
      `Font Files Generated into ${path.join(process.cwd(), 'fonts/')}`
    )
  );
});

glyphsConfig.forEach(({ glyph, name, code, category }) => {
  cssContent += `
.${prefix}-${name}:before {
  content: "${code}"
}
`;
  htmlContent.push([
    category,
    name,
    `<div class="icon"><i class="${prefix}-${name}"></i><span>${prefix}-${name}</span></div>`
  ]);

  const iconStream = fs.createReadStream(glyph);
  iconStream.metadata = {
    name,
    unicode: [code]
  };
  stream.write(iconStream);
});

stream.end();
