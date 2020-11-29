const express = require('express')
const fs = require('fs')
const server = express()
const PORT = 8000

const vueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync('./index.template.html', 'utf-8')
const renderer = vueServerRenderer.createRenderer({
  template: template
})

// const { createApp } = require('./entry-server.js')
const { createApp } = require('./dist/built-server-bundle.js')

/**
 * serverPrefetch api 请求
 */
server.get('/api/list', (req, res) => {
  console.log('api list');
  res.status(200)
  res.set('Content-Type', 'application/json')
  res.send(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
})

/**
 * script 资源请求
 */
server.get('/*built-client-bundle.js$/', (req, res) => {
  const js = fs.readFileSync('./dist/built-client-bundle.js')
  res.status(200)
  res.send(js)
})

/**
 * favicon.ico 图标请求
 */
server.get('/favicon.ico', (req, res) => {
  res.end()
})

/**
 * 页面请求
 */
server.get('*', (req, res) => {
  console.log('page url', req.url);
  const context = {
    url: req.url
  }

  createApp(context).then(app => {
    if (app) {
      renderer.renderToString(app, context).then(html => {
        res.status(200)
        res.set('Content-Type', 'text/html')
        res.send(html)
      }).catch(err => {
        console.log('renderToString error', err);
        res.status(500).end('Internal Server renderToString')
      })
    }
  }).catch(err => {
    console.log('createApp error', err);
    res.status(500).end('Internal Server createApp')
  })
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})