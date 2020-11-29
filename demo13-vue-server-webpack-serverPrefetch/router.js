import VueRouter from 'vue-router';
import Vue from 'vue';
import Home from './components/Home.vue';
import List from './components/List.vue';
import Counter from './components/Counter.vue';

Vue.use(VueRouter)
const routes = [
  {path: '/', component: Home},
  {path: '/list/:id', component: List},
  {path: '/counter', component: Counter}
]

export function createRouter() {
  const router = new VueRouter({
    mode: 'history',
    routes
  })

  return router
}