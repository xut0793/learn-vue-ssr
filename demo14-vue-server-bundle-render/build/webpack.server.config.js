const path = require('path')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: path.resolve(__dirname, '../entry-server.js'),
  output: {
    path: path.resolve(__dirname, '../dist/server'),
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
  devtool: 'source-map',
  plugins: [
    new VueSSRServerPlugin(),
    new VueLoaderPlugin()
  ]
}