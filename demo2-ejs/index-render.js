/**
 * 将 ejs.render 渲染功能集成到 express 模板引擎功能中
 */
const express = require('express')
// const ejs = require('ejs')
// const fs = requier('fs')
const PORT = 3002

const server = express()
// 1. 设置 server 的模板引擎为 ejs
server.set('view engine', 'ejs')

// 2. 设置ejs模板文件目录，默认是根目录下的 view 文件夹下寻找模板文件
server.set('views', __dirname)

// 3. 在路由中调用 res.render 方法渲染 html 返回
const data = {
  title: 'demo2: ejs 与 express 集成渲染返回',
  list: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
}
server.get('/', (req, res) => {
  res.status(200)
  res.set('Content-Type', 'text/html')
  res.render('index-template', data)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})