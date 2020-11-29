<template>
  <div class="list-wrapper">
    <h1>列表页</h1>
    <h4>数据预取，Vue 提供用于服务端的选项：serverPrefetch </h4>
    <ul v-for="(item, index) in list" :key="index">
      <li>{{index}}: {{ item }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "List",
  computed: {
    list() {
      return this.$store.state.list
    }
  },
  /**
   * serverPrefetch 在 Vue 中是作为其生命周期的一个钩子函数，LIFECYCLE_HOOKS，所以它可以像其它钩子一样作为函数调用，或者定义多个，或者直接定义成数组
   * 在 Vue 解析之后最终会像其它钩子函数一样变成数组形式。
   * 区别是：serverPrefetch 钩子只在 Vue 服务端渲染的包 vue-server-renderer 内部被自动调用。调用时机在模板 compiler 编译后，在 vm._render 前自动调用该函数
   * 在客户端渲染时不会被调用，所以需要在客户端生命周期钩子中手动调用。它挂载在 this.$options.__proto__ 原型对象上。
   */
  async serverPrefetch() {
    return await this.$store.dispatch('fetchList', this.$route.params.id)
  },
  /**
   * 也可以写成函数形式,可以触发多个请求
   * 但这时，beforeMount 里的代码需要对应函数获取
   */
  // serverPrefetch: [
  //   async () => await this.$store.dispatch('fetchList', this.$route.params.id),
  // ],
  /**
   * 客户端渲染时，通过 beforeMount 生命周期钩子请求数据用于渲染
   * 不能将数据请求放在 beforeCreate/created 中，不然会导致服务端和客户端重复请求数据，因为该钩子函数在服务端和客户端都会触发
   */
  beforeMount() {
    /**
     * 在客户端 serverPrefetch 始终被 Vue 解析成数组
     */
    let handlers = this.$options.serverPrefetch;
    if (typeof handlers !== 'undefined') {
      if (!Array.isArray(handlers)) { handlers = [handlers]; }
      try {
        let promises = [];
        for (let i = 0, j = handlers.length; i < j; i++) {
          /**
           * 坑： serverPrefetch 内的需要使用 call 绑定调用上下文
           */
          let result = handlers[i].call(this, this);
          if (result && typeof result.then === 'function') {
            promises.push(result);
          }
        }
        Promise.all(promises).then(() => {
          console.log('serverPrefetch called')
        }).catch(e => console.error(e));
        return

      } catch (e) {
        console.error(e);;
      }
    }
  },
  
}
</script>

<style lang="scss" scoped>

</style>