const colors = require('colors');
const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const execSync = require('child_process').execSync;
const { prefix } = require('./constants');

console.log(colors.blue('Generating Font Files'));

const dirList = fs.readdirSync(path.join(process.cwd(), 'svg'));

const glyphsConfig = dirList.reduce((glyphs, dirName) => {
  const iconCodes = require(path.join(
    process.cwd(),
    'svg',
    dirName,
    'icon-codes.json'
  ));
  return glyphs.concat(
    Object.keys(iconCodes).map((name) => {
      if (iconCodes[name] instanceof Array) {
        return {
          glyph: path.join(
            process.cwd(),
            'svg',
            dirName,
            `${iconCodes[name][0]}.svg`
          ),
          name,
          code: iconCodes[name][1]
        };
      }
      return {
        glyph: path.join(process.cwd(), 'svg', dirName, `${name}.svg`),
        name,
        code: iconCodes[name]
      };
    })
  );
}, []);

const outputName = 'tablecheck-icons';
const formats = ['svg', 'ttf', 'eot', 'woff'];

const yamlDoc = {
  font: formats.reduce(
    (font, formatKey) => {
      font[formatKey] = `${outputName}.${formatKey}`;
      return font;
    },
    {
      name: outputName,
      prefix,
      fixedwidth: false,
      height: 512
    }
  )
};
const configPath = path.join(process.cwd(), 'glyphs2font.yml');

yamlDoc.glyphs = glyphsConfig;
fs.writeFileSync(configPath, yaml.safeDump(yamlDoc));

execSync(`./node_modules/.bin/glyphs2font ${configPath}`);

fs.removeSync(configPath);
formats.forEach((formatKey) => {
  const outputPath = path.join(process.cwd(), `${outputName}.${formatKey}`);
  fs.moveSync(
    outputPath,
    path.join(process.cwd(), `fonts/${outputName}.${formatKey}`),
    { overwrite: true }
  );
  fs.removeSync(outputPath);
});

console.log(
  colors.green(
    `Font Files Generated into ${path.join(process.cwd(), 'fonts/')}`
  )
);
