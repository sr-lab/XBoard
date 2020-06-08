/**
 * @fileOverview math util
 * @author huangtonger@aliyun.com
 */

const BaseUtil = require('./base');
const tolerance = 0.001;
const MathUtil = {
  /**
   * Is it in the interval
   * @param {number} value
   * @param {number} min minimum value
   * @param {number} max
   * @return {boolean} bool Boolean
   */
  isBetween(value, min, max) {
    return value >= min && value <= max;
  },
  /**
   * Intersection of two line segments
   * @param {object} p0 starting point of the first line
   * @param {object} p1 The end of the first line
   * @param {object} p2 starting point of the second line
   * @param {object} p3 End of the second line
   * @return {object} intersection
   */
  getLineIntersect(p0, p1, p2, p3) {
    const E = {
      x: p2.x - p0.x,
      y: p2.y - p0.y
    };
    const D0 = {
      x: p1.x - p0.x,
      y: p1.y - p0.y
    };
    const D1 = {
      x: p3.x - p2.x,
      y: p3.y - p2.y
    };
    const kross = D0.x * D1.y - D0.y * D1.x;
    const sqrKross = kross * kross;
    const sqrLen0 = D0.x * D0.x + D0.y * D0.y;
    const sqrLen1 = D1.x * D1.x + D1.y * D1.y;
    let point = null;
    if (sqrKross > tolerance * sqrLen0 * sqrLen1) {
      const s = (E.x * D1.y - E.y * D1.x) / kross;
      const t = (E.x * D0.y - E.y * D0.x) / kross;
      if (MathUtil.isBetween(s, 0, 1) && MathUtil.isBetween(t, 0, 1)) {
        point = {
          x: p0.x + s * D0.x,
          y: p0.y + s * D0.y
        };
      }
    }
    return point;
  },
  /**
   * point and rectangular intersection point
   * @param  {object} rect  rect
   * @param  {object} point point
   * @return {object} rst;
   */
  getRectIntersectByPoint(rect, point) {
    const { x, y, width, height } = rect;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const points = [];
    const center = {
      x: cx,
      y: cy
    };
    points.push({
      x,
      y
    });
    points.push({
      x: x + width,
      y
    });
    points.push({
      x: x + width,
      y: y + height
    });
    points.push({
      x,
      y: y + height
    });
    points.push({
      x,
      y
    });
    let rst = null;
    for (let i = 1; i < points.length; i++) {
      rst = MathUtil.getLineIntersect(points[i - 1], points[i], center, point);
      if (rst) {
        break;
      }
    }
    return rst;
  },
  /**
   * get point and circle inIntersect
   * @param {Object} circle Dot, x,y,r
   * @param {Object} point x,y
   * @return {object} applied point
   */
  getCircleIntersectByPoint(circle, point) {
    const cx = circle.x;
    const cy = circle.y;
    const r = circle.r;
    const { x, y } = point;
    const d = Math.sqrt(Math.pow((x - cx), 2) + Math.pow((y - cy), 2));
    if (d < r) {
      return null;
    }
    const dx = (x - cx);
    const dy = (y - cy);
    const signX = Math.sign(dx);
    const signY = Math.sign(dy);
    const angle = Math.atan(dy / dx);
    return {
      x: cx + Math.abs(r * Math.cos(angle)) * signX,
      y: cy + Math.abs(r * Math.sin(angle)) * signY
    };
  },
  /**
   * get point and ellipse inIntersect
   * @param {Object} ellipse Ellipse x,y,rx,ry
   * @param {Object} point x,y
   * @return {object} applied point
   */
  getEllispeIntersectByPoint(ellipse, point) {
    // Calculate the intersection of the line segment (point.x, point.y) to (ellipse.x, ellipse.y) and the ellipse
    const a = ellipse.rx;
    const b = ellipse.ry;
    const cx = ellipse.x;
    const cy = ellipse.y;
    // const c = Math.sqrt(a * a - b * b); // focal length
    const dx = (point.x - cx);
    const dy = (point.y - cy);
    let angle = Math.atan2(dy / b, dx / a); // Find the angle directly by x,y, the range is -PI, PI
    if (angle < 0) {
      angle += 2 * Math.PI; // Convert to 0, 2PI
    }
    // Find the intersection point through the parametric equation
    // const r = (b * b) / (a - c * Math.sin(angle));
    return {
      x: cx + a * Math.cos(angle),
      y: cy + b * Math.sin(angle)
    };
  },
  /**
   * coordinate matrix transformation
   * @param  {number} point   coordinate
   * @param  {number} matrix  matrix
   * @param  {number} tag     could be 0 or 1
   * @return {object} transformed point
   */
  applyMatrix(point, matrix, tag = 1) {
    const vector = [ point.x, point.y, tag ];
    BaseUtil.vec3.transformMat3(vector, vector, matrix);
    return {
      x: vector[0],
      y: vector[1]
    };
  },
  /**
   * coordinate matrix invert transformation
   * @param  {number} point   coordinate
   * @param  {number} matrix  matrix
   * @param  {number} tag     could be 0 or 1
   * @return {object} transformed point
   */
  invertMatrix(point, matrix, tag = 1) {
    const inversedMatrix = BaseUtil.mat3.invert([], matrix);
    const vector = [ point.x, point.y, tag ];
    BaseUtil.vec3.transformMat3(vector, vector, inversedMatrix);
    return {
      x: vector[0],
      y: vector[1]
    };
  }
};
module.exports = BaseUtil.mix({}, BaseUtil, MathUtil);
