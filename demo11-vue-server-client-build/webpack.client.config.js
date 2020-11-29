const path = require('path')

module.exports = {
  entry: {
    'client-app-bundle': path.resolve(__dirname, './entry-client.js')
  },
  output: {
    path: path.resolve(__dirname),
    publicPath: '/',
    filename: '[name].js',
  },
  resolve: {
    alias: {
        // 坑：
        // vue 的构建版本大体分为两种：只包含运行时的版本 和 运行时 + 模板编译器的完整版，
        // 而在node_modules/vue/package.json/ 中 main 字段默认是 vue.runtime.esm.js, 即只含运行时的版本，这个版本无法在浏览器客户端运行，
        // 所以在打包时需要指明让 webpack 打包包含编译器的完整版进行构建。 
        // vue-router / vuex 是因为模块规范问题，默认是 comonJS 规范的包，所以需要指定构建 esm 或 UMD 的包。

        // resolve.alias 就可以指定 webpack 在构建时从哪个路径中解析依赖包

        'vue$': 'vue/dist/vue.js',
        'vue-router$': 'vue-router/dist/vue-router.js',
        'vuex$': 'vuex/dist/vuex.js'
    }
  }
}