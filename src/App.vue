/**
* Created by OXOYO on 2019/5/17.
*
* App
*/

<style scoped lang="less" rel="stylesheet/less"></style>

<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: 'App',
  created () {
    // Prevent browser default right-click menu
    document.oncontextmenu = function (event) {
      if (event.stopPropagation) {
        event.stopPropagation()
      }
      if (event.preventDefault) {
        event.preventDefault()
      }
    }
  }
}
</script>
