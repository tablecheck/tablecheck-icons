const path = require('path');
const fs = require('fs-extra');

const dirList = fs.readdirSync(path.join(process.cwd(), 'svg'), {
  withFileTypes: true,
});
const aliasFilename = 'aliases.json';

const unicodeMap =
  fs.readJsonSync(path.join(process.cwd(), 'svg/unicodeMap.json'), {
    throws: false,
  }) || {};
const inUseMap = {};
let maxCodeValue = Object.keys(unicodeMap).reduce(
  (currentCode, key) => Math.max(currentCode, unicodeMap[key]),
  0
);

function getUnicode(key) {
  let value = unicodeMap[key];
  if (!value) {
    maxCodeValue += 1;
    unicodeMap[key] = maxCodeValue;
    value = maxCodeValue;
  }
  inUseMap[key] = value;
  return `0x${value.toString(16).padStart(4, '0').toUpperCase()}`;
}

const glyphsConfig = dirList.reduce((glyphs, dirOrFile) => {
  if (!dirOrFile.isDirectory()) return glyphs;
  const { name: dirName } = dirOrFile;
  const dirPath = path.join(process.cwd(), 'svg', dirName);
  const aliases =
    fs.readJsonSync(path.join(dirName, aliasFilename), { throws: false }) || {};
  const iconList = fs.readdirSync(dirPath);

  return glyphs.concat(
    iconList.reduce((icons, iconFileName) => {
      const [name] = iconFileName.split('.');
      if (!name || iconFileName === aliasFilename) return icons;
      const glyphPath = path.join(dirPath, `${name}.svg`);
      const iconDefinitions = [
        {
          glyph: glyphPath,
          name,
          category: dirName,
          code: getUnicode(name),
        },
      ];
      if (aliases[name]) {
        aliases[name].forEach((aliasName) => {
          iconDefinitions.push({
            glyph: glyphPath,
            name: aliasName,
            category: dirName,
            code: getUnicode(aliasName),
          });
        });
      }
      return icons.concat(iconDefinitions);
    }, [])
  );
}, []);

fs.writeJsonSync(path.join(process.cwd(), 'svg/unicodeMap.json'), inUseMap, {
  spaces: 2,
});

module.exports = glyphsConfig;
