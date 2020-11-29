const express = require('express')
const fs = require('fs')
const server = express()
const PORT = 3000

const vueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync('./index.template.html', 'utf-8')
const renderer = vueServerRenderer.createRenderer({
  template: template
})

// 第一种情形：所有请求共享同一个应用 app，很容易导致交叉请求状态污染 (cross-request state pollution)。
// const { app, router, store } = require('./render-server.js')

// 第二种情形：为了避免数据状态单例的情况，使用 createApp 工厂函数，为每一次请求创建一个独立的应用 app
const { createApp } = require('./render-server.js')

server.get('/render-client.js', (req, res) => {
  const js = fs.readFileSync('./render-client.js')
  res.status(200)
  res.send(js)
})

server.get('*', (req, res) => {
  // 为每个请求创建一个新的应用实例
  const { app, router, store } = createApp()

  router.push(req.url).catch(() => {})
  router.onReady(() => {
    const matchedComponents = router.getMatchedComponents()

    if (!matchedComponents.length) {
      res.status(404).end('Not Found!')
    }

    /**
     * 每次请求服务端渲染时加 200，目的有两个：
     * 1. 验证数据状态单例的问题: 每请求一次，初始值加 200。
     * 2. 验证浏览器打开的页面显示 200，并且页面请求返回的 window.__INITIAL_STATE__.state.count 为 2000，说明页面渲染是使用服务端渲染，而不是客户端作用的。
     */
    store.commit('increase', 200)
    /**
     * 服务器渲染时触发 store 更新后的 state 需要通过 renderToString 的第二个参数传入，定义一个renderer渲染的上下文对象 context
     * 此时 renderToString 内部会通过 renderState 方法
     * 在上述创建 renderer 时传入的 index.template.html 中自动添加一段 script 代码:
     * <script>window.____INITIAL_STATE__ = context.state;</script>
     */

    // vue-server-renderer 关于关于同步 state 的源码:
    // TemplateRenderer.prototype.renderState = function renderState (context, options) {
    //   var ref = options || {};
    //   var contextKey = ref.contextKey; if ( contextKey === void 0 ) contextKey = 'state';
    //   var windowKey = ref.windowKey; if ( windowKey === void 0 ) windowKey = '__INITIAL_STATE__';
    //   var state = this.serialize(context[contextKey]);
    //   var autoRemove = '';
    //   var nonceAttr = context.nonce ? (" nonce=\"" + (context.nonce) + "\"") : '';
    //   return context[contextKey] ? ("<script" + nonceAttr + ">window." + windowKey + "=" + state + autoRemove + "</script>") : ''
    // };
    const context = {
      state: store.state
    }
    renderer.renderToString(app, context).then(html => {
      res.status(200)
      res.set('Content-Type', 'text/html')
      res.send(html)
    }).catch(err => {
      console.log(err);
      res.status(500).end('Internal Server Error', err)
    })
    
  }, (err) => {
    res.status(500).end('Internal Server Error', err)
  })
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})