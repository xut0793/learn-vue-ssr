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
    /**
     * 同 serverPretch 钩子函数一样，算是 vue SSR 渲染专有的一个钩子函数吧，
     * 它会在服务器端完成页面渲染 render 后，在调用 templateRender 拼接返回的 HTML 片段前调用。
     * 这个时机刚好可以处理同步 store.state 的操作
     */

    const context = {
      rendered: () => {
        context.state = store.state
      }
    }
    // 这段调用时机的源码
    // try {
    //   render(component, write, context, function (err) {
    //     if (err) {
    //       return cb(err)
    //     }
    //     if (context && context.rendered) {
    //       此处完成渲染调用
    //       context.rendered(context);
    //     }
    //     if (template) {
    //       try {
    //         开始拼装 html
    //         var res = templateRenderer.render(result, context);
    //         if (typeof res !== 'string') {
    //           res
    //             .then(function (html) { return cb(null, html); })
    //             .catch(cb);
    //         } else {
    //           cb(null, res);
    //         }
    //       } catch (e) {
    //         cb(e);
    //       }
    //     } else {
    //       cb(null, result);
    //     }
    //   });
    // } catch (e) {
    //   cb(e);
    // }

    renderer.renderToString(app, context).then(html => {
      res.status(200)
      res.set('Content-Type', 'text/html')
      res.send(html)
    }).catch(err => {
      console.log('renderToString error', err);
      res.status(500).end('Internal Server renderToString error')
    })
  })
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})