const colors = require('colors');
const path = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const camelCase = require('lodash/camelCase');
const { prefix } = require('./constants');

console.log(colors.blue('Building JS Export files'));

const dirList = fs.readdirSync(path.join(process.cwd(), 'svg'));
fs.ensureDirSync(path.join(process.cwd(), 'js'));

const iconDefinitions = {};
const badIcons = [];

dirList.forEach((dirName) => {
  const iconCodes = require(path.join(
    process.cwd(),
    'svg',
    dirName,
    'icon-codes.json'
  ));
  Object.keys(iconCodes).map((name) => {
    let filePath = path.join(process.cwd(), 'svg', dirName, `${name}.svg`);
    let code = iconCodes[name];
    if (iconCodes[name] instanceof Array) {
      filePath = path.join(
        process.cwd(),
        'svg',
        dirName,
        `${iconCodes[name][0]}.svg`
      );
      code = iconCodes[name][1];
    }
    const $ = cheerio.load(fs.readFileSync(filePath));
    const paths = $('path')
      .map((i, el) => $(el).attr('d'))
      .get();

    const svg = $('svg');

    if (paths.length !== 1) {
      badIcons.push(`${dirName}/${name}.svg`);
    }

    const definition = {
      key: camelCase(`${prefix}-${name}`),
      name: camelCase(name),
      width: svg.attr('width'),
      height: svg.attr('height'),
      path: paths.join(' ')
    };

    iconDefinitions[definition.key] = `{
    prefix: '${prefix}',
    iconName: '${definition.name}',
    icon: [${definition.width}, ${definition.height}, [], '${code}', '${definition.path}']
  }`;

    const fileContent = `'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var prefix = '${prefix}';
var iconName = '${definition.name}';
var width = ${definition.width};
var height = ${definition.height};
var ligatures = [];
var unicode = '${code}';
var svgPathData = '${definition.path}';

exports.definition = {
  prefix: prefix,
  iconName: iconName,
  icon: [
    width,
    height,
    ligatures,
    unicode,
    svgPathData
  ]};

exports.${definition.key} = exports.definition;
exports.prefix = prefix;
exports.iconName = iconName;
exports.width = width;
exports.height = height;
exports.ligatures = ligatures;
exports.unicode = unicode;
exports.svgPathData = svgPathData;
`;
    fs.writeFileSync(
      path.join(process.cwd(), 'js', `${definition.key}.js`),
      fileContent,
      { encoding: 'utf8' }
    );
  });
});

const iconKeys = Object.keys(iconDefinitions);

// following code generation is adapted from @fortawesome/free-brands-svg-icons index.js
const indexFileHeader = `(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global['tablecheck-svg-icons'] = {})));
}(this, (function (exports) { 'use strict';

  var prefix = '${prefix}';`;
const indexFileFooter = `
  Object.defineProperty(exports, '__esModule', { value: true });
})));`;
const iconsCacheContent = `
  var _iconsCache = {
    ${iconKeys.map((key) => `${key}: ${key}`).join(',\n    ')}
  }`;
const exportsContent = [`${prefix} = _iconsCache`, `prefix = prefix`]
  .concat(iconKeys.map((key) => `${key} = ${key}`))
  .map((line) => `  exports.${line};`)
  .join('\n');

const indexContent = `${indexFileHeader}
${iconKeys.map((key) => `  var ${key} = ${iconDefinitions[key]};`).join('\n')}
${iconsCacheContent}
${exportsContent}
${indexFileFooter}
`;

const esContent = `var prefix = '${prefix}';
${iconKeys
  .map((key) => `var ${key} = ${iconDefinitions[key].replace(/  /gi, ' ')};`)
  .join('\n')}
${iconsCacheContent.replace(/  /gi, ' ')}
export { _iconsCache as ${prefix}, prefix, ${iconKeys.join(', ')} };
`;

fs.writeFileSync(path.join(process.cwd(), 'js/index.js'), indexContent, {
  encoding: 'utf8'
});
fs.writeFileSync(path.join(process.cwd(), 'js/index.es.js'), esContent, {
  encoding: 'utf8'
});

if (badIcons.length) {
  console.warn(
    '\nThe following SVG files have more than one path defined and may not correctly display when used as a JS export;'
      .yellow.bold
  );
  console.warn(colors.yellow(`\n * ${badIcons.join('\n * ')}\n`));
}

console.log(
  colors.green(
    `JS Export Files Generated into ${path.join(process.cwd(), 'js/')}`
  )
);
