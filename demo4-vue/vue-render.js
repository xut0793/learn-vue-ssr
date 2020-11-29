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
