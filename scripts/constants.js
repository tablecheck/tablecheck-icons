module.exports = {
  prefix: 'tci',
  tcColor: '#7e5bef',
  jsImageFilename: `${
    process.env.NODE_ENV === 'docs' ? `docs-` : ''
  }js-export-visual-regression-test`,
  cssImageFilename: `${
    process.env.NODE_ENV === 'docs' ? `docs-` : ''
  }icon-font-visual-regression-test`
};
