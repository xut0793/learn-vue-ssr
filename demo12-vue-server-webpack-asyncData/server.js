const fs = require('fs')
const path = require('path')
const express = require('express')
const server = express()
const PORT = 3000

const vueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync(path.resolve(__dirname, './index.template.html'), 'utf-8')
const renderer = vueServerRenderer.createRenderer({
  template: template
})
const { _createApp:createApp } = require('./dist/server/server-app.js')

server.get('/api/list', (req, res) => {
  console.log('api', req.url);
  res.status(200)
  res.set('Content-Type', 'application/json')
  res.send(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
})

/**
 * 坑：
 * 当在 /list/99 页面刷新时，会请求 /list/render-client.js
 * 所以此处 get url 应该要用正则匹配，不然直接 get(/render-client.js, fn) 会导致浏览器 script 解析错误：
 * render-client.js: Uncaught SyntaxError: Unexpected token '<'
 */
server.get('/*render-client.js$/', (req, res) => {
  const js = fs.readFileSync('./render-client.js')
  res.status(200)
  res.send(js)
})

server.get('/favicon.ico', (req, res) => {
  res.end()
})

server.get('*', (req, res) => {
  const context = {
    url: req.url
  }
  createApp(context).then(({App, store}) => {
    console.log('created app', store.state);
    return renderer.renderToString({ state: store.state})
  }).then(html => {
    res.status(200)
    res.set('Content-Type', 'text/html')
    res.send(html)
  }).catch((err) => {
    console.log(err);
    res.status(500).send('Internal Server Error')
})
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})