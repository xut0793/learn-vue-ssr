import { createApp } from './app.js';

export default (context) => {
  return new Promise((reslove, reject) => {
    const { app, router, store } = createApp()
    
    router.push(context.url)
    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents()

      if (!matchedComponents.length) {
        return reject({code: 404, message: 'Not Found!'})
      }

      Promise.all(matchedComponents.map(Component => {
        if (Component.asyncData) {
          return Component.asyncData({
            store,
            route: router.currentRoute
          })
        }
      })).then(() => {
        reslove(app)
      }).catch(reject)
    })
  })
}