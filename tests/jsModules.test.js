import path from 'path';
import fs from 'fs-extra';
import React from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { generateImage } from 'jsdom-screenshot';

describe('Visual Regression Testing on Icons', () => {
  let div;
  beforeEach(() => {
    div = document.createElement('div');
    document.body.appendChild(div);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(div);
    document.body.removeChild(div);
  });

  const jsExportFiles = fs.readdirSync(path.resolve(process.cwd(), 'js'));

  test.each(
    jsExportFiles
      .filter((filename) => filename.indexOf('index') !== 0)
      .map((filename) => [filename])
  )('should render %s', async (filename) => {
    const { definition } = require(`../js/${filename}`);
    ReactDOM.render(
      <div style={{ fontSize: '24px' }}>
        <FontAwesomeIcon icon={definition} color="blue" size="10x" />
      </div>,
      div
    );

    // Take screenshot with generateImage()
    const screenshot = await generateImage({
      launch: {
        defaultViewport: { width: 300, height: 300 }
      }
    });
    // and compare it to the previous sceenshot with toMatchImageSnapshot()
    expect(screenshot).toMatchImageSnapshot();
  });
});
