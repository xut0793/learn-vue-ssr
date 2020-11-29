const Vue = require('vue')
const { createRouter } = require('./router.js')
const { createStore } = require('./store.js')
const { App } = require('./components.js')

function createApp() {
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

exports.createApp = createApp