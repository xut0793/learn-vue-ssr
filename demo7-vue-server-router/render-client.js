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
