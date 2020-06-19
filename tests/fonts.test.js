import path from 'path';
import fs from 'fs-extra';
import React from 'react';
import cheerio from 'cheerio';
import { generateImage } from 'jsdom-screenshot';
import { cssImageFilename } from '../scripts/constants';
import { getOrderedPages, ICONS_PER_ROW } from '../scripts/getOrderedPages';

const PAGE_PADDING = 200;
const ROW_HEIGHT = 52;

describe('Visual Regression Testing on CSS/HTML + fonts', () => {
  let html;
  html = fs
    .readFileSync(path.resolve(process.cwd(), 'fonts/tablecheck-icons.html'))
    .toString();
  const $ = cheerio.load(html);

  if (process.env.NODE_ENV === 'docs') {
    test('should render all icons', async () => {
      document.documentElement.innerHTML = html;

      const items = $('.sample > *');
      let height = PAGE_PADDING;
      let currentSectionIconsCount = 0;
      for (let i = 0; i < items.length; i += 1) {
        if (items.get(i).tagName === 'h2') {
          height += 80;
          height +=
            Math.ceil(currentSectionIconsCount / ICONS_PER_ROW) * ROW_HEIGHT;
          currentSectionIconsCount = 0;
        } else {
          currentSectionIconsCount += 1;
        }
      }
      height +=
        Math.ceil(currentSectionIconsCount / ICONS_PER_ROW) * ROW_HEIGHT;

      // Take screenshot with generateImage()
      const screenshot = await generateImage({
        launch: {
          defaultViewport: { width: 1280, height }
        },
        serve: ['fonts']
      });
      // and compare it to the previous sceenshot with toMatchImageSnapshot()
      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: cssImageFilename
      });
    }, 20000);
  } else {
    const iconPages = getOrderedPages((iconName) =>
      $(`.${iconName}`)
        .parent()
        .clone()
    );

    test.each(iconPages)(
      'should render page %f of 8 icons',
      async (pageNumber, pageIcons) => {
        const clone$ = cheerio.load($.html());
        const wrapper = clone$('.sample');
        wrapper.empty();
        pageIcons.forEach((icon) => {
          wrapper.append(icon);
        });
        clone$('h1, h2, span').remove();
        html = clone$.html();

        document.documentElement.innerHTML = html;

        // Take screenshot with generateImage()
        const screenshot = await generateImage({
          launch: {
            defaultViewport: {
              width: 640,
              height: ROW_HEIGHT * 2
            }
          },
          serve: ['fonts']
        });
        // and compare it to the previous sceenshot with toMatchImageSnapshot()
        expect(screenshot).toMatchImageSnapshot({
          customSnapshotIdentifier: `${cssImageFilename}-${pageNumber}`
        });
      },
      10000
    );
  }
});
