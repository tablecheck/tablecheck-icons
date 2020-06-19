import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import React from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { generateImage } from 'jsdom-screenshot';
import camelCase from 'lodash/camelCase';
import startCase from 'lodash/startCase';
import { tcColor, jsImageFilename, prefix } from '../scripts/constants';
import { getOrderedPages, ICONS_PER_ROW } from '../scripts/getOrderedPages';

describe('Visual Regression Testing on JS Icons', () => {
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

  const columns = ICONS_PER_ROW * 2;
  const columnWidth = 180;
  const fontSize = 24;
  const headerHeight = 42;
  const headerMargin = 24;
  const gutter = 10;
  const textHeight = fontSize;
  const iconMultiplier = 4;

  if (process.env.NODE_ENV === 'docs') {
    test('should render all icons', async () => {
      const sections = fs
        .readdirSync(path.join(process.cwd(), 'svg'), { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((folder) => {
          const { name: folderName } = folder;
          const svgFiles = glob.sync(
            path.join(process.cwd(), 'svg', folderName, '*.svg')
          );
          return {
            header: startCase(folderName),
            icons: svgFiles
              .sort()
              .map((filename) =>
                require(`../js/${camelCase(
                  `${prefix}-${path.parse(filename).name}`
                )}`)
              )
          };
        });
      ReactDOM.render(
        <div style={{ fontSize: `${fontSize}px` }}>
          {sections.map(({ header, icons }) => (
            <div
              key={header}
              style={{
                margin: 0,
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'flex-start'
              }}
            >
              <h2
                style={{
                  width: '100%',
                  display: 'flex',
                  height: headerHeight,
                  fontSize: `${headerHeight}px`,
                  lineHeight: `${headerHeight}px`,
                  marginBottom: headerMargin,
                  marginLeft: headerMargin,
                  boxSizing: 'border-box'
                }}
              >
                {header}
              </h2>
              {icons.map(({ prefix, definition, iconName }) => (
                <div
                  key={iconName}
                  style={{
                    display: 'inline-flex',
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
                      style={{
                        display: 'inline-flex',
                        wordBreak: 'break-all'
                      }}
                    >
                      {camelCase(`${prefix}-${iconName}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>,
        div
      );

      const rowHeight = fontSize * iconMultiplier + gutter * 4 + textHeight + 4;

      const height = sections.reduce((result, { icons }) => {
        return (
          result +
          headerHeight +
          headerMargin +
          Math.ceil(icons.length / columns) * rowHeight +
          20
        );
      }, 0);

      const screenshot = await generateImage({
        launch: {
          defaultViewport: {
            width: columnWidth * columns,
            height
          }
        }
      });

      expect(screenshot).toMatchImageSnapshot({
        customSnapshotIdentifier: jsImageFilename
      });
    }, 10000);
  } else {
    const iconPages = getOrderedPages((filename) =>
      require(`../js/${camelCase(filename)}`)
    );
    test.each(iconPages)(
      'should render page %f of 10 icons',
      async (pageNumber, pageIcons) => {
        ReactDOM.render(
          <div style={{ fontSize: `${fontSize}px`, paddingTop: 20 }}>
            {pageIcons.map(({ definition, iconName }) => (
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
              </div>
            ))}
          </div>,
          div
        );

        const rowHeight =
          fontSize * iconMultiplier + gutter * 4 + textHeight + 4;

        const screenshot = await generateImage({
          launch: {
            defaultViewport: {
              width: columnWidth * ICONS_PER_ROW,
              height: Math.ceil(pageIcons.length / columns) * rowHeight + 20
            }
          }
        });

        expect(screenshot).toMatchImageSnapshot({
          customSnapshotIdentifier: `${jsImageFilename}-page-${pageNumber}`
        });
      },
      10000
    );
  }
});
