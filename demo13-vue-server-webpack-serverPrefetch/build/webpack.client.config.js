const path = require('path')
/**
 * vue-loader 要解析 SFC（单文件组件，即 .vue），依赖于 vue-template-compiler 包，它用来解析模板
 */
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: path.resolve(__dirname, '../entry-client.js'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'built-client-bundle.js'
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
    new VueLoaderPlugin()
  ]
}