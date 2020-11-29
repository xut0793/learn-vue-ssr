# Vue SSR 服务端渲染

## SSR 概述
什么是SSR，它解决什么问题，优缺点、相关概念

## Vue SSR 的实现

一步一个 doem，深入理解 Vue SSR
- 最初的 web 静态页面，提前写好的整个 HTML 页面部署在服务器上，前端请求后直接吐出；
- 再到服务端使用模板引擎，预定好页面模板，根据前端请求所需求的数据注入模板渲染成页面吐给前端显示；
- 再到前端 ajax 时代，由前端请求数据，注入到页面而不刷新页面请求；
- 再到前端 SPA 时代，页面数据和 HTML 渲染全部由前端 js 完成；
- 再到现在 SSR 同构方案

## vue-server-render 源码解析

1. webpack 编译阶段
   1. 入口 entry-client.js 生成用于客户端浏览器渲染的 js 文件和一份用于template组装的json 文件：vue-ssr-server-bundle.json
   2. 服务端打包入口 entry-server.js，生成客户端渲染的 json 文件：vue-ssr-server-bundle.json
2. 初始化 renderer 阶段：
   1. 使用 vue-server-renderer 的 API 会在node启动时初始化一个renderer 单例对象
3. 渲染阶段：
   1. 初始化完成，当用户发起请求时，renderer.renderToString 或者 renderer.renderToStream 函数将完成 vue组件到 html 片段的字符串的过程。
4. HTML 内容输出阶段：
   1. 渲染阶段我们已经拿到了vue组件渲染结果，它是一个html字符串，在浏览器中展示页面我们还需要css、js 等依赖资源的引入标签 和 通过 store 同步我们在服务端的渲染数据，这些最终组装成一个完整的 html 报文输出到浏览器中。
5. 客户端激活阶段
   1. 当客户端发起了请求，服务端返回 HTML，用户就已经可以看到页面渲染结果了，不用等待js加载和执行。但此时页面还不能交互，需要激活客户页面，即 hydirating 过程。


## Vue SSR 的框架 Nuxt.js
- 入门
- 实践