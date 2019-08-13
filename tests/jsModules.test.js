import path from 'path';
import fs from 'fs-extra';
import React from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { generateImage } from 'jsdom-screenshot';
import camelCase from 'lodash/camelCase';
import { tcColor, jsImageFilename } from '../scripts/constants';

describe('Visual Regression Testing on Icons', () => {
  let div;
  beforeAll(() => {
    document.body.style.padding = '0';
    document.body.style.margin = '0';
    document.body.style.fontFamily =
      '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol';
  });
  beforeEach(() => {
    div = document.createElement('div');
    document.body.appendChild(div);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(div);
    document.body.removeChild(div);
  });

  const jsExportFiles = fs.readdirSync(path.resolve(process.cwd(), 'js'));
  const columns = 8;
  const columnWidth = 180;
  const fontSize = 24;
  const gutter = 10;
  const textHeight = fontSize;
  const iconMultiplier = 4;

  test('should render all icons', async () => {
    const icons = jsExportFiles
      .filter((filename) => filename.indexOf('index') !== 0)
      .map((filename) => require(`../js/${filename}`));
    ReactDOM.render(
      <div style={{ fontSize: `${fontSize}px` }}>
        {icons.map(({ prefix, definition, iconName }) => (
          <div
            key={iconName}
            style={{
              display: 'inline-flex',
              flex: '1 1 100%',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              width: columnWidth,
              padding: gutter,
              boxSizing: 'border-box'
            }}
          >
            <FontAwesomeIcon
              icon={definition}
              color={tcColor}
              size={`${iconMultiplier}x`}
            />
            {process.env.NODE_ENV === 'docs' ? (
              <div
                style={{
                  marginTop: gutter,
                  display: 'flex',
                  fontSize: textHeight,
                  lineHeight: `${textHeight}px`,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span
                  style={{ display: 'inline-flex', wordBreak: 'break-all' }}
                >
                  {camelCase(`${prefix}-${iconName}`)}
                </span>
              </div>
            ) : null}
          </div>
        ))}
      </div>,
      div
    );

    const rowHeight = fontSize * iconMultiplier + gutter * 4 + textHeight + 4;

    const screenshot = await generateImage({
      launch: {
        defaultViewport: {
          width: columnWidth * columns,
          height: Math.ceil(icons.length / columns) * rowHeight + 20
        }
      }
    });

    expect(screenshot).toMatchImageSnapshot({
      customSnapshotIdentifier: jsImageFilename
    });
  });
});
