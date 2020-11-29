const express = require('express')
const fs = require('fs')
const Vue = require('vue')
const vueServerRenderer = require('vue-server-renderer')

const template = fs.readFileSync('./index.template.html', 'utf-8')
const rendererWithTemplate = vueServerRenderer.createRenderer({
  template: template
})

const server = express()
const PORT = 3000

server.get('/', (req, res) => {
  const vueApp = new Vue({
    data: {
      title: 'Hello Vue SSSR -- event -- counter',
      count: 0
    },
    methods: {
      minus() {
        this.count -= 1
      },
      plus() {
        this.count += 1
      }
    },
    // $mount 的挂载点添加到这里 id="app"
    template: `<div id="app">
      <h1>{{ title }}</h1>
      <div>
        <button @click="minus">minus</button>
        <span>{{ count }}</span>
        <button @click="plus">plus</button>
      </div>
    </div>`
  })
  
  rendererWithTemplate.renderToString(vueApp).then(html => {
    res.status(200)
    res.set('Content-Type', 'text/html')
    res.send(html)
  }).catch(err => {
    console.log(err);
    res.status(500).end('Internal Server Error', err)
  })
})

server.get('/render-client.js', (req, res) => {
  const js = fs.readFileSync('./render-client.js')
  res.status(200)
  res.send(js)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})