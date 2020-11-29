const express = require('express')
const fs = require('fs')
const server = express()
const PORT = 3000

const vueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync('./index.template.html', 'utf-8')
const renderer = vueServerRenderer.createRenderer({
  template: template
})

const { createApp } = require('./render-server.js')

// 异步获取数据的 api
server.get('/api/list', (req, res) => {
  res.status(200)
  res.set('Content-Type', 'application/json')
  res.send(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
})

/**
 * 坑一：
 * 当在 /list/99 页面刷新时，会请求 /list/render-client.js
 * 所以此处 get url 应该要用正则匹配，不然直接 get(/render-client.js, fn) 会导致浏览器 script 解析错误：
 * render-client.js: Uncaught SyntaxError: Unexpected token '<'
 */
server.get('/*render-client.js$/', (req, res) => {
  const js = fs.readFileSync('./render-client.js')
  res.status(200)
  res.send(js)
})

server.get('*', (req, res) => {
  const { app, router, store } = createApp()

  router.push(req.url).catch(() => {})
  router.onReady(() => {
    const matchedComponents = router.getMatchedComponents()

    if (!matchedComponents.length) {
      res.status(404).end('Not Found!')
    }
    /**
     * 坑二：
     * 按照 vue ssr 官网上直接写 Component.asyncData, 会获取不到值 undefined，
     * 通过打印出来 Component，发现挂载在 Componet.options.asyncData
     */
    Promise.all(matchedComponents.map(Component => {
      if (Component.options.asyncData) {
        return Component.options.asyncData({
          store,
          route: router.currentRoute
        })
      }
    }))
    .then(() => {
      // 在预取数据后，同步最新的 state 
      const context = {
        state: store.state
      }
      renderer.renderToString(app, context).then(html => {
        res.status(200)
        res.set('Content-Type', 'text/html')
        res.send(html)
      }, (err) => {
        res.status(500).end('Internal Server renderToString', err)
      })
    })
    .catch((err) => {
      res.status(500).end('Internal Server asyncData', err)
    })
  })
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})