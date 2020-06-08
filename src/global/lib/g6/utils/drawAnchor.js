/**
 * Created by OXOYO on 2019/7/8.
 *
 * 绘制锚点
 */

import config from '../config/index'

export default function (cfg, group) {
  let { anchorPoints, width, height, id } = cfg
  if (anchorPoints && anchorPoints.length) {
    for (let i = 0, len = anchorPoints.length; i < len; i++) {
      let [x, y] = anchorPoints[i]
      // Calculate Marker center point coordinates
      let originX = -width / 2
      let originY = -height / 2
      let anchorX = x * width + originX
      let anchorY = y * height + originY
      // Add Marker shape
      group.addShape('marker', {
        id: id + '_anchor_' + i,
        attrs: {
          name: 'anchor',
          x: anchorX,
          y: anchorY,
          // Anchor default style
          ...config.anchor.style.default
        }
      })
    }
  }
}
