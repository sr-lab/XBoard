/**
 * @fileOverview item
 * @author huangtonger@aliyun.com
 */

const Util = require('../util/');
const Shape = require('../shape');
const Global = require('../global');
const CACHE_BBOX = 'bboxCache';
const GLOBAL_STATE_STYLE_SUFFIX = 'StateStyle';
const NAME_STYLE = 'Style'; // cache The name of the cached state attribute
const RESERVED_STYLES = [ 'fillStyle', 'strokeStyle', 'path', 'points', 'img', 'symbol' ];

class Item {
  constructor(cfg) {
    const defaultCfg = {
      /**
       * id
       * @type {string}
       */
      id: null,

      /**
       * Types of
       * @type {string}
       */
      type: 'item',

      /**
       * data model
       * @type {object}
       */
      model: {},

      /**
       * g group
       * @type {G.Group}
       */
      group: null,

      /**
       * is open animate
       * @type {boolean}
       */
      animate: false,

      /**
       * visible - not group visible
       * @type {boolean}
       */
      visible: true,
      /**
       * capture event
       * @type {boolean}
       */
      event: true,
      /**
       * key shape to calculate item's bbox
       * @type object
       */
      keyShape: null,
      /**
       * item's states, such as selected or active
       * @type Array
       */
      states: []
    };
    this._cfg = Util.mix(defaultCfg, this.getDefaultCfg(), cfg);
    const group = cfg.group;
    group.set('item', this);
    let id = this.get('model').id;
    if (!id || id === '') {
      id = Util.uniqueId(this.get('type'));
    }
    this.set('id', id);
    group.set('id', id);
    this.init();
    this.draw();
  }

  /**
   * Whether it is an Item object, judge if there is an empty edge
   * @return {Boolean} is an Item object
   */
  isItem() {
    return true;
  }

  /**
   * Get attributes
   * @internal only for internal classes
   * @param {String} key property name
   * @return {*} attribute value
   */
  get(key) {
    return this._cfg[key];
  }

  /**
   * Set properties
   * @internal only for internal classes
   * @param {String|Object} key property name, can also be an object
   * @param {*} val attribute value
   */
  set(key, val) {
    if (Util.isPlainObject(key)) {
      this._cfg = Util.mix({}, this._cfg, key);
    } else {
      this._cfg[key] = val;
    }
  }
  /**
   * Get the default configuration items
   * @protected for subclass replication
   * @return {Object} configuration item
   */
  getDefaultCfg() {
    return {};
  }
  /**
   * initialization
   * @protected
   */
  init() {
    const shapeFactory = Shape.getFactory(this.get('type'));
    this.set('shapeFactory', shapeFactory);
  }
  // Calculate the bounding box according to keyshape
  _calculateBBox() {
    const keyShape = this.get('keyShape');
    const group = this.get('group');
    // Because group may move, it must be calculated by the parent element to calculate the correct bounding box
    const bbox = Util.getBBox(keyShape, group);
    bbox.x = bbox.minX;
    bbox.y = bbox.minY;
    bbox.width = bbox.maxX - bbox.minX;
    bbox.height = bbox.maxY - bbox.minY;
    bbox.centerX = (bbox.minX + bbox.maxX) / 2;
    bbox.centerY = (bbox.minY + bbox.maxY) / 2;
    return bbox;
  }

  // draw
  _drawInner() {
    const self = this;
    const shapeFactory = self.get('shapeFactory');
    const group = self.get('group');
    const model = self.get('model');
    group.clear();

    if (!shapeFactory) {
      return;
    }
    self.updatePosition(model);
    const cfg = self.getShapeCfg(model); // Additional information may be added
    const shapeType = cfg.shape;
    const keyShape = shapeFactory.draw(shapeType, cfg, group);
    if (keyShape) {
      keyShape.isKeyShape = true;
      self.set('keyShape', keyShape);
      self.set('originStyle', this.getKeyShapeStyle());
    }
    // Prevent the shape from being updated due to the user's external modification of the shape in the model
    this.set('currentShape', shapeType);
    this._resetStates(shapeFactory, shapeType);
  }

  getKeyShapeStyle() {
    const keyShape = this.getKeyShape();
    if (keyShape) {
      const styles = {};
      Util.each(keyShape.attr(), (val, key) => {
        if (RESERVED_STYLES.indexOf(key) < 0) {
          styles[key] = val;
        }
      });
      return styles;
    }
  }

  _resetStates(shapeFactory, shapeType) {
    const self = this;
    const states = self.get('states');
    Util.each(states, state => {
      shapeFactory.setState(shapeType, state, true, self);
    });
  }

  /**
   * Get all states of the current element
   * All states of @return {Array} elements
   */
  getStates() {
    return this.get('states');
  }

  /**
   * Whether the current element is in a certain state
   * @param {String} state state name
   * @return {Boolean} is in a certain state
   */
  hasState(state) {
    return this.get('states').indexOf(state) >= 0;
  }

  getStateStyle(state) {
    const self = this;
    // Global.nodeStateStyle
    const globalStyle = Global[self.getType() + GLOBAL_STATE_STYLE_SUFFIX][state];
    const styles = this.get('styles');
    const defaultStyle = styles && styles[state];
    // State name + style (activeStyle) is stored in item, if the information does not exist in item, the default style is used
    const fieldName = state + NAME_STYLE;
    return Util.mix({}, globalStyle, defaultStyle, self.get(fieldName));
  }

  getOriginStyle() {
    return this.get('originStyle');
  }

  getCurrentStatesStyle() {
    const self = this;
    const originStyle = Util.mix({}, self.getOriginStyle());
    Util.each(self.getStates(), state => {
      Util.mix(originStyle, self.getStateStyle(state));
    });
    return originStyle;
  }

  /**
   * Change the state of the element, visible does not belong to this category
   * @internal only provides internal graph usage
   * @param {String} state state name
   * @param {Boolean} enable node status value
   */
  setState(state, enable) {
    const states = this.get('states');
    const shapeFactory = this.get('shapeFactory');
    const index = states.indexOf(state);
    if (enable) {
      if (index > -1) {
        return;
      }
      states.push(state);
    } else if (index > -1) {
      states.splice(index, 1);
    }
    if (shapeFactory) {
      const model = this.get('model');
      shapeFactory.setState(model.shape, state, enable, this);
    }
  }

  clearStates(states) {
    const self = this;
    const originStates = self.getStates();
    const shapeFactory = self.get('shapeFactory');
    const shape = self.get('model').shape;
    if (!states) {
      self.set('states', []);
      shapeFactory.setState(shape, originStates[0], false, self);
      return;
    }
    if (Util.isString(states)) {
      states = [ states ];
    }
    const newStates = originStates.filter(state => {
      shapeFactory.setState(shape, state, false, self);
      if (states.indexOf(state) >= 0) {
        return false;
      }
      return true;
    });
    self.set('states', newStates);
  }

  /**
   * Graph container for nodes
   * @return {G.Group} graphics container
   */
  getContainer() {
    return this.get('group');
  }

  /**
   * The key shape of the node, used to calculate the node size, line intercept, etc.
   * @return {G.Shape} key shape
   */
  getKeyShape() {
    return this.get('keyShape');
  }

  /**
   * Node data model
   * @return {Object} data model
   */
  getModel() {
    return this.get('model');
  }

  /**
   * Node type
   * @return {string} node type
   */
  getType() {
    return this.get('type');
  }


  /**
   * The logic before rendering is provided to subclasses for replication
   * @protected
   */
  beforeDraw() {

  }
  /**
   * Rendered logic, provided to subclasses for replication
   * @protected
   */
  afterDraw() {

  }

  getShapeCfg(model) {
    const styles = this.get('styles');
    if (styles && styles.default) {
      // Item style of merge graph and style in data model
      const newModel = Util.mix({}, model);
      newModel.style = Util.mix({}, styles.default, model.style);
      return newModel;
    }
    return model;
  }

  /**
   * Refresh is generally used to deal with several situations
   * 1. Item model is changed externally
   * 2. The node position of the edge has changed, and the edge needs to be recalculated
   *
   * Because the data is modified from the outside, it is impossible to judge whether some attributes are modified, and directly update the position and shape
   */
  refresh() {
    const model = this.get('model');
    // Update element position
    this.updatePosition(model);
    // Update element content, style
    this.updateShape();
    // Do some operations after updating
    this.afterUpdate();
    // clear cache
    this.clearCache();
  }

  /**
   * Apply the update to the model and refresh the properties
   * @internal is only available for Graph, externally call graph.update interface directly
   * @param {Object} cfg configuration item, which can be incremental information
   */
  update(cfg) {
    const model = this.get('model');
    const originPosition = { x: model.x, y: model.y };
    // The update is directly integrated into the original data model to ensure that the user can modify the source data externally and then refresh the style as expected.
    Util.mix(model, cfg);
    const onlyMove = this._isOnlyMove(cfg);
    // When only moving the position, neither update nor redraw
    if (onlyMove) {
      this.updatePosition(model);
    } else {
      // If x,y changes, reset the position first
      if (originPosition.x !== model.x || originPosition.y !== model.y) {
        this.updatePosition(model);
      }
      this.updateShape();
    }
    this.afterUpdate();
    this.clearCache();
  }

  /**
   * If x,y changes, reset the position first
   */
  updateShape() {
    const shapeFactory = this.get('shapeFactory');
    const model = this.get('model');
    const shape = model.shape;
    // Determine whether update is allowed
    // 1. The registered node allows updating
    // 2. The updated shape is equal to the original shape
    if (shapeFactory.shouldUpdate(shape) && shape === this.get('currentShape')) {
      const updateCfg = this.getShapeCfg(model);
      shapeFactory.update(shape, updateCfg, this);
    } else {
      // If the above two states are not met, redraw
      this.draw();
    }
    this.set('originStyle', this.getKeyShapeStyle());
    // Reset node status after update
    this._resetStates(shapeFactory, shape);
  }

  /**
   * Update location to avoid overall redraw
   * @param {object} cfg data to be updated
   */
  updatePosition(cfg) {
    const model = this.get('model');

    const x = Util.isNil(cfg.x) ? model.x : cfg.x;
    const y = Util.isNil(cfg.y) ? model.y : cfg.y;

    const group = this.get('group');
    if (Util.isNil(x) || Util.isNil(y)) {
      return;
    }
    group.resetMatrix();
    group.translate(x, y);
    model.x = x;
    model.y = y;
    this.clearCache();     // Need to clear cache after location update
  }

  /**
   * Do some work after update
   * @protected
   */
  afterUpdate() {

  }

  /**
   * After operations such as update/refresh, clear the cache
   */
  clearCache() {
    this.set(CACHE_BBOX, null);
  }

  /**
   * Draw elements
   */
  draw() {
    this.beforeDraw();
    this._drawInner();
    this.afterDraw();
  }

  /**
   * Get the bounding box of an element
   * @return {Object} contains x,y,width,height, centerX, centerY
   */
  getBBox() {
    let bbox = this.get(CACHE_BBOX);
    if (!bbox) { // Calculate bbox overhead is a bit large, cache
      bbox = this._calculateBBox();
      this.set(CACHE_BBOX, bbox);
    }
    return bbox;
  }

  /**
   * Bring the element to the front
   */
  toFront() {
    this.get('group').toFront();
  }

  /**
   * Put the element to the end
   */
  toBack() {
    this.get('group').toBack();
  }

  /**
   * Display element
   */
  show() {
    this.changeVisibility(true);
  }

  /**
   * Hidden element
   */
  hide() {
    this.changeVisibility(false);
  }

  /**
   * Change whether to show
   * @param {Boolean} visible is displayed
   */
  changeVisibility(visible) {
    const group = this.get('group');
    if (visible) {
      group.show();
    } else {
      group.hide();
    }
    this.set('visible', visible);
  }

  /**
   * Whether to pick up and start the interactive event of the element
   * @param {Boolean} enable flag
   */
  enableCapture(enable) {
    const group = this.get('group');
    group && group.attr('capture', enable);
  }

  isVisible() {
    return this.get('visible');
  }
  /**
   * Destructor
   */
  destroy() {
    if (!this.destroyed) {
      const animate = this.get('animate');
      const group = this.get('group');
      if (animate) {
        group.stopAnimate();
      }
      group.remove();
      this._cfg = null;
      this.destroyed = true;
    }
  }
}

module.exports = Item;
