/**
 * @fileOverview edge item
 * @author huangtonger@aliyun.com
 */

const Util = require('../util/');
const Item = require('./item');
const END_MAP = { source: 'start', target: 'end' };
const ITEM_NAME_SUFFIX = 'Node'; // Endpoint suffix, such as sourceNode, targetNode
const POINT_NAME_SUFFIX = 'Point'; // The suffix of the start or end point, such as startPoint, endPoint
const ANCHOR_NAME_SUFFIX = 'Anchor';

class Edge extends Item {
  getDefaultCfg() {
    return {
      type: 'edge',
      sourceNode: null,
      targetNode: null,
      startPoint: null,
      endPoint: null,
      linkCenter: false // The parameter name is not thought about for the time being, is it connected to the center of the node, or directly connected to x,y
    };
  }

  init() {
    super.init();
    // Initialize two endpoints
    this.setSource(this.get('source'));
    this.setTarget(this.get('target'));
  }

  setSource(source) {
    this._setEnd('source', source);
    this.set('source', source);
  }

  setTarget(target) {
    this._setEnd('target', target);
    this.set('target', target);
  }

  getSource() {
    return this.get('source');
  }

  getTarget() {
    return this.get('target');
  }

  /**
   * The edge does not need to recalculate the container position, directly recalculate the path position
   * @param {object} cfg data to be updated
   */
  update(cfg) {
    const model = this.get('model');
    Util.mix(model, cfg);
    this.updateShape();
    this.afterUpdate();
    this.clearCache();
  }

  updatePosition() {}

  // Set endpoint: start or end point
  _setEnd(name, value) {
    const pointName = END_MAP[name] + POINT_NAME_SUFFIX;
    const itemName = name + ITEM_NAME_SUFFIX;
    const preItem = this.get(itemName);
    preItem && preItem.removeEdge(this); // If there was a node before, remove the edge
    if (Util.isPlainObject(value)) { // If set to a specific point, then clear the node
      this.set(pointName, value);
      this.set(itemName, null);
    } else {
      value.addEdge(this);
      this.set(itemName, value);
      this.set(pointName, null);
    }
  }

  // Get the node that intersects the endpoint
  _getLinkPoint(name, model, controlPoints) {
    const pointName = END_MAP[name] + POINT_NAME_SUFFIX;
    const itemName = name + ITEM_NAME_SUFFIX;
    let point = this.get(pointName);
    if (!point) {
      const item = this.get(itemName);
      const anchorName = name + ANCHOR_NAME_SUFFIX;
      const prePoint = this._getPrePoint(name, controlPoints);
      const anchorIndex = model[anchorName];
      if (!Util.isNil(anchorIndex)) { // If there is an anchor point, use the anchor index to get the connection point
        point = item.getLinkPointByAnchor(anchorIndex);
      }
      // If the anchor point has no corresponding point or no anchor point, the connection point is directly calculated
      point = point || item.getLinkPoint(prePoint);
      if (!Util.isNil(point.index)) {
        this.set(name + 'AnchorIndex', point.index);
      }
    }
    return point;
  }

  // Get the point connected to the end point and calculate the intersection point
  _getPrePoint(name, controlPoints) {
    if (controlPoints && controlPoints.length) {
      const index = name === 'source' ? 0 : controlPoints.length - 1;
      return controlPoints[index];
    }
    const oppositeName = name === 'source' ? 'target' : 'source'; // Take the position of another node
    return this._getEndPoint(oppositeName);
  }

  // Get control points through the center of the endpoint
  _getControlPointsByCenter(model) {
    const sourcePoint = this._getEndPoint('source');
    const targetPoint = this._getEndPoint('target');
    const shapeFactory = this.get('shapeFactory');
    return shapeFactory.getControlPoints(model.shape, {
      startPoint: sourcePoint,
      endPoint: targetPoint
    });
  }

  // Get the location of the endpoint
  _getEndPoint(name) {
    const itemName = name + ITEM_NAME_SUFFIX;
    const pointName = END_MAP[name] + POINT_NAME_SUFFIX;
    const item = this.get(itemName);
      // If there is an endpoint, use model directly
    if (item) {
      return item.get('model');
    }  // Otherwise use points directly
    return this.get(pointName);
  }

  _getEndCenter(name) {
    const itemName = name + ITEM_NAME_SUFFIX;
    const pointName = END_MAP[name] + POINT_NAME_SUFFIX;
    const item = this.get(itemName);
      // If there is an endpoint, use model directly
    if (item) {
      const bbox = item.getBBox();
      return {
        x: bbox.centerX,
        y: bbox.centerY
      };
    }  // Otherwise use points directly
    return this.get(pointName);
  }

  getShapeCfg(model) {
    const self = this;
    const linkCenter = self.get('linkCenter'); // If connected to the center, ignore the anchor point and the control point
    const cfg = super.getShapeCfg(model);
    if (linkCenter) {
      cfg.startPoint = self._getEndCenter('source');
      cfg.endPoint = self._getEndCenter('target');
    } else {
      const controlPoints = cfg.controlPoints || self._getControlPointsByCenter(cfg);
      cfg.startPoint = self._getLinkPoint('source', model, controlPoints);
      cfg.endPoint = self._getLinkPoint('target', model, controlPoints);
    }
    cfg.sourceNode = self.get('sourceNode');
    cfg.targetNode = self.get('targetNode');
    return cfg;
  }

  getModel() {
    const model = this.get('model');
    const out = Util.mix({}, model);
    const sourceItem = this.get('source' + ITEM_NAME_SUFFIX);
    const targetItem = this.get('target' + ITEM_NAME_SUFFIX);
    if (sourceItem) {
      out.source = sourceItem.get('id');
      delete out['source' + ITEM_NAME_SUFFIX];
    } else {
      out.source = this.get('start' + POINT_NAME_SUFFIX);
    }
    if (targetItem) {
      out.target = targetItem.get('id');
      delete out['target' + ITEM_NAME_SUFFIX];
    } else {
      out.target = this.get('end' + POINT_NAME_SUFFIX);
    }
    return out;
  }

  destroy() {
    const sourceItem = this.get('source' + ITEM_NAME_SUFFIX);
    const targetItem = this.get('target' + ITEM_NAME_SUFFIX);
    sourceItem && !sourceItem.destroyed && sourceItem.removeEdge(this);
    targetItem && !targetItem.destroyed && targetItem.removeEdge(this);
    super.destroy();
  }
}

module.exports = Edge;
