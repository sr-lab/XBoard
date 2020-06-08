/**
 * Created by OXOYO on 2019/7/16.
 *
 * 设置锚点激活
 */

import config from '../config/index'
import drawLineAnimate from './drawLineAnimate'
import destroyLineAnimate from './destroyLineAnimate'

export default function (name, value, item) {
  if (name === 'active') {
    let group = item.getContainer()
    let children = group.get('children')
    let line = children[0]
    // Handle line status
    if (line) {
      if (value) {
        line.attr(config.line.style.active)
        // Draw line animation
        drawLineAnimate(item.getModel(), item.getContainer())
      } else {
        line.attr(config.line.style.inactive)
        // Destroy line animation
        destroyLineAnimate(item.getModel(), item.getContainer())
      }
    }
  }
}
