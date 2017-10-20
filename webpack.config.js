const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/beats.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'beats.bundle.js',
    pathinfo: true,
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