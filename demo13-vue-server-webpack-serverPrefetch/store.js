import Vuex from 'vuex';
import Vue from 'vue';
import axios from 'axios';

Vue.use(Vuex)
export function createStore() {
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
        console.log('payload params.id', payload);
        /**
         * 坑一： 需要区分浏览器客户端与服务端的环境区别
         * 服务端如果直接用 /，指向的是 localhost:80
         */
        if (typeof window !== 'undefined') {
          axios.default.baseURL = '/'
        } else {
          axios.defaults.baseURL = 'http://localhost:8000';
        }

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