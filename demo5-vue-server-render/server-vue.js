/**
 * 1. 使用 Vue 生成一个组件构造器
 * 2. 使用 vue-server-renderer 将当前的组件构造器渲染成一段 html 片段的字符串，返回给浏览器渲染器渲染
 * 此时 vue-server-renderer 类似于 ejs 一样的模板引擎作用
 */
const express = require('express')
const Vue = require('vue')
const vueServerRenderer = require('vue-server-renderer')
const renderer = vueServerRenderer.createRenderer()
const PORT = 3000

const server = express()
/**
 * 一：
 * 此时直接返回的就是 template 结构渲染出的字符串：
 * <div data-server-rendered="true"><h1>Hello Vue SSSR</h1></div>
 * 并没有包含标准的HTML结构：html - head -body
 * 另外注意一点：由 vue-server-renderer 渲染出的应用根节点上会自动添加 vue 服务端渲染的标志属性：data-server-rendered="true"
 */
server.get('/', (req, res) => {
  const vueApp = new Vue({
    data: {
      title: 'Hello Vue SSSR --fragments'
    },
    template: `<div>
      <h1>{{ title }}</h1>
    </div>`
  })
  
  renderer.renderToString(vueApp).then(htmlStr => {
    res.status(200)
    res.set('Content-Type', 'text/html')
    res.send(htmlStr)
  }).catch(err => {
    res.status(500).end('Internal Server Error')
  })
})

/**
 * 二：
 * 可以使用模板字符串拼接出HTML结构标签
 */
server.get('/html', (req, res) => {
  const vueApp = new Vue({
    data: {
      title: 'Hello Vue SSSR -- html'
    },
    template: `<div>
      <h1>{{ title }}</h1>
    </div>`
  })
  
  renderer.renderToString(vueApp).then(htmlStr => {
    res.status(200)
    res.set('Content-Type', 'text/html')

    const html = `<!DOCTYPE html>
    <html lang="en">
      <head><title>vue-ssr-html</title></head>
      <body>
        ${htmlStr}
      </body>
    </html>`
    res.send(html)
  }).catch(err => {
    res.status(500).end('Internal Server Error')
  })
})

/**
 * 三:
 * 提供一个 html 模板，用于 vueServerRender 将渲染出的 html 片段字符串插入到模板指定位置中返回
 * 模板中提供的插入内容的位置标识是：<!--vue-ssr-outlet-->
 */
const fs = require('fs')
const template = fs.readFileSync('./index.template.html', 'utf-8')
const rendererWithTemplate = vueServerRenderer.createRenderer({
  template: template
})
server.get('/tmp', (req, res) => {
  const vueApp = new Vue({
    data: {
      title: 'Hello Vue SSSR -- tmplate'
    },
    template: `<div>
      <h1>{{ title }}</h1>
    </div>`
  })
  
  rendererWithTemplate.renderToString(vueApp).then(html => {
    res.status(200)
    res.set('Content-Type', 'text/html')
    res.send(html)
  }).catch(err => {
    res.status(500).end('Internal Server Error')
  })
})

/**
 * 四：
 * 以上吐给浏览器渲染的都是静态内容，下面测试下返回一个包含事件的计数器 Vue 组件能否有效
 * 
 * 事实证明，计数器只是视图渲染成功，点击事件并没有生效。
 * 因为 Vue SSR 中的 renderer 只负责把当前状态下 Vue 组件渲染成html片段字符串供浏览器渲染
 * 而相关的事件，以及事件触发响应式更新视图的功能仍然需要客户端提供，这就是同构。
 * 简单理解 SSR 同构就是服务端和客户需要同时渲染当前状态的页面，服务端渲染的部分相当于当前数据状态下页面的一个快照，
 * 返给浏览器仍然需要由客户端来激活相关事件和响应式更新功能
 * 
 */
server.get('/event', (req, res) => {
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
    template: `<div>
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
    res.status(500).end('Internal Server Error')
  })
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})