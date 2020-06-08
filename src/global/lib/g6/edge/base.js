/**
 * Created by OXOYO on 2019/8/7.
 *
 * 线条公共方法
 */

import utils from '../utils/index'

export default {
  draw (cfg, group) {
    const { startPoint, endPoint } = cfg
    const keyShape = group.addShape('path', {
      className: 'edge-shape',
      attrs: {
        ...cfg,
        path: [
          [ 'M', startPoint.x, startPoint.y ],
          [ 'L', endPoint.x, endPoint.y ]
        ]
      }
    })
    return keyShape
  },
  setState (name, value, item) {
    // Set line activation
    utils.setLineActive(name, value, item)
  }
}
