const vueApp = new Vue({
  data: {
    title: 'Hello Vue SSSR -- event -- counter',
    count: 0
  },
  methods: {
    minus() {
      this.count -= 1
    },
    plus() {
      this.count += 1
    }
  },
  // $mount 的挂载点添加到这里 id="app"
  template: `<div id="app">
    <h1>{{ title }}</h1>
    <div>
      <button @click="minus">minus</button>
      <span>{{ count }}</span>
      <button @click="plus">plus</button>
    </div>
  </div>`
})
vueApp.$mount('#app', true)

