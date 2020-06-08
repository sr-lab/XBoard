/**
 * Created by OXOYO on 2019/8/7.
 *
 * TODO Polyline
 *
 * Doc：https://www.yuque.com/antv/blog/eyi70n
 */

// Polyline
export const polylineFinding = function (sNode, tNode, sPort, tPort, offset = 10) {
  const sourceBBox = sNode && sNode.getBBox ? sNode.getBBox() : getPointBBox(sPort)
  const targetBBox = tNode && tNode.getBBox ? tNode.getBBox() : getPointBBox(tPort)
  // Get the node offset area (extended area)
  const sBBox = getExpandedBBox(sourceBBox, offset)
  const tBBox = getExpandedBBox(targetBBox, offset)
  // Get start and end connection points on extended area
  const sPoint = getExpandedPort(sBBox, sPort, offset)
  const tPoint = getExpandedPort(tBBox, tPort, offset)
  // Get legal vertex set
  let points = getConnectablePoints(sBBox, tBBox, sPoint, tPoint)
  // Filter legal point sets, preprocessing, pruning, etc.
  filterConnectablePoints(points, sBBox)
  // Filter legal point sets, preprocessing, pruning, etc.
  filterConnectablePoints(points, tBBox)
  // Path finding with A-Star algorithm
  let polylinePoints = AStar(points, sPoint, tPoint, sBBox, tBBox)
  return polylinePoints
}

const getPointBBox = function (t) {
  return { centerX: t.x, centerY: t.y, minX: t.x, minY: t.y, maxX: t.x, maxY: t.y, height: 0, width: 0 }
}

// Get extended area
const getExpandedBBox = function (bbox, offset) {
  return bbox.width === 0 && bbox.height === 0 ? bbox : {
    centerX: bbox.centerX,
    centerY: bbox.centerY,
    minX: bbox.minX - offset,
    minY: bbox.minY - offset,
    maxX: bbox.maxX + offset,
    maxY: bbox.maxY + offset,
    height: bbox.height + 2 * offset,
    width: bbox.width + 2 * offset
  }
}

// Get the connection point on the extended area
const getExpandedPort = function (bbox, point) {
  // Determine which area of ​​the connection point is up, down, left and right, and add or subtract the offset to x or y accordingly
  if (Math.abs(point.x - bbox.centerX) / bbox.width > Math.abs(point.y - bbox.centerY) / bbox.height) {
    return {
      x: point.x > bbox.centerX ? bbox.maxX : bbox.minX,
      y: point.y
    }
  } else {
    return {
      x: point.x,
      y: point.y > bbox.centerY ? bbox.maxY : bbox.minY
    }
  }
}

// Get legal vertex set
const getConnectablePoints = function (sBBox, tBBox, sPoint, tPoint) {
  let lineBBox = getBBoxFromVertexes(sPoint, tPoint)
  let outerBBox = combineBBoxes(sBBox, tBBox)
  let points = []
  points.push(vertexOfBBox(sBBox))
  points.push(vertexOfBBox(tBBox))
  points.push(vertexOfBBox(lineBBox))
  const centerPoint = { x: outerBBox.centerX, y: outerBBox.centerY }
  let bboxes = [ outerBBox, sBBox, tBBox, lineBBox ]
  for (let bbox in bboxes) {
    // Intersect line containing bbox extension line and line segment
    points.push(crossPointsByLineAndBBox(bbox, centerPoint))
  }
  return points
}

const getBBoxFromVertexes = function (sPoint, tPoint) {
  const minX = Math.min(sPoint.x, tPoint.x)
  const maxX = Math.max(sPoint.x, tPoint.x)
  const minY = Math.min(sPoint.y, tPoint.y)
  const maxY = Math.max(sPoint.y, tPoint.y)

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    maxX: maxX,
    maxY: maxY,
    minX: minX,
    minY: minY,
    height: maxY - minY,
    width: maxX - minX
  }
}

const combineBBoxes = function (sBBox, tBBox) {
  const minX = Math.min(sBBox.minX, tBBox.minX)
  const minY = Math.min(sBBox.minY, tBBox.minY)
  const maxX = Math.max(sBBox.maxX, tBBox.maxX)
  const maxY = Math.max(sBBox.maxY, tBBox.maxY)

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    minX: minX,
    minY: minY,
    maxX: maxX,
    maxY: maxY,
    height: maxY - minY,
    width: maxX - minX
  }
}

const vertexOfBBox = function (bbox) {
  return [
    { x: bbox.minX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.minY },
    { x: bbox.maxX, y: bbox.maxY },
    { x: bbox.minX, y: bbox.maxY }
  ]
}

const crossPointsByLineAndBBox = function (bbox, centerPoint) {
  let crossPoints = []
  if (!(centerPoint.x < bbox.minX || centerPoint.x > bbox.maxX)) {
    crossPoints = [
      ...crossPoints,
      { x: centerPoint.x, y: bbox.minY },
      { x: centerPoint.x, y: bbox.maxY }
    ]
  }
  if (!(centerPoint.y < bbox.minY || centerPoint.y > bbox.maxY)) {
    crossPoints = [
      ...crossPoints,
      { x: bbox.minX, y: centerPoint.y },
      { x: bbox.maxX, y: centerPoint.y }
    ]
  }

  return crossPoints
}

// Filter connection points
const filterConnectablePoints = function (points, bbox) {
  return points.filter(point => {
    return point.x <= bbox.minX || point.x >= bbox.maxX || point.y <= bbox.minY || point.y >= bbox.maxY
  })
}

const crossBBox = function (bboxes, p1, p2) {
  for (let i = 0; i < bboxes.length; i++) {
    const bbox = bboxes[i]
    if (p1.x === p2.x && bbox.minX < p1.x && bbox.maxX > p1.x) {
      if ((p1.y < bbox.maxY && p2.y >= bbox.maxY) || (p2.y < bbox.maxY && p1.y >= bbox.maxY)) {
        return true
      }
    } else if (p1.y === p2.y && bbox.minY < p1.y && bbox.maxY > p1.y) {
      if ((p1.x < bbox.maxX && p2.x >= bbox.maxX) || (p2.x < bbox.maxX && p1.x >= bbox.maxX)) {
        return true
      }
    }
  }
  return false
}

const getCost = function (p1, p2) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y)
}

// aStar Pathfinder
const AStar = function (points, sPoint, tPoint, sBBox, tBBox) {
  const openList = [sPoint]
  const closeList = []
  // points = _.uniqBy(this.fillId(points),'id')
  points.push(tPoint)
  let endPoint
  while (openList.length > 0) {
    let minCostPoint
    openList.forEach((p, i) => {
      if (!p.parent) {
        p.f = 0
      }
      if (!minCostPoint) {
        minCostPoint = p
      }
      if (p.f < minCostPoint.f) {
        minCostPoint = p
      }
    })
    if (minCostPoint.x === tPoint.x && minCostPoint.y === tPoint.y) {
      endPoint = minCostPoint
      break
    }
    openList.splice(openList.findIndex(o => o.x === minCostPoint.x && o.y === minCostPoint.y), 1)
    closeList.push(minCostPoint)
    const neighbor = points.filter(p => {
      return (p.x === minCostPoint.x || p.y === minCostPoint.y) &&
        !(p.x === minCostPoint.x && p.y === minCostPoint.y) &&
        !crossBBox([sBBox, tBBox], minCostPoint, p)
      }
    )
    neighbor.forEach(p => {
      const inOpen = openList.find(o => o.x === p.x && o.y === p.y)
      const currentG = getCost(p, minCostPoint)
      if (inOpen) {
        if (p.g > currentG) {
          p.parent = minCostPoint
          p.g = currentG
          p.f = p.g + p.h
        }
      } else {
        p.parent = minCostPoint
        p.g = currentG
        let h = getCost(p, tPoint)
        if (crossBBox([tBBox], p, tPoint)) {
          // If you cross the bbox, the estimated cost of increasing this point is half of the perimeter of the bbox
          h += (tBBox.width / 2 + tBBox.height / 2)
        }
        p.h = h
        p.f = p.g + p.h
        openList.push(p)
      }
    })
  }
  if (endPoint) {
    const result = []
    result.push({
      x: endPoint.x,
      y: endPoint.y
    })
    while (endPoint.parent) {
      endPoint = endPoint.parent
      result.push({
        x: endPoint.x,
        y: endPoint.y
      })
    }
    return result.reverse()
  }
  return []
}
