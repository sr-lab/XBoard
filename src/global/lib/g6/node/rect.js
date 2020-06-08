/**
 * Created by OXOYO on 2019/7/8.
 *
 * 矩形
 */

import utils from '../utils/index'

export default {
  name: 'x-rect',
  extendName: 'rect',
  options: {
    setState (name, value, item) {
      // 设置锚点激活
      utils.setAnchorActive(name, value, item)
      // Set shapeControl activation
      utils.setShapeControlActive(name, value, item)
    },
    // Attach anchor points after drawing
    afterDraw (cfg, group) {
      // Draw anchor
      utils.drawAnchor(cfg, group)
      // Draw shapeControl
      utils.drawShapeControl(cfg, group)
    }
  }
}
