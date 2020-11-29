<template>
  <div>
    <h2>计数器</h2>
    <div>
      <button @click="minus">-</button>
      <span>{{number}}</span>
      <button @click="plus">+</button>
    </div>
  </div>
</template>

<script>
export default {
  name: "Counter",
  data() {
    return {
      number: 0
    }
  },
  methods: {
    minus() {
      this.number -= 1
    },
    plus() {
      this.number += 1
    }
  },
}
</script>

<style lang="scss" scoped>

</style>