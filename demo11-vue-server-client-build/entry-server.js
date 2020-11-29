const { createApp } = require('./app.js')

function _createApp(context) {
  return new Promise((resolve, reject) => {
    const { app, router, store } = createApp()
    const { url } = context
    router.push(url)
    router.onReady(() => {
      context.rendered = () => {
        context.state = store.state
      }
      resolve(app)
    }, reject)
  })
}

exports.createApp = _createApp