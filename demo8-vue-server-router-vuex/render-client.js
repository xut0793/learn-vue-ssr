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
