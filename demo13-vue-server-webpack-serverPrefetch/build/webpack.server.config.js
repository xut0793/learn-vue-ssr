const path = require('path')

/**
 * 由于使用了 .vue 文件，所以需要使用 vue-loader
 */
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: path.resolve(__dirname, '../entry-server.js'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'built-server-bundle.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  target: 'node',
  plugins: [
    new VueLoaderPlugin()
  ]
}