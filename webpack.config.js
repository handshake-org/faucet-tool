'use strict'

const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  target: 'web',
  entry: {
    'bmonic': ['babel-polyfill', './bmonic']
  },
  output: {
    library: 'bmonic',
    libraryTarget: 'umd',
    path: __dirname,
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
  watch: true,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },
  node: {
    Buffer: true
  }

}
