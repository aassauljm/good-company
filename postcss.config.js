module.exports = {
  parser: 'sugarss',
  plugins: {
    'postcss-import': {},
    'postcss-cssnext': {},
    'autoprefixer': {browsers: ['> 0.01%', 'ie 8-10']},
    'cssnano': {}
  }
}