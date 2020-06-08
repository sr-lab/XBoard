/**
 * @fileOverview graphic util
 * @author huangtonger@aliyun.com
 */

const MathUtil = require('./math');
const BaseUtil = require('./base');
const Global = require('../global');
const PI = Math.PI;
const sin = Math.sin;
const cos = Math.cos;
// A total of 8 directions of self-loops are supported, and the angle occupied by each ring is 45 degrees, which is divided into two points when calculating, it is 22.5 degrees
const SELF_LINK_SIN = sin(PI / 8);
const SELF_LINK_COS = cos(PI / 8);


function traverse(data, fn) {
  if (fn(data) === false) {
    return;
  }
  BaseUtil.each(data.children, child => {
    traverse(child, fn);
  });
}

const GraphicUtil = {
  getBBox(element, parent) {
    const bbox = element.getBBox();
    let leftTop = {
      x: bbox.minX,
      y: bbox.minY
    };
    let rightBottom = {
      x: bbox.maxX,
      y: bbox.maxY
    };
    // Transform matrix according to parent element
    if (parent) {
      const matrix = parent.getMatrix();
      leftTop = MathUtil.applyMatrix(leftTop, matrix);
      rightBottom = MathUtil.applyMatrix(rightBottom, matrix);
    }

    return {
      minX: leftTop.x,
      minY: leftTop.y,
      maxX: rightBottom.x,
      maxY: rightBottom.y
    };
  },
  // Get the self-loop side configuration of an element
  getLoopCfgs(cfg) {
    const item = cfg.sourceNode || cfg.targetNode;
    const containerMatrix = item.get('group')
      .getMatrix();
    const bbox = item.getKeyShape()
      .getBBox();
    const loopCfg = cfg.loopCfg || {};
    // The highest distance from the keyShape side
    const dist = loopCfg.dist || Math.max(bbox.width, bbox.height) * 2;
    // Relative position relationship between self-ring edge and keyShape
    const position = loopCfg.position || Global.loopPosition;
    const r = Math.max(bbox.width, bbox.height) / 2;
    const scaleRate = (r + dist) / r;
    // The center takes the real position on the group
    const center = [ containerMatrix[ 6 ], containerMatrix[ 7 ] ];
    const sinDelta = r * SELF_LINK_SIN;
    const cosDelta = r * SELF_LINK_COS;
    let startPoint = [ cfg.startPoint.x, cfg.startPoint.y ];
    let endPoint = [ cfg.endPoint.x, cfg.endPoint.y ];
    // If the anchor point is defined, the anchor point coordinates are used directly, otherwise, it is calculated according to the self-loop cfg
    if (startPoint[0] === endPoint[0] && startPoint[1] === endPoint[1]) {
      switch (position) {
        case 'top':
          startPoint = [ center[0] - sinDelta, center[1] - cosDelta ];
          endPoint = [ center[0] + sinDelta, center[1] - cosDelta ];
          break;
        case 'top-right':
          startPoint = [ center[0] + sinDelta, center[1] - cosDelta ];
          endPoint = [ center[0] + cosDelta, center[1] - sinDelta ];
          break;
        case 'right':
          startPoint = [ center[0] + cosDelta, center[1] - sinDelta ];
          endPoint = [ center[0] + cosDelta, center[1] + sinDelta ];
          break;
        case 'bottom-right':
          startPoint = [ center[0] + cosDelta, center[1] + sinDelta ];
          endPoint = [ center[0] + sinDelta, center[1] + cosDelta ];
          break;
        case 'bottom':
          startPoint = [ center[0] + sinDelta, center[1] + cosDelta ];
          endPoint = [ center[0] - sinDelta, center[1] + cosDelta ];
          break;
        case 'bottom-left':
          startPoint = [ center[0] - sinDelta, center[1] + cosDelta ];
          endPoint = [ center[0] - cosDelta, center[1] + sinDelta ];
          break;
        case 'left':
          startPoint = [ center[0] - cosDelta, center[1] + sinDelta ];
          endPoint = [ center[0] - cosDelta, center[1] - sinDelta ];
          break;
        case 'top-left':
          startPoint = [ center[0] - cosDelta, center[1] - sinDelta ];
          endPoint = [ center[0] - sinDelta, center[1] - cosDelta ];
          break;
        default:
          startPoint = [ center[0] - sinDelta, center[1] - cosDelta ];
          endPoint = [ center[0] + sinDelta, center[1] - cosDelta ];
      }
      // If drawing counterclockwise, swap the start and end points
      if (loopCfg.clockwise === false) {
        const swap = [ startPoint[0], startPoint[1] ];
        startPoint = [ endPoint[0], endPoint[1] ];
        endPoint = [ swap[0], swap[1] ];
      }
    }
    const startVec = [ startPoint[0] - center[0], startPoint[1] - center[1] ];
    const startExtendVec = BaseUtil.vec2.scale([], startVec, scaleRate);
    const controlPoint1 = [ center[0] + startExtendVec[0], center[1] + startExtendVec[1] ];
    const endVec = [ endPoint[0] - center[0], endPoint[1] - center[1] ];
    const endExtendVec = BaseUtil.vec2.scale([], endVec, scaleRate);
    const controlPoint2 = [ center[0] + endExtendVec[0], center[1] + endExtendVec[1] ];
    cfg.startPoint = { x: startPoint[0], y: startPoint[1] };
    cfg.endPoint = { x: endPoint[0], y: endPoint[1] };
    cfg.controlPoints = [
      { x: controlPoint1[0], y: controlPoint1[1] },
      { x: controlPoint2[0], y: controlPoint2[1] }
    ];
    return cfg;
  },
  traverseTree(data, fn) {
    if (typeof fn !== 'function') {
      return;
    }
    traverse(data, fn);
  },
  radialLayout(data, layout) {
    // The layout methods are H / V / LR / RL / TB / BT
    const VERTICAL_LAYOUTS = [ 'V', 'TB', 'BT' ];
    const min = {
      x: Infinity,
      y: Infinity
    };
    const max = {
      x: -Infinity,
      y: -Infinity
    };
    // The default layout is the vertical layout TB, where x corresponds to rad and y corresponds to r
    let rScale = 'x';
    let radScale = 'y';
    if (layout && VERTICAL_LAYOUTS.indexOf(layout) >= 0) {
      // In the horizontal layout, y corresponds to rad and x corresponds to r
      radScale = 'x';
      rScale = 'y';
    }
    let count = 0;
    this.traverseTree(data, node => {
      count++;
      if (node.x > max.x) {
        max.x = node.x;
      }
      if (node.x < min.x) {
        min.x = node.x;
      }
      if (node.y > max.y) {
        max.y = node.y;
      }
      if (node.y < min.y) {
        min.y = node.y;
      }
    });
    const avgRad = PI * 2 / count;
    const radDiff = max[radScale] - min[radScale];
    if (radDiff === 0) {
      return data;
    }

    this.traverseTree(data, node => {
      const radial = (node[radScale] - min[radScale]) / radDiff * (PI * 2 - avgRad) + avgRad;
      const r = Math.abs(rScale === 'x' ? node.x - data.x : node.y - data.y);
      node.x = r * Math.cos(radial);
      node.y = r * Math.sin(radial);
    });
    return data;
  },
  /**
   * Calculate the label coordinates based on the percentage of the line where the label is located
   * @param {object} pathShape G path instance, generally the keyShape of Edge instance
   * @param {number} percent The percentage of lines in the range 0-1
   * @param {number} refX label offset based on the positive x-axis direction
   * @param {number} refY label offset based on the positive y-axis direction
   * @param {boolean} rotate whether to rotate the text according to the line slope
   * @return {object} text x, y, text rotation angle
   */
  getLabelPosition(pathShape, percent, refX, refY, rotate) {
    const TAN_OFFSET = 0.0001;
    let vector = [];
    const point = pathShape.getPoint(percent);
    // Head and tail are the most likely, put in the front, using the method encapsulated on g path
    if (percent < TAN_OFFSET) {
      vector = pathShape.getStartTangent().reverse();
    } else if (percent > (1 - TAN_OFFSET)) {
      vector = pathShape.getEndTangent();
    } else {
      // Otherwise, take the point at the specified position and the point with a small offset to make the differential vector
      const offsetPoint = pathShape.getPoint(percent + TAN_OFFSET);
      vector.push([ point.x, point.y ]);
      vector.push([ offsetPoint.x, offsetPoint.y ]);
    }
    let rad = Math.atan2(vector[1][1] - vector[0][1], vector[1][0] - vector[0][0]);
    if (rad < 0) {
      rad += PI * 2;
    }
    if (refX) {
      point.x += cos(rad) * refX;
      point.y += sin(rad) * refX;
    }
    if (refY) {
      // The default direction is the positive direction of the x-axis, and the normal is to find the angle-90°
      let normal = rad-PI / 2;
      // If the normal angle is in the negative direction of the y-axis, cut to the positive direction to ensure that refY is relative to the positive direction of the y-axis
      if (rad > 1 / 2 * PI && rad < 3 * 1 / 2 * PI) {
        normal -= PI;
      }
      point.x += cos(normal) * refY;
      point.y += sin(normal) * refY;
    }
    // Requires original rotation angle calculation textAlign
    const result = {
      x: point.x,
      y: point.y,
      angle: rad
    };
    if (rotate) {
      if (rad > 1 / 2 * PI && rad < 3 * 1 / 2 * PI) {
        rad -= PI;
      }
      return {
        rotate: rad,
        ...result
      };
    }
    return result;
  }
};

module.exports = GraphicUtil;
