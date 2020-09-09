const fs = require('fs-extra');
const { JSDOM } = require('jsdom');
const path = require('path');
const glob = require('glob');
const React = require('react');
const ReactDOM = require('react-dom');
const { FontAwesomeIcon } = require('@fortawesome/react-fontawesome');
const cheerio = require('cheerio');
const { generateImage } = require('jsdom-screenshot');
const camelCase = require('lodash/camelCase');
const startCase = require('lodash/startCase');
const {
  TC_COLOR,
  ICON_CLASSNAME_PREFIX,
  JS_IMAGE_FILENAME,
  CSS_IMAGE_FILENAME,
  ICONS_PER_ROW,
  COLUMNS,
  COLUMN_WIDTH,
  FONT_SIZE,
  HEADER_HEIGHT,
  HEADER_MARGIN,
  GUTTER,
  TEXT_HEIGHT,
  ICON_MULTIPLIER,
  PAGE_PADDING,
  ROW_HEIGHT,
} = require('./constants');

const DOCS_PATH = path.join(process.cwd(), 'docs');

const makeDocument = () => {
  const { window } = new JSDOM(
    '<!DOCTYPE html><body><div id="root"></div></body></html>'
  );
  const { document } = window;
  global.window = window;
  global.document = document;
  return document;
};

const generateCssFontImage = async () => {
  const document = makeDocument();
  const html = fs
    .readFileSync(path.resolve(process.cwd(), 'fonts/tablecheck-icons.html'))
    .toString();
  const $ = cheerio.load(html);
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
  height += Math.ceil(currentSectionIconsCount / ICONS_PER_ROW) * ROW_HEIGHT;

  // Take screenshot with generateImage()
  const screenshot = await generateImage({
    launch: {
      defaultViewport: { width: 1280, height },
    },
    serve: ['fonts'],
  });

  fs.writeFileSync(`${DOCS_PATH}/${CSS_IMAGE_FILENAME}`, screenshot);

  console.log('saved css font image');
};

const generateJsModulesImage = async () => {
  const document = makeDocument();
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
              `${ICON_CLASSNAME_PREFIX}-${path.parse(filename).name}`
            )}`)
          ),
      };
    });

  ReactDOM.render(
    <div style={{ fontSize: `${FONT_SIZE}px` }}>
      {sections.map(({ header, icons }) => (
        <div
          key={header}
          style={{
            margin: 0,
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
          }}
        >
          <h2
            style={{
              width: '100%',
              display: 'flex',
              height: HEADER_HEIGHT,
              fontSize: `${HEADER_HEIGHT}px`,
              lineHeight: `${HEADER_HEIGHT}px`,
              marginBottom: HEADER_MARGIN,
              marginLeft: HEADER_MARGIN,
              boxSizing: 'border-box',
            }}
          >
            {header}
          </h2>
          {icons.map(({ prefix, definition, iconName }) => (
            // ensure that the maxHeight and height match the FontAwesomeIcon size
            // this fixes a flexbox bug in jsdom
            <div
              key={iconName}
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: COLUMN_WIDTH,
                padding: GUTTER,
                boxSizing: 'border-box',
              }}
            >
              <FontAwesomeIcon
                icon={definition}
                color={TC_COLOR}
                size={`${ICON_MULTIPLIER}x`}
                style={{ maxHeight: 64, height: 64 }}
              />
              <div
                style={{
                  marginTop: GUTTER,
                  display: 'flex',
                  fontSize: TEXT_HEIGHT,
                  lineHeight: `${TEXT_HEIGHT}px`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    wordBreak: 'break-all',
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
    document.getElementById('root')
  );

  const rowHeight = FONT_SIZE * ICON_MULTIPLIER + GUTTER * 4 + TEXT_HEIGHT + 4;

  const height = sections.reduce((result, { icons }) => {
    return (
      result +
      HEADER_HEIGHT +
      HEADER_MARGIN +
      Math.ceil(icons.length / COLUMNS) * rowHeight +
      20
    );
  }, 0);

  const screenshot = await generateImage({
    launch: {
      defaultViewport: {
        width: COLUMN_WIDTH * COLUMNS,
        height,
      },
    },
  });

  fs.writeFileSync(`${DOCS_PATH}/${JS_IMAGE_FILENAME}`, screenshot);

  console.log('saved js modules image');
};

fs.ensureDirSync(DOCS_PATH);

generateCssFontImage();
generateJsModulesImage();
