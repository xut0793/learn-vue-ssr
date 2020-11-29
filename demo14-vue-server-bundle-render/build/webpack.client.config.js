const webpack = require('webpack')
const path = require('path')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: {
    app: path.resolve(__dirname, '../entry-client.js')
  },
  output: {
    path: path.resolve(__dirname, '../dist/client'),
    publicPath: '/dist/',
    filename: '[name].[chunkhash:8].js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "manifest",
      minChunks: Infinity
    }),
    new VueSSRClientPlugin(),
    new VueLoaderPlugin()
  ]
}