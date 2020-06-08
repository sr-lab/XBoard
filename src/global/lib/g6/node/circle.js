/**
 * Created by OXOYO on 2019/7/8.
 *
 *
 */

import utils from '../utils/index'

export default {
  name: 'x-circle',
  extendName: 'circle',
  options: {
    setState (name, value, item) {
      // Set anchor activation
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
