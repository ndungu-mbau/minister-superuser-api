const path = require('path');
const webpack = require('webpack');
const fs = require('fs');

const nodeModules = {};
fs
  .readdirSync('node_modules')
  .filter(x => ['.bin'].indexOf(x) === -1)
  .forEach((mod) => {
    nodeModules[mod] = `commonjs ${mod}`;
  });

module.exports = {
  mode: 'development',
  entry: ['babel-polyfill','./src'],
  target: 'node',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'bin'),
    filename: 'index.js',
  },
  externals: nodeModules,
  plugins: [
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader'
      },
    ],
  },
  stats: {
    colors: true,
  },
};
