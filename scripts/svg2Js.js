const colors = require('colors');
const path = require('path');
const fs = require('fs-extra');
const cheerio = require('cheerio');
const camelCase = require('lodash/camelCase');
const { ICON_CLASSNAME_PREFIX } = require('./constants');
const glyphsConfig = require('./loadGlyphsConfig.js');

console.log(colors.blue('Building JS Export files'));

fs.ensureDirSync(path.join(process.cwd(), 'js'));
fs.emptyDirSync(path.join(process.cwd(), 'js'));

const tsDefinitionBase = fs.readFileSync(
  path.join(process.cwd(), 'scripts', 'definitionsBase.d.ts'),
  'utf8'
);

const iconDefinitions = {};
const badIcons = [];

const { iconKeys, iconNames } = glyphsConfig.reduce(
  (result, { glyph: filePath, name, code }) => {
    const dirName = path.dirname(filePath);

    const $ = cheerio.load(fs.readFileSync(filePath));
    const paths = $('path')
      .map((i, el) => $(el).attr('d'))
      .get();

    const svg = $('svg');

    if (paths.length !== 1) {
      badIcons.push(`${dirName}/${name}.svg`);
    }

    const definition = {
      key: camelCase(`${ICON_CLASSNAME_PREFIX}-${name}`),
      name: camelCase(name),
      width: svg.attr('width'),
      height: svg.attr('height'),
      path: paths.join(' '),
    };

    iconDefinitions[definition.key] = `{
    prefix: '${ICON_CLASSNAME_PREFIX}',
    iconName: '${definition.name}',
    icon: [${definition.width}, ${definition.height}, [], '${code}', '${definition.path}']
  }`;

    const fileContent = `'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var prefix = '${ICON_CLASSNAME_PREFIX}';
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
    result.iconKeys.push(definition.key);
    result.iconNames.push(definition.name);
    return result;
  },
  { iconKeys: [], iconNames: [] }
);

// following code generation is adapted from @fortawesome/free-brands-svg-icons index.js
const indexFileHeader = `(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global['tablecheck-svg-icons'] = {})));
}(this, (function (exports) { 'use strict';

  var prefix = '${ICON_CLASSNAME_PREFIX}';`;
const indexFileFooter = `
  Object.defineProperty(exports, '__esModule', { value: true });
})));`;
const iconsCacheContent = `
  var _iconsCache = {
    ${iconKeys.map((key) => `${key}: ${key}`).join(',\n    ')}
  }`;
const exportsContent = [
  `${ICON_CLASSNAME_PREFIX} = _iconsCache`,
  `prefix = prefix`,
]
  .concat(iconKeys.map((key) => `${key} = ${key}`))
  .map((line) => `  exports.${line};`)
  .join('\n');

const indexContent = `${indexFileHeader}
${iconKeys.map((key) => `  var ${key} = ${iconDefinitions[key]};`).join('\n')}
${iconsCacheContent}
${exportsContent}
${indexFileFooter}
`;

const esContent = `var prefix = '${ICON_CLASSNAME_PREFIX}';
${iconKeys
  .map((key) => `var ${key} = ${iconDefinitions[key].replace(/  /gi, ' ')};`)
  .join('\n')}
${iconsCacheContent.replace(/  /gi, ' ')}
export { _iconsCache as ${ICON_CLASSNAME_PREFIX}, prefix, ${iconKeys.join(
  ', '
)} };
`;

const tsDefinitionContent = `${tsDefinitionBase}

export type IconName = ${iconNames.map((key) => `'${key}'`).join(' | \n  ')};`;

fs.writeFileSync(path.join(process.cwd(), 'js/index.js'), indexContent, {
  encoding: 'utf8',
});
fs.writeFileSync(path.join(process.cwd(), 'js/index.es.js'), esContent, {
  encoding: 'utf8',
});
fs.writeFileSync(
  path.join(process.cwd(), 'js/definitions.d.ts'),
  tsDefinitionContent,
  {
    encoding: 'utf8',
  }
);

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
