// const Vue = require('vue')
// const { createRouter } = require('./router')
// const { createStore } = require('./store')
// const App = require('./index.vue')
import Vue from 'vue';
import { createRouter } from './router.js';
import { createStore } from './store.js';
import App from './index.vue';

function createApp() {
  const router = createRouter()
  const store = createStore()
  const app =  new Vue({
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

export { createApp }