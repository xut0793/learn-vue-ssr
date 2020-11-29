import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import { createRouter } from './router.js';
import { createStore} from './store.js';
import App from './index.vue';

Vue.use(VueRouter)
Vue.use(Vuex)

export function createApp() {
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