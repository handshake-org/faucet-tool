'use strict'

const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  target: 'web',
  entry: {
    'faucetTool': ['babel-polyfill', './index']
  },
  output: {
    library: 'faucetTool',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'browser/js'),
    filename: '[name].bundle.js'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['-browser.js', '.js', '.json']
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader'
    }]
  },
  plugins: [
    new UglifyJsPlugin()
  ],
  watch: false,
  node: {
    Buffer: true
  }
}
