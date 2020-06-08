/**
 * @fileOverview Base class for custom Shape
 * @author dxq613@gmail.com
 */


const Util = require('../util/');
require('./extend/group');
const Shape = {};
const cache = {}; // ucfirst overhead is too large, cache
// Capitalize the first letter
function ucfirst(str) {
  return cache[str] || Util.upperFirst(str);
}

/**
 * Base class for factory methods
 * @type Shape.FactoryBase
 */
const ShapeFactoryBase = {
  /**
   * The default shape, when no shapeType is specified/matched, the default
   * @type {String}
   */
  defaultShapeType: null,
  /**
   * Get the tool class for drawing Shape, stateless
   * @param {String} type
   * @return {Object} tool class
   */
  getShape(type) {
    const self = this;
    const shape = self[type] || self[self.defaultShapeType];
    return shape;
  },
  /**
   * Draw graphics
   * @param {String} type
   * @param {Object} cfg configuration item
   * @param {G.Group} group Graphic grouping
   * @return {G.Shape} graphic object
   */
  draw(type, cfg, group) {
    const shape = this.getShape(type);
    const rst = shape.draw(cfg, group);
    shape.afterDraw(cfg, group, rst);
    return rst;
  },
  /**
   * Update
   * @param {String} type
   * @param {Object} cfg configuration item
   * @param {G6.Item} item node, edge, grouping, etc.
   */
  update(type, cfg, item) {
    const shape = this.getShape(type);
    if (shape.update) { // Prevent undefined update function
      shape.update(cfg, item);
      shape.afterUpdate(cfg, item);
    }
  },
  /**
   * Set status
   * @param {String} type
   * @param {String} name state name
   * @param {String} value status value
   * @param {G6.Item} item node, edge, grouping, etc.
   */
  setState(type, name, value, item) {
    const shape = this.getShape(type);
    shape.setState(name, value, item);
  },
  /**
   * Whether to allow updating without redrawing graphics
   * @param {String} type
   * @return {Boolean} whether update is allowed
   */
  shouldUpdate(type) {
    const shape = this.getShape(type);
    return !!shape.update;
  },
  getControlPoints(type, cfg) {
    const shape = this.getShape(type);
    return shape.getControlPoints(cfg);
  },
  /**
   * Get control points
   * @param {String} type node, edge type
   * @param {Object} cfg node and edge configuration items
   * @return {Array|null} Array of control points, if null, no control points
   */
  getAnchorPoints(type, cfg) {
    const shape = this.getShape(type);
    return shape.getAnchorPoints(cfg);
  }
};

/**
 * Base class for tools that draw elements
 * @class Shape.ShapeBase
 */
const ShapeBase = {
  /**
   * draw
   */
  draw(/* cfg, group */) {

  },
  /**
   * After the drawing is completed, it is convenient for the user to inherit the existing nodes and edges
   */
  afterDraw(/* cfg, group */) {

  },
  // update(cfg, item) // Not defined by default
  afterUpdate(/* cfg, item */) {

  },
  /**
   *
   */
  setState(/* name, value, item */) {

  },
  /**
   * Get control points
   * @param {Object} cfg node and edge configuration items
   * @return {Array|null} Array of control points, if null, no control points
   */
  getControlPoints(cfg) {
    return cfg.controlPoints;
  },
  /**
   * Get control points
   * @param {Object} cfg node and edge configuration items
   * @return {Array|null} Array of control points, if null, no control points
   */
  getAnchorPoints(cfg) {
    return cfg.anchorPoints;
  }
  /* If the update method is not defined, the draw method is called every time
  update(cfg, item) {

  }
  */
};

// Register Geometry to get the entrance of the graphics
Shape.registerFactory = function(factoryType, cfg) {
  const className = ucfirst(factoryType);
  const shapeFactory = Util.mix({}, ShapeFactoryBase, cfg);
  Shape[className] = shapeFactory;
  shapeFactory.className = className;
  addRegister(shapeFactory);
  return shapeFactory;
};

// Unified implementation of registerNode, registerEdge, registerGuide
function addRegister(shapeFactory) {
  const functionName = 'register' + shapeFactory.className;
  Shape[functionName] = function(shapeType, cfg, extendShapeType) {
    const extendShape = extendShapeType ? shapeFactory.getShape(extendShapeType) : ShapeBase;
    const shapeObj = Util.mix({}, extendShape, cfg);
    shapeObj.type = shapeType;
    shapeFactory[shapeType] = shapeObj;
    return shapeObj;
  };
}

// Get ShapeFactory
Shape.getFactory = function(factoryType) {
  const self = this;
  factoryType = ucfirst(factoryType);
  return self[factoryType];
};

module.exports = Shape;
