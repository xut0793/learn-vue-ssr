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