const fs = require('fs')
const path = require('path')
const express = require('express')
const server = express()
const PORT = 3000

const VueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync(path.join(process.cwd(), './index.template.html'), 'utf-8')
const serverBundle = require('./dist/server/vue-ssr-server-bundle.json')
const clientManifest = require('./dist/client/vue-ssr-client-manifest.json')
const renderer = VueServerRenderer.createBundleRenderer(serverBundle, {
  runInNewContext: false,
  template,
  clientManifest
})

// 注册中间件，添加静态文件服务
server.use('/dist', express.static(path.resolve(__dirname, './dist/client/')));

// 异步数据请求接口
server.get('/api/list', (req, res) => {
  console.log('api', req.url);
  res.status(200)
  res.set('Content-Type', 'application/json')
  res.send(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
})

server.get('/favicon.ico', (req, res) => {
  res.end()
})

server.get('*', (req, res) => {
  const context = {url: req.url}
  /**
   * 使用 bundle renderer 之后，会自动完成 createApp 的调用
   */
  // createApp(context).then(app => {
  //   if (app) {
  //     renderer.renderToString(app, context).then(html => fn)
  //   }
  // })
  renderer.renderToString(context)
  .then(html => {
    res.status(200)
    res.set('Content-Type', 'text/html')
    res.send(html)
  }).catch((err) => {
    console.error(err);
    res.status(500).end('Internal Server')
  })
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})