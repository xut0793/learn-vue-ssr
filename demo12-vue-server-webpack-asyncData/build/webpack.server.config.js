const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: {
    'server-app': path.resolve(__dirname, "../entry-server.js")
  },
  output: {
    path: path.resolve(__dirname, '../dist/server'),
    filename: '[name].js',
    libraryTarget: 'commonjs2', // 指定为 Node 模块规范
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  target: 'node', // 指定 node 平台下运行
  plugins: [
    new VueLoaderPlugin()
  ]
}