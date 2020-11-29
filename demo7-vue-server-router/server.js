const express = require('express')
const fs = require('fs')
const server = express()
const PORT = 3000

const vueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync('./index.template.html', 'utf-8')
const renderer = vueServerRenderer.createRenderer({
  template: template
})

const { app, router } = require('./render-server.js')

server.get('/render-client.js', (req, res) => {
  const js = fs.readFileSync('./render-client.js')
  res.status(200)
  res.send(js)
})

server.get('*', (req, res) => {
  /**
   * 确保页面刷新时，渲染当前路由下的页面，返回给客户端
   * router.push 确保当前服务器创建的 vue 应用切换到对应路由的组件上
   * 关于 router 相关API，查看 vue-router 官方文档
   */
  router.push(req.url).catch(()=>{}) // 坑：vue-router 2.x 升级后，需要增加 catch 捕获，不然重复刷新页面会报错
  router.onReady(() => {
    const matchedComponents = router.getMatchedComponents()

    if (!matchedComponents.length) {
      res.status(404).end('Not Found!')
    }

    renderer.renderToString(app).then(html => {
      res.status(200)
      res.set('Content-Type', 'text/html')
      res.send(html)
    }).catch(err => {
      console.log(err);
      res.status(500).end('renderToString Error', err)
    })
    
  }, (err) => {
    res.status(500).end('Internal Server Error', err)
  })
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})