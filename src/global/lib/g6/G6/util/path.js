/**
 * @fileOverview path util
 * @author huangtonger@aliyun.com
 */
const G = require('@antv/g/lib');
const BaseUtil = require('./base');
const vec2 = BaseUtil.vec2;

module.exports = {
  getSpline(points) {
    const data = [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      data.push(point.x);
      data.push(point.y);
    }
    const splinePath = G.PathUtil.catmullRomToBezier(data);
    splinePath.unshift([ 'M', points[0].x, points[0].y ]);
    return splinePath;
  },
  /**
   * Calculate the control point according to the starting point, relative position and offset
   * @param {Object} startPoint Start point, including x,y
   * @param {Object} endPoint End point, including x,y
   * @param {Number} percent relative position, range 0-1
   * @param {Number} offset
   * @return {Object} control point, including x,y
   */
  getControlPoint(startPoint, endPoint, percent, offset) {
    const point = {
      x: (1 - percent) * startPoint.x + percent * endPoint.x,
      y: (1 - percent) * startPoint.y + percent * endPoint.y
    };
    const tangent = []; // Similar to the C language, it is really difficult to use
    vec2.normalize(tangent, [ endPoint.x - startPoint.x, endPoint.y - startPoint.y ]);
    const perpendicular = [ -tangent[1] * offset, tangent[0] * offset ];  // Vertical vector
    point.x += perpendicular[0];
    point.y += perpendicular[1];
    return point;
  }
};
