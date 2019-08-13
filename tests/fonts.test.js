import path from 'path';
import fs from 'fs-extra';
import React from 'react';
import cheerio from 'cheerio';
import { generateImage } from 'jsdom-screenshot';
import { cssImageFilename } from '../scripts/constants';

test('Visual Regression Testing on CSS/HTML + fonts', async () => {
  let html = fs
    .readFileSync(path.resolve(process.cwd(), 'fonts/tablecheck-icons.html'))
    .toString();
  if (process.env.NODE_ENV !== 'docs') {
    const $ = cheerio.load(html);
    $('h1, h2, span').remove();
    html = $.html();
  }
  document.documentElement.innerHTML = html;

  // Take screenshot with generateImage()
  const screenshot = await generateImage({
    launch: {
      defaultViewport: { width: 1280, height: 1280 }
    },
    serve: ['fonts']
  });
  // and compare it to the previous sceenshot with toMatchImageSnapshot()
  expect(screenshot).toMatchImageSnapshot({
    customSnapshotIdentifier: cssImageFilename
  });
}, 10000);
