import { createApp as _createApp } from './app';

export function createApp(context) {
  return new Promise((resolve, reject) => {
    const { app, router, store } = _createApp()
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
