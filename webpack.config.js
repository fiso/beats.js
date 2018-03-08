const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/beats.js',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'beats.js',
    pathinfo: true,
    library: 'beats.js',
    libraryTarget: 'umd',
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['env'],
        },
      },
    ],
  },
  stats: {
    colors: true,
  },
};
