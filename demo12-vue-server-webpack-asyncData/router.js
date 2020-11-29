// const Vue = require('vue')
// const VueRouter = require('vue-router')
// const Home = require('./components/Home.vue')
// const List = require('./components/List.vue')

import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from './components/Home.vue';
import List from './components/List.vue';

Vue.use(VueRouter)
function createRouter() {

  const routes = [
    { path: '/', component: Home},
    { path: '/list/:id', component: List},
  ]
  
  const router = new VueRouter({
    mode: 'history',
    routes
  })

  return router
}

// exports.createRouter = createRouter
export {
  createRouter
}