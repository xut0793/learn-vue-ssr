import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex)
function createStore() {
  const store = new Vuex.Store({
    state: {
      list: []
    },
    mutations: {
      SET_LIST(state, payload) {
        state.list = payload
      }
    },
    actions: {
      fetchList({ commit }, payload) {

        /**
         * 坑一： 需要区分浏览器客户端与服务端的环境区别
         * 服务端如果直接用 /，指向的是 localhost:80
         */
        if (typeof window !== 'undefined') {
          axios.default.baseURL = '/'
        } else {
          axios.defaults.baseURL = 'http://localhost:3000';
        }
        /**
         * 坑二：这里要 return 出去，因为 server.js 中需要在 resolved 后，在 then 中处理
         */
        console.log('payload params.id', payload);
        return axios.get(`/api/list`).then(res => {
          if (res.status === 200) {
            commit('SET_LIST', res.data)
          } else {
            return Promise.reject(res.statusText)
          }
        }).catch(err => {
          return Promise.reject(err)
        })
      }
    }
  })

  return store
}


export {
  createStore
}