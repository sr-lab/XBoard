/**
 * Created by OXOYO on 2019/7/11.
 *
 * 绘制图形控制
 */

import config from '../config/index'

export default function (cfg, group) {
  let { shapeControl, width, height, id } = cfg
  if (shapeControl && shapeControl.hasOwnProperty('controllers') && shapeControl.controllers.length) {
    for (let i = 0, len = shapeControl.controllers.length; i < len; i++) {
      let [x, y, cursor] = shapeControl.controllers[i]
      // Calculate Marker center point coordinates
      let originX = -width / 2
      let originY = -height / 2
      let anchorX = x * width + originX
      let anchorY = y * height + originY
      // Add Marker shape
      group.addShape('marker', {
        id: id + '_shape_control_point' + i,
        index: i,
        name: 'shapeControlPoint',
        attrs: {
          name: 'shapeControlPoint',
          x: anchorX,
          y: anchorY,
          // Raw location data
          position: {
            x,
            y
          },
          cursor: cursor || 'pointer',
          // Anchor default style
          ...config.shapeControl.style.default.point
        }
      })
    }
  }
}
