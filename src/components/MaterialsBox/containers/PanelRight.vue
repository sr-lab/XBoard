/**
* Created by OXOYO on 2019/7/2.
*
* PanelRight 右侧面板
*/

<style scoped lang="less" rel="stylesheet/less"></style>

<template>
  <CardBox placement="right" :width="300">
    <!-- FIXME Temporarily note the Options configuration panel, this function is highly coupled with ToolBar -->
    <!--
    <CardItem title="配置" :enableFold="true">
      <Options></Options>
    </CardItem>
    -->
    <CardItem title="导航栏" :enableFold="true">
      <Navigator></Navigator>
    </CardItem>
  </CardBox>
</template>

<script>
  import CardBox from '../components/CardBox'
  import CardItem from '../components/CardItem'
  // import Options from '../components/Options'
  import Navigator from '../components/Navigator'

  export default {
    name: 'PanelRight',
    components: {
      CardBox,
      CardItem,
      // Options,
      Navigator
    }
  }
</script>
