const cp = require('child_process');
const fs = require('fs');
const {
  JS_IMAGE_FILENAME,
  CSS_IMAGE_FILENAME
} = require('../scripts/constants');

const docsImages = [
  JS_IMAGE_FILENAME,
  CSS_IMAGE_FILENAME
];

const modifiedImages = cp
  .spawnSync('git', ['diff HEAD~1 HEAD', '--name-status', '--cached'], { encoding: 'utf8' })
  .output[1]
  .split('\n')
  .filter((filePath) =>
    docsImages.find((imgName) =>
      filePath.includes(imgName)
    )
  );

describe('readme images', () => {
  test('Should have generated two documentation images and commited then in the PR', () => {
    expect(modifiedImages).toHaveLength(2);
  });
});
