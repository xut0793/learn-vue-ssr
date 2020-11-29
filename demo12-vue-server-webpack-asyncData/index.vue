<template>
<div id="app">
  <router-link to="/">首页</router-link>
  <router-link to="/list/99">列表</router-link>
  <router-view></router-view>
</div>
</template>

<script>
export default {
  name: "App",
  
}
</script>

<style lang="scss" scoped>

</style>