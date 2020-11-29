<template>
  <div id="app">
    <nav>
      <router-link to="/">首页</router-link>
      <router-link to="/list/99">列表</router-link>
      <router-link to="/counter">计数器</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
  
}
</script>

<style lang="scss" scoped>

</style>