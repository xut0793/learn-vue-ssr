// import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from './components/Home.vue';
import List from './components/List.vue';

// Vue.use(VueRouter)

const routes = [
  { path: '/', component: Home},
  { path: '/list/:id', component: List},
]

export function createRouter() {
  const router = new VueRouter({
    mode: 'history',
    routes
  })

  return router
}