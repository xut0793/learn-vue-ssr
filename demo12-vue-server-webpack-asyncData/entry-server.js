// const { createApp:_createApp } = require('./app')
import { createApp } from './app.js'

function _createApp(context) {
  return new Promise((resolve, reject) => {

    const { App, store, router } = createApp()
    const url = context.url
    console.log('router url', url)
    router.push(url)
    router.onReady(() => {
      console.log('router onready');
      const matchedComponents = router.getMatchedComponents()
      console.log('length', matchedComponents.length);
      if (!matchedComponents.length) {
        reject({code: 404, message: 'Not Found!'})
      }
      
      Promise.all(matchedComponents.map(Component => {
        console.log('http asyncdata', typeof Component.options.asyncData)
        if (Component.options.asyncData) {
          return Component.options.asyncData({
            store,
            route: router.currentRoute
          })
        }
        // if (Component.asyncData) {
        //   return Component.asyncData({
        //     store,
        //     route: router.currentRoute
        //   })
        // }
      }))
      .then(() => {
        resolve({App, store})
      })
      .catch(err => {
        reject({code: 500, message: 'asyncData is Error1'})
      })
    })
  })
}

export {
  _createApp
}