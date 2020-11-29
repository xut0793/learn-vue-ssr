<template>
  <div>
    <h1>SSR 数据预取</h1>
    <ul>
      <li v-for="(item, index) in list" :key="item">列表{{ index }}: {{ item }}</li>
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
  asyncData({ store, route }) {
    /**
     * 这里要 return 出去，因为 server.js 中需要在 resolved 后，在 then 中处理
     */
    return store.dispatch('fetchList', route.params.id)
  },
  beforeMount() {
    const { $options: { asyncData }, $store:store, $route:route } = this
    asyncData({store, route}).then(() => {
      console.log('async data is successed');
    })
  },
}
</script>

<style lang="scss" scoped>

</style>