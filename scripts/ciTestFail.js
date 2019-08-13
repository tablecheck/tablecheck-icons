const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');

const diffOutputDir = path.join(
  process.cwd(),
  'tests/__image_snapshots__/__diff_output__'
);

// Check if any diffs failed and upload them to temporary
if (fs.existsSync(diffOutputDir)) {
  const failedFiles = fs.readdirSync(diffOutputDir);
  failedFiles.forEach((fileName) => {
    const form = new FormData();
    form.append(
      'file',
      fs.createReadStream(path.join(diffOutputDir, fileName))
    );
    form.submit('https://file.io/?expires=1', (err, res) => {
      res.on('readable', () => {
        const body = res.read().toString();
        try {
          const { link, expiry } = JSON.parse(body);
          console.log(
            `Image Diff for "${fileName}"; ${link} (Expires in ${expiry})`
          );
        } catch (e) {}
      });
    });
  });
}
