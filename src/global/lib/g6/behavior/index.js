/**
 * Created by OXOYO on 2019/7/4.
 *
 * 注册交互
 */


// Separate line drawing interaction
// import drawLine from './drawLine'
// Separate drag and drop interaction
// import dragNodeToEditor from './dragNodeToEditor'
// Separate graphical control interaction
// import shapeControl from './shapeControl'


// Integrated node control interaction
import nodeControl from './nodeControl'

const obj = {
  // drawLine,
  // dragNodeToEditor,
  // shapeControl,
  nodeControl
}

export default function (G6) {
  Object.values(obj).map(item => {
    G6.registerBehavior(item.name, item.options)
  })
}
