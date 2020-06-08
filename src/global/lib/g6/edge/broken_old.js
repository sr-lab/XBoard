/**
 * Created by OXOYO on 2019/7/11.
 *
 * 折线
 */

import base from './base'

const defConfig = {
  margin: 80,
  maxDistance: 100
}

export default {
  name: 'x-broken',
  extendName: 'line',
  options: {
    ...base,
    draw (cfg, group) {
      const { startPoint, endPoint } = cfg
      // route plan
      let path = []
      if (startPoint && startPoint.x !== null && startPoint.y !== null) {
        // starting point
        path.push([ 'M', startPoint.x, startPoint.y ])
      }
      if (endPoint && endPoint.hasOwnProperty('x') && endPoint.hasOwnProperty('y')) {
        // Find the first inflection point according to the endpoint type
        let turnOne = {}
        // Find the second inflection point according to the mouse position
        let turnTwo = {}
        switch (startPoint.anchorIndex) {
          // top
          case 0:
            turnOne = {
              x: startPoint.x,
              y: startPoint.y - Math.abs(startPoint.y - endPoint.y) / 2
            }
            turnTwo = {
              x: endPoint.x,
              y: turnOne.y
            }
            break
          // right
          case 3:
            turnOne = {
              x: startPoint.x + Math.abs(endPoint.x - startPoint.x) / 2,
              y: startPoint.y
            }
            turnTwo = {
              x: turnOne.x,
              y: endPoint.y
            }
            break
          // bottom
          case 1:
            turnOne = {
              x: startPoint.x,
              y: startPoint.y + Math.abs(endPoint.y - startPoint.y) / 2
            }
            turnTwo = {
              x: endPoint.x,
              y: turnOne.y
            }
            break
          // left
          case 2:
            turnOne = {
              x: startPoint.x - Math.abs(startPoint.x - endPoint.x) / 2,
              y: startPoint.y
            }
            turnTwo = {
              x: turnOne.x,
              y: endPoint.y
            }
            break
        }
        // FIXME ??? What if the inflection point is calculated in a loop
        let turnPointArr = [
          turnOne,
          turnTwo
        ]
        let getTurnPoint = function () {
          let latPoint
          let nextPoint = {
            ...endPoint
          }
          let flag = false
          if (turnPointArr.length) {
            latPoint = turnPointArr[turnPointArr.length - 1]
          } else {
            latPoint = turnTwo
          }
          // Calculate the next inflection point based on the position of the mouse and the last inflection point
          if (nextPoint.x - latPoint.x > defConfig.maxDistance) {
            nextPoint = {
              ...nextPoint,
              x: latPoint.x + defConfig.maxDistance
            }
            flag = true
          } else if (latPoint.x - nextPoint.x > defConfig.maxDistance) {
            nextPoint = {
              ...nextPoint,
              x: latPoint.x - defConfig.maxDistance
            }
            flag = true
          }
          if (nextPoint.y - latPoint.y > defConfig.maxDistance) {
            nextPoint = {
              ...nextPoint,
              y: latPoint.y + defConfig.maxDistance
            }
            flag = true
          } else if (latPoint.y - nextPoint.y > defConfig.maxDistance) {
            nextPoint = {
              ...nextPoint,
              y: latPoint.y - defConfig.maxDistance
            }
            flag = true
          }
          // After calculation, insert the next node
          if (flag) {
            turnPointArr.push(nextPoint)
            getTurnPoint()
          }
        }
        getTurnPoint()
        turnPointArr.push(endPoint)
        for (let i = 0, len = turnPointArr.length, item; i < len; i++) {
          item = turnPointArr[i]
          path.push([ 'L', item.x, item.y ])
        }
      }
      const keyShape = group.addShape('path', {
        className: 'edge-shape',
        attrs: {
          ...cfg,
          path: path
        }
      })
      return keyShape
    },
    getControlPoints (cfg) {
      const { startPoint, endPoint } = cfg
      // route plan
      let path = []
      if (startPoint && startPoint.x !== null && startPoint.y !== null) {
        // starting point
        path.push({ x: startPoint.x, y: startPoint.y })
      }
      if (endPoint && endPoint.hasOwnProperty('x') && endPoint.hasOwnProperty('y')) {
        // Find the first inflection point according to the endpoint type
        let turnOne = {}
        // Find the second inflection point according to the mouse position
        let turnTwo = {}
        switch (startPoint.anchorIndex) {
          // top
          case 0:
            turnOne = {
              x: startPoint.x,
              y: startPoint.y - Math.abs(startPoint.y - endPoint.y) / 2
            }
            turnTwo = {
              x: endPoint.x,
              y: turnOne.y
            }
            break
          // right
          case 3:
            turnOne = {
              x: startPoint.x + Math.abs(endPoint.x - startPoint.x) / 2,
              y: startPoint.y
            }
            turnTwo = {
              x: turnOne.x,
              y: endPoint.y
            }
            break
          // bottom
          case 1:
            turnOne = {
              x: startPoint.x,
              y: startPoint.y + Math.abs(endPoint.y - startPoint.y) / 2
            }
            turnTwo = {
              x: endPoint.x,
              y: turnOne.y
            }
            break
          // left
          case 2:
            turnOne = {
              x: startPoint.x - Math.abs(startPoint.x - endPoint.x) / 2,
              y: startPoint.y
            }
            turnTwo = {
              x: turnOne.x,
              y: endPoint.y
            }
            break
        }
        // FIXME ??? What if the inflection point is calculated in a loop
        let turnPointArr = [
          turnOne,
          turnTwo
        ]
        let getTurnPoint = function () {
          let latPoint
          let nextPoint = {
            ...endPoint
          }
          let flag = false
          if (turnPointArr.length) {
            latPoint = turnPointArr[turnPointArr.length - 1]
          } else {
            latPoint = turnTwo
          }
          // Calculate the next inflection point based on the position of the mouse and the last inflection point
          if (nextPoint.x - latPoint.x > defConfig.maxDistance) {
            nextPoint = {
              ...nextPoint,
              x: latPoint.x + defConfig.maxDistance
            }
            flag = true
          } else if (latPoint.x - nextPoint.x > defConfig.maxDistance) {
            nextPoint = {
              ...nextPoint,
              x: latPoint.x - defConfig.maxDistance
            }
            flag = true
          }
          if (nextPoint.y - latPoint.y > defConfig.maxDistance) {
            nextPoint = {
              ...nextPoint,
              y: latPoint.y + defConfig.maxDistance
            }
            flag = true
          } else if (latPoint.y - nextPoint.y > defConfig.maxDistance) {
            nextPoint = {
              ...nextPoint,
              y: latPoint.y - defConfig.maxDistance
            }
            flag = true
          }
          // After calculation, insert the next node
          if (flag) {
            turnPointArr.push(nextPoint)
            getTurnPoint()
          }
        }
        getTurnPoint()
        turnPointArr.push(endPoint)
        for (let i = 0, len = turnPointArr.length, item; i < len; i++) {
          item = turnPointArr[i]
          path.push({ x: item.x, y: item.y })
        }
      }
      return path
    },
    getPath (points) {
      const path = []
      points.forEach((point, index) => {
        if (!index) {
          path.push([ 'M', point.x, point.y ])
        } else {
          path.push([ 'L', point.x, point.y ])
        }
      })
      console.log('path', path)
      return path
    }
  }
}
