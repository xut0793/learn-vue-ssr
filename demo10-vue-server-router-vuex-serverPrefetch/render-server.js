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