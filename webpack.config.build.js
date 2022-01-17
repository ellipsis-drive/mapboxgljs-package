const path = require('path');

module.exports = {
  entry: './src/lib/index.js',
  output: {
    publicPath: '',
    path: path.resolve(__dirname, 'build'),
    library: {
      name: 'mapboxgljsEllipsis',
      type: 'umd'
    },
    filename: 'mapboxgljs-ellipsis.js',
  },
  mode: 'production',
  externals: {
    'ellipsis-js-util': 'ellipsis-js-util'
  }
};