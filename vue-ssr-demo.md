# Vue SSR 演示

按照以下几点编写示例代码：

- 最初的 web 静态页面，提前写好的整个 HTML 页面部署在服务器上，前端请求后直接吐出；
- 再到服务端使用模板引擎，预定好页面模板，根据前端请求所需求的数据注入模板渲染成页面吐给前端显示；
- 再到前端 ajax 时代，由前端请求数据，注入到页面而不刷新页面请求；
- 再到前端 SPA 时代，页面数据和 HTML 渲染全部由前端 js 完成；
- 再到现在 SSR 同构方案

[[toc]]

## demo1: 静态页面直接吐出

```HTML
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>SSR Demo 1</title>
</head>
<body>
  <h1>SSR Demo 1: HTML 文件由服务器直接返回</h1>
  <ul>
    <li>列表 1</li>
    <li>列表 2</li>
    <li>列表 3</li>
    <li>列表 4</li>
    <li>列表 5</li>
    <li>列表 6</li>
    <li>列表 7</li>
    <li>列表 8</li>
    <li>列表 9</li>
    <li>列表 10</li>
  </ul>
</body>
</html>
```

node 原生 http 模块创建服务器：

```js
// server.js
const http = require('http')
const fs = require('fs')
const PORT = 3000

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    const html = fs.readFileSync('./index.html', 'utf-8')
    res.statusCode = 200
    res.setHeader('Content-type', 'text/html;')
    res.end(html)
  }
})

server.listen(PORT, () => {
  console.log(`server is runnig at http://localhost:${PORT}`);
})
```

node express 框架创建服务器：

```js
// server.js
const express = require('express')
const fs = require('fs')
const PORT = 3000

const server = express()
server.get('/', (req,res) => {
  const html = fs.readFileSync('./index.html')
  res.status(200)
  res.set('Content-Type', 'text/html')
  res.send(html)
})
server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})
```

## demo2:服务器加工模板数据

```ejs
<!-- index.ejs -->
<head>
  <meta charset="UTF-8">
  <title>ejs render</title>
</head>
<body>
  <h1><%= title %> </h1>
  <ul>
    <% list.forEach((item, index) => { %>
    <li>列表<%= index  %>: <%= item %>  </li>
    <% }) %>
  </ul>
</body>
</html>
```

ejs.render 渲染：

```js
// server.js
const express = require('express')
const fs = require('fs')
const ejs = require('ejs')
const PORT = 3001

const server = express()
server.get('/', (req, res) => {
  // fs.readFile 如果未指定编码，则在回调data返回原始缓冲区，而ejs.redner期望一个字符串。
  const template = fs.readFileSync('./index-template.ejs', 'utf-8') 

  const data = {
    title: 'demo2: 服务器使用 ejs 渲染 html 返回',
    list: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
  }
  const html = ejs.render(template, data)

  res.status(200)
  res.set('Content-Type', 'text/html')
  res.send(html)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})
```

ejs 集成到 express 中，作为其模板引擎使用：

```js
const express = require('express')
const PORT = 3002

const server = express()
// 1. 设置 server 的模板引擎为 ejs
server.set('view engine', 'ejs')

// 2. 设置ejs模板文件目录，默认是根目录下的 view 文件夹下寻找模板文件
server.set('views', __dirname)

// 3. 在路由中调用 res.render 方法渲染 html 返回
const data = {
  title: 'demo2: ejs 与 express 集成渲染返回',
  list: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
}
server.get('/', (req, res) => {
  res.status(200)
  res.set('Content-Type', 'text/html')
  res.render('index-template', data)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})
```

## demo3: 前端 Ajax 请求数据更新页面内容

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ajax</title>
</head>
<body>
  <h1>demo3: 前端Ajax请求数据并渲染</h1>
  <ul id="container"></ul>
</body>
<script>

function initContent(data) {
  const elContainer = document.querySelector('#container')
  let elLiStr = ""
  
  if (Array.isArray(data)) {
    for (let i = 0, len = data.length; i < len; i++) {
      elLiStr += `<li>列表${i+1}: ${data[i]}</li>`
    }
  } else {
    elLiStr = `<li>${data}</li>`
  }
  elContainer.innerHTML = elLiStr
}

function getInitData() {
  // 第一种方式：XMLHttpRequest
  function handleResponseData() {
    if (this.status == 200) {
      const data = this.response
      initContent(data)
    }
  }
  const xhr = new XMLHttpRequest()
  xhr.addEventListener('load', handleResponseData)
  xhr.open('GET', '/api')
  xhr.responseType = 'json'
  xhr.send()
  
  // 第二种方式：fetch
  fetch('/api').then(res => {
    return res.json()
  }).then(data => {
    initContent(data)
  }).catch(err => {
    console.error(err);
  })
}

document.addEventListener("DOMContentLoaded", function() {
  getInitData()
});

</script>
</html>
```

```js
const express = require('express')
const fs = require('fs')
const PORT = 3003
const data = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

const server = express()
server.get('/', (req, res) => {
  const html = fs.readFileSync('./index.html')
  res.status(200)
  res.set('Content-Type', 'text/html')
  res.send(html)
}) 

server.get('/api', (req, res) => {
  res.status(200)
  res.set('Content-Type', 'applicatiion/json')
  res.send(data)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})
```

## demo4: Vue SPA 模式

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="zn">
<head>
  <meta charset="UTF-8">
  <title>vue demo</title>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue/2.6.12/vue.min.js"></script>
</head>
<body>
  <div id="app"></div>
</body>
<script>

const ComList = Vue.extend({
  name: 'ComList',
  data() {
    return {
      title: 'demo4: vue 客户端渲染',
      list: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    }
  },
  template: `<div>
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`
})

  // 主应用
  const app = new Vue({
    el: '#app',
    components: {
      ComList,
    },
    template: `<div>
      <h1>Vue SPA</h1>
      <com-List />
    </div>`
  })
</script>
</html>
```

```js
const express = require('express')
const fs = require('fs')
const PORT = 3004

const server = express()
server.get('/', (req, res) => {
  const html = fs.readFileSync('./index.html', 'utf-8')
  res.status(200)
  res.set('Content-Type', 'text/html')
  res.send(html)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})
```

添加 Vue-router，实现客户端路由。并且将 html 与 js 分离。

```html
<!-- index.tempalte.html -->
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>vue demo</title>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue/2.6.12/vue.min.js"></script>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue-router/3.4.8/vue-router.js"></script>
  <!-- 这里需要添加 defer 属性，或者将此引用移到 body 下面 -->
  <script defer src="./vue-render.js"></script>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```

```js
/** vue-render.js*/
// 首页
const Home = Vue.extend({
  name: 'Home',
  template: `<div>这是首页</div>`
})

// 列表页
const ComList = Vue.extend({
  name: 'ComList',
  data() {
    return {
      title: 'demo4: vue 客户端渲染',
      list: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    }
  },
  template: `<div>
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`
})

// 计数器页
const ComCounter = Vue.extend({
  name: 'Counter',
  data() {
    return {
      number: 0
    }
  },
  methods: {
    minus() {
      this.number -= 1
    },
    plus() {
      this.number += 1
    }
  },
  template: `<div>
    <h2>Vue 定义事件计数器</h2>
    <div>
      <button @click="minus">-</button>
      <span>{{number}}</span>
      <button @click="plus">+</button>
    </div>
  </div>`
})

// 主应用
const App = Vue.extend({
  name: 'App',
  template: `<div id="app">
    <router-link to="/">首页</router-link>
    <router-link to="/list/99">列表</router-link>
    <router-link to="/counter">计数器</router-link>
    <router-view></router-view>
  </div>`
})

/**
 * 路由
 */
const routes = [
  { path: '/', component: Home},
  { path: '/list/:id', component: ComList},
  { path: '/counter', component: ComCounter},
]

const router = new VueRouter({
  mode: 'history',
  routes
})

const vm = new Vue({
  router,
  render: h => h(App)
})
vm.$mount('#app')

```

服务器代码： server-router.js

```js
const express = require('express')
const fs = require('fs')
const PORT = 3004

const server = express()
server.get('/vue-render.js', (req, res) => {
  const js = fs.readFileSync('./vue-render.js')
  res.status(200)
  res.send(js)
})

// 这里使用 * 号匹配，并称到 /vue-router.js 下面，这样即使页面路由为 /list/99 或 /counter 也可渲染页面，不会报错
server.get('*', (req, res) => {
  const html = fs.readFileSync('./index.template.html', 'utf-8')
  res.status(200)
  res.set('Content-Type', 'text/html')
  res.send(html)
})

server.listen(PORT, () => {
  console.log(console.log(`server is runnig at http://localhost:${PORT}`));
})
```

## demo5: Vue-Server-render

在服务端的渲染逻辑主要分为两步：

1. 使用 new Vue 生成一个应用构造器
2. 使用 Vue 的服务端渲染的插件 vue-server-renderer ，将当前的组件构造器渲染成一段 html 片段的字符串，返回给浏览器渲染器渲染

此时 vue-server-renderer 的作用类似于 ejs 一样的模板引擎作用。

以下的例子需要本地工程安装 vue 和 vue-server-renderer 包，且要求版本一样。

```js
const express = require('express')
const Vue = require('vue')
const vueServerRenderer = require('vue-server-renderer')
const renderer = vueServerRenderer.createRenderer()
const PORT = 3000

const server = express()
/**
 * 第一种情形：
 * 此时直接返回的就是 vueApp.$options.template 渲染出的字符串：
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
```

为了显示完整的HTML结构，我们可以手动拼接完成：

```js
/**
 * 第二种情形：
 * 可以使用模板字符串拼接出HTML结构标签
 */
server.get('/', (req, res) => {
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
```

或者提供一个用于html渲染的模板文件

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>vue ssr template</title>
</head>
<body>
  <!-- 坑：注释中不能存在空格 -->
  <!--vue-ssr-outlet-->
</body>
</html>
```

服务端代码更改逻辑：

```js
/**
 * 第三种情形:
 * 提供一个 html 模板，用于 vueServerRender 将渲染出的 html 片段字符串插入到模板指定位置中返回
 * 模板中提供的插入内容的位置标识是：<!--vue-ssr-outlet-->
 */
const fs = require('fs')
const template = fs.readFileSync('./index.template.html', 'utf-8')
const rendererWithTemplate = vueServerRenderer.createRenderer({
  template: template // 创建渲染器时通过配置参数提供页面模板
})
server.get('/', (req, res) => {
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
```

以上吐给浏览器渲染的都是静态内容，下面测试下返回一个包含事件的计数器 Vue 组件是否有效

```js
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
```

事实证明，计数器组件只是视图渲染成功，点击事件并没有生效。

 因为 Vue SSR 中的 renderer 只负责把当前状态下 Vue 组件渲染成 html 片段字符串供浏览器渲染，而相关的事件，以及事件触发响应式更新视图的功能仍然需要客户端提供，这就是同构。

 简单理解 SSR 同构：就是服务端和客户需要同时渲染当前状态的页面，服务端渲染的部分相当于当前数据状态下页面的一个快照，返回给浏览器后，浏览器仍然需要由客户端来激活相关事件和响应式更新的功能。

## demo6: Vue SSR 服务端和客户端同构应用

参照 demo4 浏览器 SPA 的代码，在模板中添加 vue 的 cdn 链接，和客户端渲染需要的代码。

注意客户端渲染产生的 vueApp 需求与渲染端保持一致。

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>vue ssr event</title>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue/2.6.12/vue.min.js"></script>
  <script defer src="./render-client.js"></script>
</head>
<body>
  <!--vue-ssr-outlet-->
</body>
</html>
```

客户端渲染逻辑 render-client.js

```js
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
vueApp.$mount('#app', true) // 客户端挂载应用
```

此时服务端代码添加对 render-client.js 请求的响应

```js
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
```

再点击页面可以发现事件绑定生效了。这个例子与demo4例子直接客户端渲染最大的区别是，针对首页路由请求返回的 html 结构。

demo4 返回的只是一个空的节点`<div id="app"></div>`，但此时服务端和客户同构应用后，首页返回的html包含完整内容，并且页面可交互。

此时你可能会疑惑，虽然首页请求服务端返回了完整的HTML结构，但客户端 vue 代码也产生了作用，那页面是不是被渲染了两次呢？

可以保持这个疑问，等后面结合 vue 源码和 vue-server-renderer 源码解析的时间就会找到答案。

## demo7: 同构包含路由

包含路由的应用同构，我们需要实现的目标是：

1. 路由在客户端生效，即路由完全由客户端控制，切换路由时不产生新的页面请求
2. 在不同路由地址下刷新页面，服务端返回当前路由下的 HTML 内容。而不是一直是首页内容

```html
<!-- index.template.html -->
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>vue ssr event</title>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue-router/3.4.8/vue-router.min.js"></script>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue/2.6.12/vue.min.js"></script>
  <script defer src="./render-client.js"></script>
</head>
<body>
  <!--vue-ssr-outlet-->
</body>
</html>
```

客户端创建应用逻辑抽离到 render-client.js

```js
/**
 * 组件
 */
const ComIndex = Vue.extend({
  name: 'index',
  template: `<div>这是首页</div>`
})
const ComList = Vue.extend({
  name: 'ComList',
  data() {
    return {
      title: '路由: 列表渲染',
      list: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    }
  },
  template: `<div>
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`
})

const ComCounter = Vue.extend({
  name: 'Counter',
  data() {
    return {
      number: 0
    }
  },
  methods: {
    minus() {
      this.number -= 1
    },
    plus() {
      this.number += 1
    }
  },
  template: `<div>
    <h2>路由：计数器</h2>
    <div>
      <button @click="minus">-</button>
      <span>{{number}}</span>
      <button @click="plus">+</button>
    </div>
  </div>`
})

const App = Vue.extend({
  name: 'App',
  template: `<div id="app">
    <router-link to="/">首页</router-link>
    <router-link to="/list">列表</router-link>
    <router-link to="/counter">计数器</router-link>
    <router-view></router-view>
  </div>`
})

/**
 * 路由
 */
Vue.use(VueRouter)
const routes = [
  { path: '/', component: ComIndex},
  { path: '/list', component: ComList},
  { path: '/counter', component: ComCounter},
]

const router = new VueRouter({
  mode: 'history',
  routes
})

const app = new Vue({
  router,
  render: h => h(App)
})

app.$mount('#app')
```

服务端创建应用的逻辑抽离到 render-server.js

```js
const Vue = require('vue')
const VueRouter = require('vue-router')

/**
 * 组件
 */
const ComIndex = Vue.extend({
  name: 'index',
  template: `<div>这是首页</div>`
})
const ComList = Vue.extend({
  name: 'ComList',
  data() {
    return {
      title: '路由: 列表渲染',
      list: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    }
  },
  template: `<div>
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`
})

const ComCounter = Vue.extend({
  name: 'Counter',
  data() {
    return {
      number: 0
    }
  },
  methods: {
    minus() {
      this.number -= 1
    },
    plus() {
      this.number += 1
    }
  },
  template: `<div>
    <h2>路由：计数器</h2>
    <div>
      <button @click="minus">-</button>
      <span>{{number}}</span>
      <button @click="plus">+</button>
    </div>
  </div>`
})

const App = Vue.extend({
  name: 'App',
  template: `<div id="app">
    <router-link to="/">首页</router-link>
    <router-link to="/list">列表</router-link>
    <router-link to="/counter">计数器</router-link>
    <router-view></router-view>
  </div>`
})

/**
 * 路由
 */
Vue.use(VueRouter)
const routes = [
  { path: '/', component: ComIndex},
  { path: '/list', component: ComList},
  { path: '/counter', component: ComCounter},
]

const router = new VueRouter({
  mode: 'history',
  routes
})


const app = new Vue({
  router,
  render: h => h(App)
})

exports.app = app
exports.router = router
```

可以对应下 render-client.js 和 render-server.js 的代码，对 vue 应用相关的代码完全一样，差异的代码是：

- 客户端手动挂载应用：`app.$mount('#app')`
- 服务端导出应用：`exports.app = app`

此时服务器 server.js 的代码修改为：

```js
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
```

## demo8: 同步客户端与服务端渲染的数据

Vue SSR 中数据状态的同步需要通过 Vuex 来实现。

在HTML模板中增加 vuex 的 CDN 链接，并且项目下安装 vuex 包：

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>vue ssr event</title>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue-router/3.4.8/vue-router.js"></script>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue/2.6.12/vue.min.js"></script>
  <script src="https://cdn.bootcdn.net/ajax/libs/vuex/3.5.1/vuex.min.js"></script>
  <script defer src="./render-client.js"></script>
</head>
<body>
  <!--vue-ssr-outlet-->
</body>
</html>
```

客户端抽离的应用代码增加 vuex 实例化代码

```js
/**
 * 组件
 */
const ComIndex = Vue.extend({
  name: 'index',
  template: `<div>这是首页</div>`
})
const ComList = Vue.extend({
  name: 'ComList',
  data() {
    return {
      title: '路由: 列表渲染',
      list: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    }
  },
  template: `<div>
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`
})

const ComCounter = Vue.extend({
  name: 'Counter',
  methods: {
    increase() {
      this.$store.commit('increase', 10)
    },
  },
  template: `<div>
    <h1>计数器: 从 store 读取 count</h1>
    <h2>{{ $store.state.count }}</h2>
    <div>
      <button @click="increase">加10</button>
    </div>
  </div>`
})

const App = Vue.extend({
  name: 'App',
  template: `<div id="app">
    <router-link to="/">首页</router-link>
    <router-link to="/list">列表</router-link>
    <router-link to="/counter">计数器</router-link>
    <router-view></router-view>
  </div>`
})

/**
 * 路由
 */
Vue.use(VueRouter)
const routes = [
  { path: '/', component: ComIndex},
  { path: '/list', component: ComList},
  { path: '/counter', component: ComCounter},
]

const router = new VueRouter({
  mode: 'history',
  routes
})

/**
 * 数据状态 store
 */
Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    count: 0
  },
  mutations: {
    increase (state, n) {
      state.count = +state.count + n
    }
  }
})

const app = new Vue({
  router,
  store,
  render: h => h(App)
})

/**
 * 同步 store.state 的关键代码
 * 用来同步服务端的 store　到客户端　store, 从而使客户端和服务端的初时状态一致
 */
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

app.$mount('#app')

```

服务端抽离的应用逻辑代码：render-server.js

```js
const Vue = require('vue')
const VueRouter = require('vue-router')
const Vuex = require('vuex')

/**
 * 第一种情形：
 * 所有请求共享同一个应用 app，很容易导致交叉请求状态污染 (cross-request state pollution)。
 */
const ComIndex = Vue.extend({
  name: 'index',
  template: `<div>这是首页</div>`
})
const ComList = Vue.extend({
  name: 'ComList',
  data() {
    return {
      title: '路由: 列表渲染',
      list: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    }
  },
  template: `<div>
    <h1>{{ title }}</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`
})

const ComCounter = Vue.extend({
  name: 'Counter',
  methods: {
    increase() {
      this.$store.commit('increase', 10)
    },
  },
  beforeCreate() {
    console.log('beforeCreate server');
  },
  created() {
    console.log('created server');
  },
  beforeMount() {
    console.log('beforeMount server');
  },
  mounted() {
    console.log('mounted server');
  },
  template: `<div>
    <h1>计数器: 从 store 读取 count</h1>
    <h2>{{ $store.state.count }}</h2>
    <div>
      <button @click="increase">加10</button>
    </div>
  </div>`
})

const App = Vue.extend({
  name: 'App',
  template: `<div id="app">
    <router-link to="/">首页</router-link>
    <router-link to="/list">列表</router-link>
    <router-link to="/counter">计数器</router-link>
    <router-view></router-view>
  </div>`
})

/**
 * 路由
 */
Vue.use(VueRouter)
const routes = [
  { path: '/', component: ComIndex},
  { path: '/list', component: ComList},
  { path: '/counter', component: ComCounter},
]

const router = new VueRouter({
  mode: 'history',
  routes
})

/**
 * 数据状态 store
 */
Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    count: 0
  },
  mutations: {
    increase (state, n) {
      state.count = +state.count + n
    }
  }
})

const app = new Vue({
  router,
  store,
  render: h => h(App)
})

module.exports = {
  app,
  router,
  store
}
```

服务端代码：server.js

```js
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
const { app, router, store } = require('./render-server.js')

server.get('/render-client.js', (req, res) => {
  const js = fs.readFileSync('./render-client.js')
  res.status(200)
  res.send(js)
})

server.get('*', (req, res) => {
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
```

浏览器路由切换到计数器 /counter，页面渲染 count 值是 200，查看返回的 html 数据结果`window.__INITIAL_STATE__={"count":200}`

此时，你可以多次刷新该页面，会发现 count 的值一直在加200，这就是**数据状态单例**造成的请求状态污染。

当我们在编写纯客户端 (client-only) 的 SPA 应用时，我们每个人的浏览器环境页面都是独立的，每次打开一个 SPA 页面，都会创建独立的应用单例，不会有影响。但是，Node.js 服务器是一个长期运行的进程。当我们的代码进入该进程时，它将进行一次取值并留存在内存中。这意味着如果创建一个单例应用，只要服务未重启，它都是同一个应用。这样就导致应用状态会在每个传入的请求之间共享，造成应用的交叉请求状态污染 (cross-request state pollution)。

> [Vue SSR 指南：避免状态单例](https://ssr.vuejs.org/zh/guide/structure.html#%E9%81%BF%E5%85%8D%E7%8A%B6%E6%80%81%E5%8D%95%E4%BE%8B)

所以，我们**为每个请求创建一个新的 Vue 实例**。这与每个用户在自己的浏览器中使用新应用程序的实例类似。所以将 render-server.js 的业务代码包装在一个可重复执行的工厂函数中。

```js
const Vue = require('vue')
const VueRouter = require('vue-router')
const Vuex = require('vuex')

/**
 * 第二种情形：
 * 为了避免数据状态单例的情况，使用 createApp 工厂函数，为每一次请求创建一个独立的应用 app
 */
function createApp() {
  const ComIndex = Vue.extend({
    name: 'index',
    template: `<div>这是首页</div>`
  })
  const ComList = Vue.extend({
    name: 'ComList',
    data() {
      return {
        title: '路由: 列表渲染',
        list: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      }
    },
    template: `<div>
      <h1>{{ title }}</h1>
      <ul>
        <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
      </ul>
    </div>`
  })
  
  const ComCounter = Vue.extend({
    name: 'Counter',
    methods: {
      increase() {
        this.$store.commit('increase', 10)
      },
    },
    beforeCreate() {
      console.log('beforeCreate server');
    },
    created() {
      console.log('created server');
    },
    beforeMount() {
      console.log('beforeMount server');
    },
    mounted() {
      console.log('mounted server');
    },
    template: `<div>
      <h1>计数器: 从 store 读取 count</h1>
      <h2>{{ $store.state.count }}</h2>
      <div>
        <button @click="increase">加10</button>
      </div>
    </div>`
  })
  
  const App = Vue.extend({
    name: 'App',
    template: `<div id="app">
      <router-link to="/">首页</router-link>
      <router-link to="/list">列表</router-link>
      <router-link to="/counter">计数器</router-link>
      <router-view></router-view>
    </div>`
  })
  
  /**
   * 路由
   */
  Vue.use(VueRouter)
  const routes = [
    { path: '/', component: ComIndex},
    { path: '/list', component: ComList},
    { path: '/counter', component: ComCounter},
  ]
  
  const router = new VueRouter({
    mode: 'history',
    routes
  })
  
  /**
   * 数据状态 store
   */
  Vue.use(Vuex)
  const store = new Vuex.Store({
    state: {
      count: 0
    },
    mutations: {
      increase (state, n) {
        state.count = +state.count + n
      }
    }
  })
  
  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })

  return {
    app: app,
    router,
    store
  }
}

exports.createApp = createApp
```

此时，服务端代码逻辑变更如下：

```js
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
    
    store.commit('increase', 200)
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
```

## demo9: 预取数据

应用的数据往往都是通过发送请求，接口返回的。所以在服务端渲染 app 应用前，需要提前拿到当前页面渲染所依赖的数据。

这里需要使用 axios 库，它即可以应用在浏览器环境，也可以应用在 node 环境。我们都在 `store.actions` 中进行数据请求。

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>vue ssr event</title>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue-router/3.4.8/vue-router.js"></script>
  <script src="https://cdn.bootcdn.net/ajax/libs/vue/2.6.12/vue.min.js"></script>
  <script src="https://cdn.bootcdn.net/ajax/libs/vuex/3.5.1/vuex.min.js"></script>
  <script src="https://cdn.bootcdn.net/ajax/libs/axios/0.21.0/axios.min.js"></script>
  <script defer src="./render-client.js"></script>
</head>
<body>
  <!--vue-ssr-outlet-->
</body>
</html>
```

客户端业务代码 render-client.js

```js
/**
 * 组件
 */
const ComIndex = Vue.extend({
  name: 'index',
  template: `<div>这是首页</div>`
})
const ComList = Vue.extend({
  name: 'ComList',
  computed: {
    list() {
      return this.$store.state.list
    }
  },
  template: `<div>
    <h1>SSR 数据预取</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`,
  asyncData({ store, route }) {
    /**
     * 这里要 return 出去，因为 server.js 中可能需要在 then 中处理额外逻辑
     */
    return store.dispatch('fetchList', route.params.id)
  },
  beforeMount() {
    const { $options: { asyncData }, $store:store, $route:route } = this
    asyncData({store, route}).then(() => {
      console.log('async data is successed');
    })
  },
})


const App = Vue.extend({
  name: 'App',
  template: `<div id="app">
    <router-link to="/">首页</router-link>
    <router-link to="/list/99">列表</router-link>
    <router-view></router-view>
  </div>`
})

/**
 * 路由
 */
Vue.use(VueRouter)
const routes = [
  { path: '/', component: ComIndex},
  { path: '/list/:id', component: ComList},
]

const router = new VueRouter({
  mode: 'history',
  routes
})

/**
 * 数据状态 store
 */

Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    list: []
  },
  mutations: {
    SET_LIST(state, payload) {
      state.list = payload
    }
  },
  actions: {
    fetchList({ commit }, payload) {
      /**
       * 坑一： 需要区分浏览器客户端与服务端的环境区别
       * 服务端如果直接用 /，指向的是 localhost:80
       */
      if (typeof window !== 'undefined') {
        axios.default.baseURL = '/'
      } else {
        axios.defaults.baseURL = 'http://localhost:3000';
      }
      
      console.log('payload params.id in client broswer', payload);
      return axios.get(`/api/list`).then(res => {
        if (res.status === 200) {
          commit('SET_LIST', res.data)
        } else {
          return Promise.reject(res.statusText)
        }
      }).catch(err => {
        console.error(err);
        return Promise.reject(err)
      })
    }
  }
})

const vm = new Vue({
  router,
  store,
  render: h => h(App)
})

/**
 * 使用 store 需要的关键代码
 * 用来同步服务端的 store　到客户端　store, 从而使其一致
 */
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

vm.$mount('#app')

```

服务端业务逻辑 render.server.js

```js
const Vue = require('vue')
const VueRouter = require('vue-router')
const Vuex = require('vuex')
const axios = require('axios')

function createApp() {
  /**
 * 组件
 */
const ComIndex = Vue.extend({
  name: 'index',
  template: `<div>这是首页</div>`
})
const ComList = Vue.extend({
  name: 'ComList',
  computed: {
    list() {
      return this.$store.state.list
    }
  },
  template: `<div>
    <h1>SSR 数据预取</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`,
  asyncData({ store, route }) {
    /**
     * 这里要 return 出去，因为 server.js 中需要在 then 中处理state 同步
     */
    return store.dispatch('fetchList', route.params.id)
  },
  beforeMount() {
    const { $options: { asyncData }, $store:store, $route:route } = this
    asyncData({store, route}).then(() => {
      console.log('async data is successed');
    })
  },
})


const App = Vue.extend({
  name: 'App',
  template: `<div id="app">
    <router-link to="/">首页</router-link>
    <router-link to="/list/99">列表</router-link>
    <router-view></router-view>
  </div>`
})

/**
 * 路由
 */
Vue.use(VueRouter)
const routes = [
  { path: '/', component: ComIndex},
  { path: '/list/:id', component: ComList},
]

const router = new VueRouter({
  mode: 'history',
  routes
})

/**
 * 数据状态 store
 */

Vue.use(Vuex)
const store = new Vuex.Store({
  state: {
    list: []
  },
  mutations: {
    SET_LIST(state, payload) {
      state.list = payload
    }
  },
  actions: {
    fetchList({ commit }, payload) {

      /**
       * 坑一： 需要区分浏览器客户端与服务端的环境区别
       * 服务端如果直接用 /，指向的是 localhost:80
       */
      if (typeof window !== 'undefined') {
        axios.default.baseURL = '/'
      } else {
        axios.defaults.baseURL = 'http://localhost:3000';
      }
      /**
       * 坑二：这里要 return 出去，因为 server.js 中需要在 then 中处理 store.state 的同步
       */
      console.log('payload params.id server', payload);
      return axios.get(`/api/list`).then(res => {
        if (res.status === 200) {
          commit('SET_LIST', res.data)
        } else {
          return Promise.reject(res.statusText)
        }
      }).catch(err => {
        return Promise.reject(err)
      })
    }
  }
})

const app = new Vue({
  router,
  store,
  render: h => h(App)
})

  return {
    app: app,
    router,
    store
  }
}

exports.createApp = createApp
```

此时，在服务端 server.js 中在组件渲染前，需要预取数据用于服务端组件渲染

```js
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
    // 遍历当前路由捕获到的每个组件，调用组件中的 asyncData 发起数据请求
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
```

## demo10：使用 serverPrefetch 预数据和 renered 同步数据

在 Vue SSR 官方文档对预取数据的讲解还是使用`asyncData ()`配合`router.getMatchedComponents ()`方法中获取的组件中请求数据接口。

但是在 vue 2.6.x 新版本发布后，其时针对服务端渲染增加了一个生命周期钩子函数：serverPrefetch， vue-server-renderer 会在每个组件中调用它，它会返回一个promise，调用时机在模板 compiler 编译后，在 vm._render 前自动调用该函数。

```js
// vue-server-renderer 源码
var LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch'
];
// 调用时机
function createRenderFunction ( modules, directives, isUnaryTag, cache) {
  return function render ( component, write, userContext, done ) {
    warned = Object.create(null);

    // 1. 生成渲染上下文
    var context = new RenderContext({
      activeInstance: component,
      userContext: userContext,
      write: write, 
      done: done, 
      renderNode: renderNode,
      modules: modules, 
      isUnaryTag: isUnaryTag, 
      directives: directives,
      cache: cache
    });

    // 2. 安装服务端渲染的工具函数
    installSSRHelpers(component);
    //3. 编译组件生成 $options.render 属性，即生成 compiled 编译模板，生成$options.render 和 $options.staticRenderFns，同 Vue 源码编译阶段一样 
    normalizeRender(component);

    var resolve = function () { 
      // 5. 渲染组件，比较下 vue 源码： vm._update(vm._render(), hydrating), 差异就是 _update 过程，即 patch 过程
      // Vue.prototype._render 关键代码就是执行编译生成的渲染函数，即 with 语句
      // vnode = component.$options.render.call(vm, vm.$createElement);
      renderNode(component._render(), true, context);
    };
    // 4. 等待组件 serverPrefetch 执行，获取组件依赖的数据
    waitForServerPrefetch(component, resolve, done);
  }
}

/**
 * 4. 等待组件 serverPrefetch 执行，获取组件依赖的数据
 */
function waitForServerPrefetch (vm, resolve, reject) {
  var handlers = vm.$options.serverPrefetch;
  if (isDef(handlers)) {
    if (!Array.isArray(handlers)) { handlers = [handlers]; }
    try {
      var promises = [];
      for (var i = 0, j = handlers.length; i < j; i++) {
        var result = handlers[i].call(vm, vm);
        if (result && typeof result.then === 'function') {
          promises.push(result);
        }
      }
      Promise.all(promises).then(resolve).catch(reject);
      return
    } catch (e) {
      reject(e);
    }
  }
  resolve();
}
```

在`serverPrefetch()`执行之后，我们需要知道应用在什么时候渲染完成。在vue-server-renderer 上下文中，我们可以使用`rendered()`钩子方法，它会在服务器端完成页面渲染 render 后，在调用 templateRender 拼接返回的 HTML 片段前调用。

```js
// 调用时机
try {
  render(component, write, context, function (err) {
    if (err) {
      return cb(err)
    }
    if (context && context.rendered) {
      // 此处完成渲染调用
      context.rendered(context);
    }
    if (template) {
      try {
        // 开始拼装 html
        var res = templateRenderer.render(result, context);
        if (typeof res !== 'string') {
          res
            .then(function (html) { return cb(null, html); })
            .catch(cb);
        } else {
          cb(null, res);
        }
      } catch (e) {
        cb(e);
      }
    } else {
      cb(null, result);
    }
  });
} catch (e) {
  cb(e);
}
```

所以同构应用时，预取数据和同步state 的代码可以更改如下：

在需要预取数据的组件 ComList 中调用：

```js
const ComList = Vue.extend({
  name: 'ComList',
  computed: {
    list() {
      return this.$store.state.list
    }
  },
  template: `<div>
    <h1>SSR 数据预取</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`,
    // asyncData({ store, route }) {
    //   return store.dispatch('fetchList', route.params.id)
    // },
    // beforeMount() {
    //   const { $options: { asyncData }, $store:store, $route:route } = this
    //   asyncData({store, route}).then(() => {
    //     console.log('async data is successed');
    //   })
    // },
  async serverPrefetch() {
    /**
     * serverPrefetch 在 Vue 中是作为其生命周期的一个钩子函数，LIFECYCLE_HOOKS，所以它可以像其它钩子一样作为函数调用，或者定义多个，或者直接定义成数组
     * 在 Vue 解析之后最终会像其它钩子函数一样变成数组形式。
     * 区别是：serverPrefetch 钩子只在 Vue 服务端渲染的包 vue-server-renderer 内部被自动调用。调用时机在模板 compiler 编译后，在 vm._render 前自动调用该函数
     * 在客户端渲染时不会被调用，所以需要在客户端生命周期钩子中手动调用。它挂载在 this.$options.__proto__ 原型对象上。
     */
    await this.$store.dispatch('fetchList', this.$route.params.id)
  },
  /**
   * 也可以写成函数形式,可以触发多个请求
   * 但这时，beforeMount 里的代码需要对应函数获取
   */
  // serverPrefetch: [
  //   async () => await this.$store.dispatch('fetchList', this.$route.params.id),
  // ],
  beforeMount() {
    /**
     * 坑：
     * 1.在客户端 serverPrefetch 始终被 Vue 解析成数组，所以明确单个时，需要 [0]
     * 2.serverPrefetch 内的需要使用 call 绑定调用上下文
     */
    // const { $options: { serverPrefetch } } = this
    // serverPrefetch[0].call(this).then(() => {
    //   console.log('async data is successed');
    // })

    /**
     * 可以直接写成兼容单个函数或数组形式的代码逻辑
     * 以下兼容代码实际上也是 vue-server-renderer 中调用 serverPrefetch 的源码
     */
    let handlers = this.$options.serverPrefetch;
    if (typeof handlers !== 'undefined') {
      if (!Array.isArray(handlers)) { handlers = [handlers]; }
      try {
        let promises = [];
        for (let i = 0, j = handlers.length; i < j; i++) {
          /**
           * 坑： serverPrefetch 内的需要使用 call 绑定调用上下文
           */
          let result = handlers[i].call(this, this);
          if (result && typeof result.then === 'function') {
            promises.push(result);
          }
        }
        Promise.all(promises).then(() => {
          console.log('serverPrefetch called')
        }).catch(e => console.error(e));
        return

      } catch (e) {
        console.error(e);;
      }
    }
  },
})
```

由于 serverPrefetch 内的数据请求方法会被 vue-server-renderer 自动调用，所以在服务端 server.js 中代码中只需要在 rendered 回调中传入同步 state 的代码逻辑即可

```js
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
```

## demo11: 模块化编程

SSR 属于同构应用，客户端和服务端几乎需要处理相同的应用逻辑，从上面的几个 demo 也可以看出，`render-client.js` 和 `render-server.js`代码几乎都是相同的代码，却一直重复书写。我们需要将代码逻辑进行拆分，将共同的逻辑代码抽离成独立的模块进行引用。

模块化之后，对客户端引用，需要使用模块打包工具合并成一个 `client-bundle.js` 文件供客户端引用。而服务端本身就支持模块化引用，所以可以不需要打包构建。

1. 将 createApp 的代码进行拆分成 app / router / store 各自独立的模块
2. 客户端和服务端差异部分分为两个文件，也是打包构建的入口文件：`entry-client.js` 和 `entry-server.js`
3. 对于页面组件部分代码抽离到 components.js 文件中。下一个demo 再实现配置 .vue 单文件组件，本 demo 主要在于代码抽离以及客户端 bundle 的构建。

**组件模块**

```js
const Vue = require('vue')

const Home = Vue.extend({
  name: 'Home',
  template: `<div>这是首页</div>`
})

const List = Vue.extend({
  name: 'List',
  computed: {
    list() {
      return this.$store.state.list
    }
  },
  template: `<div>
    <h1>SSR 数据预取</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
    </ul>
  </div>`,
  async serverPrefetch() {
    await this.$store.dispatch('fetchList', this.$route.params.id)
  },
  beforeMount() {
    const { $options: { serverPrefetch }} = this
     /**
     * 坑：
     * 1.在客户端 serverPrefetch 始终被 Vue 解析成数组，所以明确单个时，需要 [0]
     * 2.serverPrefetch 内的需要使用 call 绑定调用上下文
     */
    serverPrefetch[0].call(this).then(() => {
       console.log('async data is successed');
     })
  },
})

const App = Vue.extend({
  name: 'App',
  template: `<div id="app">
    <router-link to="/">首页</router-link>
    <router-link to="/list/99">列表</router-link>
    <router-view></router-view>
  </div>`
})

module.exports = {
  App,
  Home,
  List
}
```

**路由 router**

```js
const Vue = require('vue')
const VueRouter = require('vue-router')
const { Home, List } = require('./components.js')

Vue.use(VueRouter)
const routes = [
  { path: '/', component: Home},
  { path: '/list/:id', component: List},
]

exports.createRouter = function createRouter() {

  const router = new VueRouter({
    mode: 'history',
    routes
  })

  return router
}
```

**数据仓库** store

```js
const Vue = require('vue')
const Vuex = require('vuex')
const axios = require('axios')

Vue.use(Vuex)
exports.createStore = function createStore() {
  const store = new Vuex.Store({
    state: {
      list: []
    },
    mutations: {
      SET_LIST(state, payload) {
        state.list = payload
      }
    },
    actions: {
      fetchList({ commit }, payload) {

        /**
         * 坑一： 需要区分浏览器客户端与服务端的环境区别
         * 服务端如果直接用 /，指向的是 localhost:80
         */
        if (typeof window !== 'undefined') {
          axios.default.baseURL = '/'
        } else {
          axios.defaults.baseURL = 'http://localhost:3000';
        }
        /**
         * 坑二：这里要 return 出去，因为 server.js 中需要在 then 中处理 state 同步
         */
        return axios.get(`/api/list`).then(res => {
          if (res.status === 200) {
            commit('SET_LIST', res.data)
            return Promise.resolve(res.data)
          } else {
            return Promise.reject(res.statusText)
          }
        }).catch(err => {
          return Promise.reject(err)
        })
      }
    }
  })

  return store
}
```

**应用 app**

```js
const Vue = require('vue')
const { createRouter } = require('./router.js')
const { createStore } = require('./store.js')
const { App } = require('./components.js')

function createApp() {
  const router = createRouter()
  const store = createStore()
  const app = new Vue({
    router,
    store,
    render: h => h(App)
  })

  return {
    app,
    router,
    store
  }
}

exports.createApp = createApp
```

**客户端入口 entry-client.js**

```js
const { createApp } = require('./app.js')

const { app, store} = createApp()

if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}

app.$mount('#app')
```

**服务端入口 entry-server.js**

```js
const { createApp } = require('./app.js')

function _createApp(context) {
  return new Promise((resolve, reject) => {
    const { app, router, store } = createApp()
    const { url } = context
    router.push(url)
    router.onReady(() => {
      context.rendered = () => {
        context.state = store.state
      }
      resolve(app)
    }, reject)
  })
}

exports.createApp = _createApp
```

**服务器 server.js**

```js
const express = require('express')
const fs = require('fs')
const server = express()
const PORT = 3000

const vueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync('./index.template.html', 'utf-8')
const renderer = vueServerRenderer.createRenderer({
  template: template
})

const { createApp } = require('./entry-server.js')

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
server.get('/*client-bundle.js$/', (req, res) => {
  const js = fs.readFileSync('./client-app-bundle.js')
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
    console.log('server app');
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
```

**页面模板文件**

```html
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <title>vue ssr</title>
  <script defer src="client-app-bundle.js"></script>
</head>
<body>
  <!--vue-ssr-outlet-->
</body>
</html>
```

**打包配置 webpack.config.js**

这里使用 webpack 进行模块打包，所以需要本地安装 webpack ： `npm i -S webapck`

```js
const path = require('path')

module.exports = {
  entry: {
    'client-bundle': path.resolve(__dirname, './entry-client.js')
  },
  output: {
    path: path.resolve(__dirname),
    publicPath: '/',
    filename: '[name].js',
  },
  resolve: {
    alias: {
        // 坑：
        // vue 的构建版本大体分为两种：只包含运行时的版本 和 运行时 + 模板编译器的完整版，
        // 而在node_modules/vue/package.json/ 中 main 字段默认是 vue.runtime.esm.js, 即只含运行时的版本，这个版本无法在浏览器客户端运行，
        // 所以在打包时需要指明让 webpack 打包包含编译器的完整版进行构建。 
        // vue-router / vuex 是因为模块规范问题，默认是 comonJS 规范的包，所以需要指定构建 esm 或 UMD 的包。

        // resolve.alias 就可以指定 webpack 在构建时从哪个路径中解析依赖包

        'vue$': 'vue/dist/vue.js',
        'vue-router$': 'vue-router/dist/vue-router.js',
        'vuex$': 'vuex/dist/vuex.js'
    }
  }
}
```

然后进入目录，在命令行中输入构建的命令`npx webapck --config webpack.config.js --progress`

最后 `node server.js`启动服务即可。

## demo12: 搭建 SFC 开发环境

使用 `.vue` 文件来开发 vue 组件。因为服务端代码运行在 NODE 环境中，并不能识别 `.vue` 文件，所以此时我们连服务端代码都要进行打包构建了。

在模块构建时，不管是客户端还是服务端，现在都是需要使用 `vue-loader`来解析 `.vue`文件，又因为`vue-loader`依赖 vue 模板编译插件 `vue-template-compiler`，所以需要都安装。

> `vue / vue-server-renderer / vue-template-compiler` 三个包需要版本一致。

````bash
npm i -S vue-loader vue-template-compiler@2.6.12
````

一、将 `components.js` 的代码拆分成 ` App.vue / Home.vue / List.vue / Counter.vue`

二、打包构建的配置文件中添加`vue-loader`相关代码，并新增服务端构建配置文件

**客户端构建 webapck.client.config.js**

```js
const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: path.resolve(__dirname, '../entry-client.js'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'built-client-bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ]
}
```

**服务端构建 webapck.server.config.js**

```js
const path = require('path')

/**
 * 由于使用了 .vue 文件，所以需要使用 vue-loader
 */
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: path.resolve(__dirname, '../entry-server.js'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'built-server-bundle.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  // 关键点
  target: 'node',
  plugins: [
    new VueLoaderPlugin()
  ]
}
```

三、模板引用 `built-client-bundle.js`，服务器调用 `built-server-bundle.js`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>vue ssr</title>
  <script defer src="./dist/built-client-bundle.js"></script>
</head>
<body>
  <!--vue-ssr-outlet-->
</body>
</html>
```

```js
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
```

四、最后构建模块和运行服务

```bash
npx webapck --config webpack.client.config.js --progress
npx webapck --config webpack.server.config.js --progress
node server.js`
```

## demo13: Bundle Renderer

到目前为止，我们服务端渲染使用 `vue-server-renderer` 的 API 是：

```js
const vueServerRenderer = require('vue-server-renderer')
const template = fs.readFileSync('./index.template.html', 'utf-8')
const renderer = vueServerRenderer.createRenderer({
  template: template
})

renderer.renderToString(app, context, cb)
```

 这样每次编辑过应用程序源代码之后，都必须停止，重新构建依赖的 bundle ，并重启服务。实际开发中效率很低。另外，Node.js 本身不支持 source map，不利于开发调试。

`vue-server-renderer` 提供一个名为 `createBundleRenderer` 的 API，配合 `vue-server-renderer` 提供的两个分别用于客户端构建和服务端构建的插件，可以使开发上更有效率。

- 内置的 source map 支持（在 webpack 配置中使用 `devtool: 'source-map'`）
- 在开发环境甚至部署过程中热重载（通过读取更新后的 bundle，然后重新创建 renderer 实例）
- 关键 CSS(critical CSS) 注入（在使用 `*.vue` 文件时）：自动内联在渲染过程中用到的组件所需的CSS。
- 使用 [clientManifest](https://ssr.vuejs.org/zh/api/#clientmanifest) 进行资源注入：自动推断出最佳的预加载(preload)和预取(prefetch)指令，以及初始渲染所需的代码分割 chunk。

​	上述优点，最关键的是最后一步，对实际项目开发中非常有价值，省去了人工维护很多的依赖文件。

**客户端配置文件 webpack.client.config.js**

```js
const webpack = require('webpack')
const path = require('path')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: {
    app: path.resolve(__dirname, '../entry-client.js')
  },
  output: {
    path: path.resolve(__dirname, '../dist/client'),
    publicPath: '/dist/',
    filename: '[name].[chunkhash:8].js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "manifest",
      minChunks: Infinity
    }),
    new VueSSRClientPlugin(),
    new VueLoaderPlugin()
  ]
}
```

**服务端配置文件 webpack.server.config.js**

```js
const path = require('path')
const VueSSRServerPlugin = require('vue-server-renderer/server-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  entry: path.resolve(__dirname, '../entry-server.js'),
  output: {
    path: path.resolve(__dirname, '../dist/server'),
    filename: 'built-server-bundle.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  },
  target: 'node',
  devtool: 'source-map',
  plugins: [
    new VueSSRServerPlugin(),
    new VueLoaderPlugin()
  ]
}
```

上述构建配置，进行打包后：

- 服务端产生的文件: `dist/server/`
  - `vue-ssr-server-bundle.json`

- 客户端产生的文件：`dist/client/`
  - `vue-ssr-client-manifest.json`
  - manifest.xxxx.js
  - app.xxx.js

此时在服务端代码 server.js 文件需要这样修改：

```js
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
   * 使用 bundle renderer 之后，会自动完成 createApp 的调用，只需要传入 context
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
```

此时页面模板文件，更为干净，bundle renderer 返回时会自动添加上对应的 script

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>vue-ssr-bundle-render</title>
</head>
<body>
  <!--vue-ssr-outlet-->
</body>
</html>
```

`node server.js`开启服务后，打开首页返回的 html 结构如下，bundle render 会根据传入的 `json` 文件，自动添加一些需要的依赖，并添加对应的属性如 `preload / defer`等，进行页面渲染优化。

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>vue-ssr-bundle-render</title>
  <link rel="preload" href="/dist/manifest.d7ae4301.js" as="script">
  <link rel="preload" href="/dist/app.16fbf016.js" as="script">
</head>

<body>
  <div id="app" data-server-rendered="true" data-v-101b4966><a href="/" aria-current="page"
       class="router-link-exact-active router-link-active" data-v-101b4966>首页</a> <a href="/list/99"
       data-v-101b4966>列表</a>
    <div data-v-d0f197da data-v-101b4966>
      <h1 data-v-d0f197da>This is Home page!</h1>
    </div>
  </div>
  <script src="/dist/manifest.d7ae4301.js" defer></script>
  <script src="/dist/app.16fbf016.js" defer></script>
</body>

</html>
```

> 关于 bundle render 构建后的文件内容，更详细的介绍，参考 [Vue SSR深度剖析](https://zhuanlan.zhihu.com/p/61348429)

### SSR精髓

- 服务端将Vue组件渲染为HTML 字符串，并将html字符串直接发送到浏览器
- 每个请求都是独立的应用程序实例，不会有交叉请求造成的状态污染
