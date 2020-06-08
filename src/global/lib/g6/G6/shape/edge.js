/**
 * @fileOverview custom edge
 * @description There is a lot of logic in the custom edge that is the same as the custom node. Although it can be extracted as a mixin, it is still implemented separately considering the readability of the code.
 * @author dxq613@gmail.com
 */

const Shape = require('./shape');
const Util = require('../util/index');
const Global = require('../global');
const SingleShapeMixin = require('./single-shape-mixin');
const CLS_SHAPE = 'edge-shape';

// start,end upside down, center unchanged
function revertAlign(labelPosition) {
  let textAlign = labelPosition;
  if (labelPosition === 'start') {
    textAlign = 'end';
  } else if (labelPosition === 'end') {
    textAlign = 'start';
  }
  return textAlign;
}


// Register Node's factory method
Shape.registerFactory('edge', {
  defaultShapeType: 'line'
});

const singleEdgeDefinition = Util.mix({}, SingleShapeMixin, {
  itemType: 'edge',
  /**
   * Location of text
   * @type {String}
   */
  labelPosition:'center', // start, end, center
  /**
   * Whether the text automatically rotates following the line, the default is false
   * @type {Boolean}
   */
  labelAutoRotate: false,
  /**
   * Get the path of the edge
   * @internal for extended edge coverage
   * @param {Array} points The set of points that make up the edge
   * @return {Array} constitutes an array of path
   */
  getPath(points) {
    const path = [];
    Util.each(points, (point, index) => {
      if (index === 0) {
        path.push([ 'M', point.x, point.y ]);
      } else {
        path.push([ 'L', point.x, point.y ]);
      }
    });
    return path;
  },
  getShapeStyle(cfg) {
    const color = cfg.color || Global.defaultEdge.color;
    const size = cfg.size || Global.defaultEdge.size;
    cfg = this.getPathPoints(cfg);
    const startPoint = cfg.startPoint;
    const endPoint = cfg.endPoint;
    const controlPoints = this.getControlPoints(cfg);
    let points = [startPoint ]; // Add starting point
    // Add control point
    if (controlPoints) {
      points = points.concat(controlPoints);
    }
    // Add end point
    points.push(endPoint);
    const path = this.getPath(points);
    const style = Util.mix({}, Global.defaultEdge.style, {
      stroke: color,
      lineWidth: size,
      path
    }, cfg.style);
    return style;
  },
  getLabelStyleByPosition(cfg, labelCfg, group) {
    const labelPosition = labelCfg.position || this.labelPosition; // The location of the text can be passed in by the user
    const style = {};
    const pathShape = group.findByClassName(CLS_SHAPE);
    // Do not judge the pathShape empty, if the line does not exist, it means there is a problem
    let pointPercent;
    if (labelPosition === 'start') {
      pointPercent = 0;
    } else if (labelPosition === 'end') {
      pointPercent = 1;
    } else {
      pointPercent = 0.5;
    }
    const { refX, refY } = labelCfg; // Default offset
    // If the two nodes overlap, the line becomes a point. At this time, the position of the label is this point + absolute offset
    if (cfg.startPoint.x === cfg.endPoint.x && cfg.startPoint.y === cfg.endPoint.y) {
      style.x = cfg.startPoint.x + refX ? refX : 0;
      style.y = cfg.endPoint.y + refY ? refY : 0;
      return style;
    }
    const autoRotate = Util.isNil(labelCfg.autoRotate) ? this.labelAutoRotate : labelCfg.autoRotate;
    const offsetStyle = Util.getLabelPosition(pathShape, pointPercent, refX, refY, autoRotate);
    style.x = offsetStyle.x;
    style.y = offsetStyle.y;
    style.rotate = offsetStyle.rotate;
    style.textAlign = this._getTextAlign(labelPosition, offsetStyle.angle);
    return style;
  },
  // Get text alignment
  _getTextAlign(labelPosition, angle) {
    let textAlign = 'center';
    if (!angle) {
      return labelPosition;
    }
    angle = angle % (Math.PI * 2); // Modulus
    if (labelPosition !== 'center') {
      if ((angle >= 0 && angle <= Math.PI / 2) || (angle >= 3 / 2 * Math.PI && angle < 2 * Math.PI)) {
        textAlign = labelPosition;
      } else {
        textAlign = revertAlign(labelPosition);
      }
    }
    return textAlign;
  },
  /**
   * @internal Get the control point of the edge
   * Configuration items at @param {Object} cfg
   * @return {Array} Array of control points
   */
  getControlPoints(cfg) {
    return cfg.controlPoints;
  },
  /**
   * @internal handles cases where points and edges need to be recalculated
   * Configuration items at @param {Object} cfg
   * @return {Object} side configuration item
   */
  getPathPoints(cfg) {
    return cfg;
  },
  /**
   * Draw edge
   * @override
   * Configuration items at @param {Object} cfg
   * @param {G.Group} group side container
   * @return {G.Shape} graphics
   */
  drawShape(cfg, group) {
    const shapeStyle = this.getShapeStyle(cfg);
    const shape = group.addShape('path', {
      className: CLS_SHAPE,
      attrs: shapeStyle
    });
    return shape;
  }
});

// straight line
Shape.registerEdge('single-line', singleEdgeDefinition);

// Straight line, does not support control points
Shape.registerEdge('line', {
  // 控制点不生效
  getControlPoints() {
    return [];
  }
}, 'single-line');

// Polyline, support multiple control points
Shape.registerEdge('polyline', {}, 'single-line');

// straight line
Shape.registerEdge('spline', {
  getPath(points) {
    const path = Util.getSpline(points);
    return path;
  }
}, 'single-line');

Shape.registerEdge('quadratic', {
  curvePosition: 0.5, // Bending default position
  curveOffset: -20, // The degree of curvature, along the vertical vector (clockwise) direction of startPoint, endPoint, the distance from the line, the greater the distance, the more curved
  getControlPoints(cfg) {
    let controlPoints = cfg.controlPoints; // Specify controlPoints
    if (!controlPoints || !controlPoints.length) {
      const { startPoint, endPoint } = cfg;
      const innerPoint = Util.getControlPoint(startPoint, endPoint, this.curvePosition, this.curveOffset);
      controlPoints = [ innerPoint ];
    }
    return controlPoints;
  },
  getPath(points) {
    const path = [];
    path.push([ 'M', points[0].x, points[0].y ]);
    path.push([ 'Q', points[1].x, points[1].y, points[2].x, points[2].y ]);
    return path;
  }
}, 'single-line');

Shape.registerEdge('cubic', {
  curvePosition: [ 1 / 2, 1 / 2 ],
  curveOffset: [ -20, 20 ],
  getControlPoints(cfg) {
    let controlPoints = cfg.controlPoints; // Specify controlPoints
    if (!controlPoints || !controlPoints.length) {
      const { startPoint, endPoint } = cfg;
      const innerPoint1 = Util.getControlPoint(startPoint, endPoint, this.curvePosition[0], this.curveOffset[0]);
      const innerPoint2 = Util.getControlPoint(startPoint, endPoint, this.curvePosition[1], this.curveOffset[1]);
      controlPoints = [ innerPoint1, innerPoint2 ];
    }
    return controlPoints;
  },
  getPath(points) {
    const path = [];
    path.push([ 'M', points[0].x, points[0].y ]);
    path.push([ 'C', points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y ]);
    return path;
  }
}, 'single-line');

// The third-order Bezier curve in the vertical direction, no longer considers the control points passed in from outside the user
Shape.registerEdge('cubic-vertical', {
  curvePosition: [ 1 / 2, 1 / 2 ],
  getControlPoints(cfg) {
    const { startPoint, endPoint } = cfg;
    const innerPoint1 = {
      x: startPoint.x,
      y: (endPoint.y - startPoint.y) * this.curvePosition[0] + startPoint.y
    };
    const innerPoint2 = {
      x: endPoint.x,
      y: (endPoint.y - startPoint.y) * this.curvePosition[1] + startPoint.y
    };
    const controlPoints = [ innerPoint1, innerPoint2 ];
    return controlPoints;
  }
}, 'cubic');

// The third-order Bezier curve in the horizontal direction, no longer considers the control points passed in from outside the user
Shape.registerEdge('cubic-horizontal', {
  curvePosition: [ 1 / 2, 1 / 2 ],
  getControlPoints(cfg) {
    const { startPoint, endPoint } = cfg;
    const innerPoint1 = {
      x: (endPoint.x - startPoint.x) * this.curvePosition[0] + startPoint.x,
      y: startPoint.y
    };
    const innerPoint2 = {
      x: (endPoint.x - startPoint.x) * this.curvePosition[1] + startPoint.x,
      y: endPoint.y
    };
    const controlPoints = [ innerPoint1, innerPoint2 ];
    return controlPoints;
  }
}, 'cubic');

Shape.registerEdge('loop', {
  getPathPoints(cfg) {
    return Util.getLoopCfgs(cfg);
  },
  getControlPoints(cfg) {
    return cfg.controlPoints;
  },
  afterDraw(cfg) {
    cfg.controlPoints = null;
  },
  afterUpdate(cfg) {
    cfg.controlPoints = null;
  }
}, 'cubic');
