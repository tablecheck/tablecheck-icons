const fs = require('fs-extra');
const path = require('path');
const { jsImageFilename, cssImageFilename } = require('../scripts/constants');

const diffOutputDir = path.join(process.cwd(), 'tests/__image_snapshots__');

fs.ensureDir(path.join(process.cwd(), 'docs'));
fs.moveSync(
  path.join(diffOutputDir, `${jsImageFilename}-snap.png`),
  'docs/js-modules.png',
  { overwrite: true }
);
fs.moveSync(
  path.join(diffOutputDir, `${cssImageFilename}-snap.png`),
  'docs/css-font.png',
  { overwrite: true }
);
