import { createApp } from './app.js'
const { App, store } = createApp()

/**
 * 使用 store 需要的额外代码
 * 用来同步服务端的 store　到客户端　store, 从而使其一致
 */
if (window.__INITIAL_STATE__) {
  store.replaceState(window.__INITIAL_STATE__)
}
App.$mount('#app')