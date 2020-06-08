/**
 * @fileOverview node item
 * @author huangtonger@aliyun.com
 */

const Util = require('../util/');
const Item = require('./item');
const CACHE_ANCHOR_POINTS = 'anchorPointsCache';
const CACHE_BBOX = 'bboxCache';

function getNearestPoint(points, curPoint) {
  let index = 0;
  let nearestPoint = points[0];
  let minDistance = pointDistance(points[0], curPoint);
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const distance = pointDistance(point, curPoint);
    if (distance < minDistance) {
      nearestPoint = point;
      minDistance = distance;
      index = i;
    }
  }
  nearestPoint.anchorIndex = index;
  return nearestPoint;
}

function pointDistance(p1, p2) {
  return (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
}

class Node extends Item {
  getDefaultCfg() {
    return {
      type: 'node',
      anchors: [],
      edges: [],
      status: []
    };
  }

  // getNeighbors() {
  //   const nodes = [];
  //   let node = null;
  //   Util.each(this.get('edges'), edge => {
  //     if (edge.get('source') === this) {
  //       node = edge.get('target');
  //     } else {
  //       node = edge.get('source');
  //     }
  //     if (nodes.indexOf(node) < 0) {
  //       nodes.push(node);
  //     }
  //   });
  //   return nodes;
  // }

  /**
   * Get all edges associated with a slave node
   * @return {Array} collection of edges
   */
  getEdges() {
    return this.get('edges');
  }
  /**
   * Get the edge of the incoming node target == this
   * @return {Array} collection of edges
   */
  getInEdges() {
    const self = this;
    return this.get('edges').filter(edge => {
      return edge.get('target') === self;
    });
  }
  /**
   * Get the edge leading from the node source == this
   * @return {Array} collection of edges
   */
  getOutEdges() {
    const self = this;
    return this.get('edges').filter(edge => {
      return edge.get('source') === self;
    });
  }

  // showAnchors() {
  //   // todo
  // }
  // hideAnchors() {

  // }
  /**
   * Get the connection point according to the index of the anchor point
   * @param {Number} index
   * @return {Object} connection point {x,y}
   */
  getLinkPointByAnchor(index) {
    const anchorPoints = this.getAnchorPoints();
    return anchorPoints[index];
  }

  /**
    * Get connection point
    * @param {Object} point A point outside the node, used to calculate the intersection and the nearest anchor point
    * @return {Object} connection point {x,y}
    */
  getLinkPoint(point) {
    // const model = this.get('model');
    const keyShape = this.get('keyShape');
    const type = keyShape.get('type');
    const bbox = this.getBBox();
    const { centerX, centerY } = bbox;
    const anchorPoints = this.getAnchorPoints();
    let intersectPoint;
    switch (type) {
      case 'circle':
        intersectPoint = Util.getCircleIntersectByPoint({
          x: centerX,
          y: centerY,
          r: bbox.width / 2
        }, point);
        break;
      case 'ellipse':
        intersectPoint = Util.getEllispeIntersectByPoint({
          x: centerX,
          y: centerY,
          rx: bbox.width / 2,
          ry: bbox.height / 2
        }, point);
        break;
      default:
        intersectPoint = Util.getRectIntersectByPoint(bbox, point);
    }
    let linkPoint = intersectPoint;
    // If there is an anchor point, use the intersection point to calculate the closest anchor point
    if (anchorPoints.length) {
      if (!linkPoint) { // If the intersection point cannot be calculated
        linkPoint = point;
      }
      linkPoint = getNearestPoint(anchorPoints, linkPoint);
    }
    if (!linkPoint) { // If you still can't find the anchor point and the connection point, return directly to the center point
      linkPoint = { x: centerX, y: centerY };
    }
    return linkPoint;
  }

  /**
   * Add an edge
   * @param {Edge} edge
   */
  addEdge(edge) {
    this.get('edges').push(edge);
  }

  /**
   * Remove edge
   * @param {Edge} edge
   */
  removeEdge(edge) {
    const edges = this.getEdges();
    const index = edges.indexOf(edge);
    if (index > -1) {
      edges.splice(index, 1);
    }
  }

  clearCache() {
    this.set(CACHE_BBOX, null); // Clean cached bbox
    this.set(CACHE_ANCHOR_POINTS, null);
  }

  // Whether to just move the node, other attributes have not changed
  _isOnlyMove(cfg) {
    if (!cfg) {
      return false; // Not just move when refreshing
    }
    // Can't directly use cfg.x && cfg.y and other judgments, because 0 will appear
    const existX = !Util.isNil(cfg.x);
    const existY = !Util.isNil(cfg.y);
    const keys = Object.keys(cfg);
    return (keys.length === 1 && (existX || existY)) // Only one field, contains x or contains y
      || (keys.length === 2 && existX && existY); // Two fields, both x and y
  }

  /**
   * Get the definition of an anchor
   * @return {array} anchorPoints， {x,y,...cfg}
   */
  getAnchorPoints() {
    let anchorPoints = this.get(CACHE_ANCHOR_POINTS);
    if (!anchorPoints) {
      anchorPoints = [];
      const shapeFactory = this.get('shapeFactory');
      const bbox = this.getBBox();
      const model = this.get('model');
      const shapeCfg = this.getShapeCfg(model);
      const points = shapeFactory.getAnchorPoints(model.shape, shapeCfg) || [];
      Util.each(points, (pointArr, index) => {
        const point = Util.mix({
          x: bbox.minX + pointArr[0] * bbox.width,
          y: bbox.minY + pointArr[1] * bbox.height
        }, pointArr[2], {
          index
        });
        anchorPoints.push(point);
      });
      this.set(CACHE_ANCHOR_POINTS, anchorPoints);
    }
    return anchorPoints;
  }
}
module.exports = Node;
