/**
 * @fileOverview graph
 * @author huangtonger@aliyun.com
 */

const G = require('@antv/g/lib');
const EventEmitter = G.EventEmitter;
const Util = require('../util');
const Global = require('../global');

const Controller = require('./controller');
const NODE = 'node';
const EDGE = 'edge';

class Graph extends EventEmitter {
  /**
   * Access to the default configuration properties
   * @return {object} default configuration
   */
  getDefaultCfg() {
    return {
      /**
       * Container could be dom object or dom id
       * @type {object|string|undefined}
       */
      container: undefined,

      /**
       * Canvas width
       * @type {number|undefined}
       * unit pixel if undefined force fit width
       */
      width: undefined,

      /**
       * Canvas height
       * @type {number|undefined}
       * unit pixel if undefined force fit height
       */
      height: undefined,
      /**
       * renderer canvas or svg
       * @type {string}
       */
      renderer: 'canvas',
      /**
       * control graph behaviors
       * @type Array
       */
      mode: [],
      /**
       * Register plugin
       */
      plugins: [],
      /**
       * source data
       * @type object
       */
      data: null,
      /**
       * Fit view padding (client scale)
       * @type {number|array}
       */
      fitViewPadding: 10,
      /**
       * Minimum scale size
       * @type {number}
       */
      minZoom: 0.2,
      /**
       * Maxmum scale size
       * @type {number}
       */
      maxZoom: 10,
      /**
       *  capture events
       *  @type boolean
       */
      event: true,
      /**
       * group node & edges into different graphic groups
       * @private
       * @type boolean
       */
      groupByTypes: true,
      /**
       * determine if it's a directed graph
       * @type boolean
       */
      directed: false,
      /**
       * when data or shape changed, should canvas draw automatically
       * @type boolean
       */
      autoPaint: true,
      /**
       * store all the node instances
       * @type [object]
       */
      nodes: [],
      /**
       * store all the edge instances
       * @type [object]
       */
      edges: [],
      /**
       * all the instances indexed by id
       * @type object
       */
      itemMap: {},
      /**
       * The edge is directly connected to the center of the node, and the anchor point is no longer considered
       * @type {Boolean}
       */
      linkCenter: false,
      /**
       * The default node configuration, the configuration defined on the data will override these configurations. E.g:
       * defaultNode: {
       * shape:'rect',
       * size: [60, 40]
       *}
       * If the data item is {id:'node', x: 100, y: 100}
       * The actual node model created is {id:'node', x: 100, y: 100, shape:'rect', size: [60, 40]}
       * If the data item is {id:'node', x: 100, y: 100, shape:'circle'}
       * The actual node model created is {id:'node', x: 100, y: 100, shape:'circle', size: [60, 40]}
       */
      defaultNode: {},
      /**
       * The default side configuration, the configuration defined on the data will override these configurations. Same usage as defaultNode
       */
      defaultEdge: {},
      /**
       * Default style of node, you can also add status style
       * E.g:
       * const graph = new G6.Graph({
       *  nodeStyle: {
       *    default: { fill: '#fff' },
       *    selected: { fill: '#ccc', stroke: '#666' },
       *    active: { lineWidth: 2 }
       *  },
       *  ...
       * });
       *
       */
      nodeStyle: {},
      /**
       * The default style of the edge, the usage is the same as nodeStyle
       */
      edgeStyle: {},
      /**
       * graph state
       */
      states: {},
      /**
       * Whether to enable global animation
       * @type {Boolean}
       */
      animate: false,
      /**
       * Animation settings, only valid when animate is true
       * @type {Object}
       */
      animateCfg: {
        /**
         * Frame callback function, used to customize node motion path, space-time linear motion
         * @type {Function|null}
         */
        onFrame: null,
        /**
         * Animation duration (ms)
         * @type {Number}
         */
        duration: 500,
        /**
         * Specify animation effects
         * @type {String}
         */
        easing: 'easeLinear'
      },
      callback: null
    };
  }

  constructor(inputCfg) {
    super();
    this._cfg = Util.deepMix(this.getDefaultCfg(), inputCfg);    // merge graph configs
    this._init();
  }
  _init() {
    this._initCanvas();
    const eventController = new Controller.Event(this);
    const viewController = new Controller.View(this);
    const modeController = new Controller.Mode(this);
    const itemController = new Controller.Item(this);
    const stateController = new Controller.State(this);
    this.set({ eventController, viewController, modeController, itemController, stateController });
    this._initPlugins();
  }
  _initCanvas() {
    let container = this.get('container');
    if (Util.isString(container)) {
      container = document.getElementById(container);
      this.set('container', container);
    }
    if (!container) {
      throw Error('invalid container');
    }
    const canvas = new G.Canvas({
      containerDOM: container,
      width: this.get('width'),
      height: this.get('height'),
      renderer: this.get('renderer'),
      pixelRatio: this.get('pixelRatio')
    });
    this.set('canvas', canvas);
    this._initGroups();
  }
  _initGroups() {
    const canvas = this.get('canvas');
    const id = this.get('canvas').get('el').id;
    const group = canvas.addGroup({ id: id + '-root', className: Global.rootContainerClassName });
    if (this.get('groupByTypes')) {
      const edgeGroup = group.addGroup({ id: id + '-edge', className: Global.edgeContainerClassName });
      const nodeGroup = group.addGroup({ id: id + '-node', className: Global.nodeContainerClassName });
      this.set({ nodeGroup, edgeGroup });
    }
    this.set('group', group);
  }
  _initPlugins() {
    const self = this;
    Util.each(self.get('plugins'), plugin => {
      if (!plugin.destroyed && plugin.initPlugin) {
        plugin.initPlugin(self);
      }
    });
  }
  get(key) {
    return this._cfg[key];
  }
  set(key, val) {
    if (Util.isPlainObject(key)) {
      this._cfg = Util.mix({}, this._cfg, key);
    } else {
      this._cfg[key] = val;
    }
    return this;
  }

  /**
   * Update elements
   * @param {string|object} item element id or element instance
   * @param {object} cfg The data to be updated
   */
  update(item, cfg) {
    this.updateItem(item, cfg);
  }

  /**
   * Update elements
   * @param {string|object} item element id or element instance
   * @param {object} cfg The data to be updated
   */
  updateItem(item, cfg) {
    this.get('itemController').updateItem(item, cfg);
  }

  /**
   * Set element status
   * @param {string|object} item element id or element instance
   * @param {string} state
   * @param {boolean} enabled is enabled
   */
  setItemState(item, state, enabled) {
    if (Util.isString(item)) {
      item = this.findById(item);
    }
    this.get('itemController').setItemState(item, state, enabled);
    this.get('stateController').updateState(item, state, enabled);
  }

  /**
   * Clean up multiple states of elements
   * @param {string|object} item element id or element instance
   * @param {Array|String|null} states
   */
  clearItemStates(item, states) {
    if (Util.isString(item)) {
      item = this.findById(item);
    }
    this.get('itemController').clearItemStates(item, states);
    if (!states) {
      states = item.get('states');
    }
    this.get('stateController').updateStates(item, states, false);
  }

  /**
   * New elements
   * @param {string} type element type (node ​​| edge)
   * @param {object} model element data model
   * @return {object} element instance
   */
  add(type, model) {
    return this.addItem(type, model);
  }

  /**
   * New elements
   * @param {string} type element type (node ​​| edge)
   * @param {object} model element data model
   * @return {object} element instance
   */
  addItem(type, model) {
    return this.get('itemController').addItem(type, model);
  }

  /**
   * Delete element
   * @param {string|object} item element id or element instance
   */
  remove(item) {
    this.removeItem(item);
  }

  /**
   * Delete element
   * @param {string|object} item element id or element instance
   */
  removeItem(item) {
    this.get('itemController').removeItem(item);
  }

  /**
   * Set view initialization data
   * @param {object} data initialization data
   */
  data(data) {
    this.set('data', data);
  }

  /**
   * Set the style of each node and the style of node keyShape in various states.
   * If it is a custom node cut in various states
   * graph.node(node ​​=> {
   * return {
   * default: {
   * fill:'red',
   * opacity: 1
   * },
   * selected: {
   * style: {
   * fill:'blue',
   * opacity: 0.2
   *}
   *}
   *}
   * });
   * @param {function} nodeFn specifies each node style
   */
  node(nodeFn) {
    if (typeof nodeFn === 'function') {
      this.set('nodeMapper', nodeFn);
    }
  }

  /**
   * Set each side style
   * @param {function} edgeFn specifies the style of each edge, the usage is the same as node
   */
  edge(edgeFn) {
    if (typeof edgeFn === 'function') {
      this.set('edgeMapper', edgeFn);
    }
  }

  /**
   * Refresh elements
   * @param {string|object} item element id or element instance
   */
  refreshItem(item) {
    this.get('itemController').refreshItem(item);
  }

  /**
   * When the source data changes externally, the view is refreshed based on the new data. But does not refresh the node position
   */
  refresh() {
    const self = this;
    const autoPaint = self.get('autoPaint');
    self.setAutoPaint(false);
    self.emit('beforegraphrefresh');
    if (self.get('animate')) {
      self.positionsAnimate();
    } else {
      const nodes = self.get('nodes');
      const edges = self.get('edges');
      Util.each(nodes, node => {
        node.refresh();
      });
      Util.each(edges, edge => {
        edge.refresh();
      });
    }
    self.setAutoPaint(autoPaint);
    self.emit('aftergraphrefresh');
    self.autoPaint();
  }

  /**
   * When the node position changes externally, refresh all node positions and recalculate edges
   */
  refreshPositions() {
    const self = this;
    self.emit('beforegraphrefreshposition');
    const nodes = self.get('nodes');
    const edges = self.get('edges');
    let model;
    Util.each(nodes, node => {
      model = node.getModel();
      node.updatePosition(model);
    });
    Util.each(edges, edge => {
      edge.refresh();
    });
    self.emit('aftergraphrefreshposition');
    self.autoPaint();
  }

  /**
   * Render the view according to the data of the data interface
   */
  render() {
    const self = this;
    const data = this.get('data');
    if (!data) {
      throw new Error('data must be defined first');
    }
    this.clear();
    this.emit('beforerender');
    const autoPaint = this.get('autoPaint');
    this.setAutoPaint(false);
    Util.each(data.nodes, node => {
      self.add(NODE, node);
    });
    Util.each(data.edges, edge => {
      self.add(EDGE, edge);
    });
    if (self.get('fitView')) {
      self.get('viewController')._fitView();
    }
    self.paint();
    self.setAutoPaint(autoPaint);
    self.emit('afterrender');
  }

  /**
   * Receive data for rendering
   * @Param {Object} data initialization data
   */
  read(data) {
    this.data(data);
    this.render();
  }

  /**
   * Change the source data and re-render the view based on the new data
   * @param {object} data source data
   * @return {object} this
   */
  changeData(data) {
    const self = this;
    if (!data) {
      return this;
    }
    if (!self.get('data')) {
      self.data(data);
      self.render();
    }
    const autoPaint = this.get('autoPaint');
    const itemMap = this.get('itemMap');
    const items = {
      nodes: [],
      edges: []
    };
    this.setAutoPaint(false);
    this._diffItems(NODE, items, data.nodes);
    this._diffItems(EDGE, items, data.edges);
    Util.each(itemMap, (item, id) => {
      if (items.nodes.indexOf(item) < 0 && items.edges.indexOf(item) < 0) {
        delete itemMap[id];
        self.remove(item);
      }
    });
    this.set({ nodes: items.nodes, edges: items.edges });
    if (self.get('animate')) {
      self.positionsAnimate();
    } else {
      this.paint();
    }
    this.setAutoPaint(autoPaint);
    return this;
  }
  _diffItems(type, items, models) {
    const self = this;
    let item;
    const itemMap = this.get('itemMap');
    Util.each(models, model => {
      item = itemMap[model.id];
      if (item) {
        if (self.get('animate') && type === NODE) {
          const containerMatrix = item.getContainer().getMatrix();
          item.set('originAttrs', {
            x: containerMatrix[6],
            y: containerMatrix[7]
          });
        }
        self.updateItem(item, model);
      } else {
        item = self.addItem(type, model);
      }
      items[type + 's'].push(item);
    });
  }

  /**
   * Canvas repaint only
   */
  paint() {
    this.emit('beforepaint');
    this.get('canvas').draw();
    this.emit('afterpaint');
  }

  /**
   * Automatic redraw
   * @internal is only for internal update mechanism call, external call render or paint interface as required
   */
  autoPaint() {
    if (this.get('autoPaint')) {
      this.paint();
    }
  }

  /**
   * Export graph data
   * @return {object} data
   */
  save() {
    const nodes = [];
    const edges = [];
    Util.each(this.get('nodes'), node => {
      nodes.push(node.getModel());
    });
    Util.each(this.get('edges'), edge => {
      edges.push(edge.getModel());
    });
    return { nodes, edges };
  }

  /**
   * Change the canvas size
   * @param {number} width canvas width
   * @param {number} height canvas height
   * @return {object} this
   */
  changeSize(width, height) {
    this.get('viewController').changeSize(width, height);
    this.autoPaint();
    return this;
  }

  /**
   * Pan canvas
   * @param {number} dx horizontal displacement
   * @param {number} dy vertical displacement
   */
  translate(dx, dy) {
    const group = this.get('group');
    group.translate(dx, dy);
    this.emit('viewportchange', { action: 'translate', matrix: group.getMatrix() });
    this.autoPaint();
  }

  /**
   * Pan the canvas to a certain point
   * @param {number} x horizontal coordinate
   * @param {number} y vertical coordinate
   */
  moveTo(x, y) {
    const group = this.get('group');
    group.move(x, y);
    this.emit('viewportchange', { action: 'move', matrix: group.getMatrix() });
    this.autoPaint();
  }

  /**
   * Adjust the viewport to fit the view
   * @param {object} padding margin around
   */
  fitView(padding) {
    if (padding) {
      this.set('fitViewPadding', padding);
    }
    this.get('viewController')._fitView();
    this.paint();
  }

  /**
   * New behavior
   * @param {string|array} behaviors added behavior
   * @param {string|array} modes added to the corresponding mode
   * @return {object} this
   */
  addBehaviors(behaviors, modes) {
    this.get('modeController').manipulateBehaviors(behaviors, modes, true);
    return this;
  }

  /**
   * Remove behavior
   * @param {string|array} behaviors removed behavior
   * @param {string|array} modes removed from the specified mode
   * @return {object} this
   */
  removeBehaviors(behaviors, modes) {
    this.get('modeController').manipulateBehaviors(behaviors, modes, false);
    return this;
  }

  /**
   * Switch behavior mode
   * @param {string} mode specifies the mode
   * @return {object} this
   */
  setMode(mode) {
    this.set('mode', mode);
    this.get('modeController').setMode(mode);
    return this;
  }

  /**
   * Get the current behavior mode
   * @return {string} Current behavior mode
   */
  getCurrentMode() {
    return this.get('mode');
  }

  /**
   * Get the current viewport scaling ratio
   * @return {number} ratio
   */
  getZoom() {
    return this.get('group').getMatrix()[0];
  }

  /**
   * Get item instances of all nodes in the current graph
   * @return {array} item array
   */
  getNodes() {
    return this.get('nodes');
  }

  /**
   * Get item instances of all edges in the current graph
   * @return {array} item array
   */
  getEdges() {
    return this.get('edges');
  }

  /**
   * Telescopic viewport
   * @param {number} ratio
   * @param {object} center zoom with center x, y coordinates as the center
   */
  zoom(ratio, center) {
    const matrix = Util.clone(this.get('group').getMatrix());
    const minZoom = this.get('minZoom');
    const maxZoom = this.get('maxZoom');
    if (center) {
      Util.mat3.translate(matrix, matrix, [ -center.x, -center.y ]);
      Util.mat3.scale(matrix, matrix, [ ratio, ratio ]);
      Util.mat3.translate(matrix, matrix, [ center.x, center.y ]);
    } else {
      Util.mat3.scale(matrix, matrix, [ ratio, ratio ]);
    }
    if (minZoom && matrix[0] < minZoom) {
      return;
    }
    if (maxZoom && matrix[0] > maxZoom) {
      return;
    }
    this.get('group').setMatrix(matrix);
    this.emit('viewportchange', { action: 'zoom', matrix });
    this.autoPaint();
  }

  /**
   * Scale the viewport to a fixed ratio
   * @param {number} toRatio scaling ratio
   * @param {object} center zoom with center x, y coordinates as the center
   */
  zoomTo(toRatio, center) {
    const ratio = toRatio / this.getZoom();
    this.zoom(ratio, center);
  }

  /**
   * Animate the node position in the view according to the animateCfg on the graph
   */
  positionsAnimate() {
    const self = this;
    self.emit('beforeanimate');
    const animateCfg = self.get('animateCfg');
    const onFrame = animateCfg.onFrame;
    const nodes = self.getNodes();
    const toNodes = nodes.map(node => {
      const model = node.getModel();
      return {
        id: model.id,
        x: model.x,
        y: model.y
      };
    });
    if (self.isAnimating()) {
      self.stopAnimate();
    }
    self.get('canvas').animate({
      onFrame(ratio) {
        Util.each(toNodes, data => {
          const node = self.findById(data.id);
          if (!node || node.destroyed) {
            return;
          }
          let originAttrs = node.get('originAttrs');
          const model = node.get('model');
          if (!originAttrs) {
            const containerMatrix = node.getContainer().getMatrix();
            originAttrs = {
              x: containerMatrix[6],
              y: containerMatrix[7]
            };
            node.set('originAttrs', originAttrs);
          }
          if (onFrame) {
            const attrs = onFrame(node, ratio, data, originAttrs);
            node.set('model', Util.mix(model, attrs));
          } else {
            model.x = originAttrs.x + (data.x - originAttrs.x) * ratio;
            model.y = originAttrs.y + (data.y - originAttrs.y) * ratio;
          }
        });
        self.refreshPositions();
      }
    }, animateCfg.duration, animateCfg.easing, () => {
      Util.each(nodes, node => {
        node.set('originAttrs', null);
      });
      if (animateCfg.callback) {
        animateCfg.callback();
      }
      self.emit('afteranimate');
      self.animating = false;
    });
  }

  stopAnimate() {
    this.get('canvas').stopAnimate();
  }

  isAnimating() {
    return this.animating;
  }

  /**
   * Move the element to the center of the viewport
   * @param {string|object} item specified element
   */
  focusItem(item) {
    this.get('viewController').focus(item);
    this.autoPaint();
  }

  /**
   * Convert screen coordinates to viewport coordinates
   * @param {number} clientX screen x coordinate
   * @param {number} clientY screen y coordinate
   * @return {object} viewport coordinates
   */
  getPointByClient(clientX, clientY) {
    return this.get('viewController').getPointByClient(clientX, clientY);
  }

  /**
   * Convert viewport coordinates to screen coordinates
   * @param {number} x viewport x coordinate
   * @param {number} y viewport y coordinate
   * @return {object} viewport coordinates
   */
  getClientByPoint(x, y) {
    return this.get('viewController').getClientByPoint(x, y);
  }

  /**
   * Convert canvas coordinates to viewport coordinates
   * @param {number} canvasX screen x coordinate
   * @param {number} canvasY screen y coordinate
   * @return {object} viewport coordinates
   */
  getPointByCanvas(canvasX, canvasY) {
    return this.get('viewController').getPointByCanvas(canvasX, canvasY);
  }

  /**
   * Convert viewport coordinates to canvas coordinates
   * @param {number} x screen x coordinate
   * @param {number} y screen y coordinate
   * @return {object} canvas coordinates
   */
  getCanvasByPoint(x, y) {
    return this.get('viewController').getCanvasByPoint(x, y);
  }

  /**
   * Display elements
   * @param {string|object} item specified element
   */
  showItem(item) {
    this.get('itemController').changeItemVisibility(item, true);
  }

  /**
   * Hidden elements
   * @param {string|object} item specified element
   */
  hideItem(item) {
    this.get('itemController').changeItemVisibility(item, false);
  }

  /**
   * Find the element corresponding to id
   * @param {string} id element id
   * @return {object} element instance
   */
  findById(id) {
    return this.get('itemMap')[id];
  }

  /**
   * Find a single element according to the corresponding rule
   * @param {string} type element type (node|edge)
   * @param {string} fn specified rule
   * @return {object} element instance
   */
  find(type, fn) {
    let result;
    const items = this.get(type + 's');
    Util.each(items, (item, i) => {
      if (fn(item, i)) {
        result = item;
        return false;
      }
    });
    return result;
  }

  /**
   * Find all elements that meet the rule
   * @param {string} type element type (node|edge)
   * @param {string} fn specified rule
   * @return {array} element instance
   */
  findAll(type, fn) {
    const result = [];
    Util.each(this.get(type + 's'), (item, i) => {
      if (fn(item, i)) {
        result.push(item);
      }
    });
    return result;
  }

  /**
   * Find all elements in a specified state
   * @param {string} type element type (node|edge)
   * @param {string} state z state
   * @return {object} element instance
   */
  findAllByState(type, state) {
    return this.findAll(type, item => {
      return item.hasState(state);
    });
  }

  /**
   * Set whether to redraw automatically after update/refresh
   * @param {boolean} auto redraw automatically
   */
  setAutoPaint(auto) {
    this.set('autoPaint', auto);
  }

  /**
   * The dataUrl that returns the chart is used to generate pictures
   * @return {string/Object} picture dataURL
   */
  toDataURL() {
    const canvas = this.get('canvas');
    const renderer = canvas.getRenderer();
    const canvasDom = canvas.get('el');
    let dataURL = '';
    if (renderer === 'svg') {
      const clone = canvasDom.cloneNode(true);
      const svgDocType = document.implementation.createDocumentType(
        'svg', '-//W3C//DTD SVG 1.1//EN', 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'
      );
      const svgDoc = document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg', svgDocType);
      svgDoc.replaceChild(clone, svgDoc.documentElement);
      const svgData = (new XMLSerializer()).serializeToString(svgDoc);
      dataURL = 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svgData);
    } else if (renderer === 'canvas') {
      dataURL = canvasDom.toDataURL('image/png');
    }
    return dataURL;
  }

  /**
   * Canvas export pictures
   * @param {String} name The name of the picture
   */
  downloadImage(name) {
    const self = this;
    if (self.isAnimating()) {
      self.stopAnimate();
    }
    const canvas = self.get('canvas');
    const renderer = canvas.getRenderer();
    const fileName = (name || 'graph') + (renderer === 'svg' ? '.svg' : '.png');
    const link = document.createElement('a');
    setTimeout(() => {
      const dataURL = self.toDataURL();
      if (window.Blob && window.URL && renderer !== 'svg') {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blobObj = new Blob([ u8arr ], { type: mime });
        if (window.navigator.msSaveBlob) {
          window.navigator.msSaveBlob(blobObj, fileName);
        } else {
          link.addEventListener('click', function() {
            link.download = fileName;
            link.href = window.URL.createObjectURL(blobObj);
          });
        }
      } else {
        link.addEventListener('click', function() {
          link.download = fileName;
          link.href = dataURL;
        });
      }
      const e = document.createEvent('MouseEvents');
      e.initEvent('click', false, false);
      link.dispatchEvent(e);
    }, 16);
  }


  /**
   * Add plugin
   * @param {object} plugin example
   */
  addPlugin(plugin) {
    const self = this;
    if (plugin.destroyed) {
      return;
    }
    self.get('plugins').push(plugin);
    plugin.initPlugin(self);
  }

  /**
   * Remove plugin
   * @param {object} plugin example
   */
  removePlugin(plugin) {
    const plugins = this.get('plugins');
    const index = plugins.indexOf(plugin);
    if (index >= 0) {
      plugin.destroyPlugin();
      plugins.splice(index, 1);
    }
  }

  /**
   * Clear canvas elements
   * @return {object} this
   */
  clear() {
    const canvas = this.get('canvas');
    canvas.clear();
    this._initGroups();
    this.set({ itemMap: {}, nodes: [], edges: [] });
    return this;
  }

  /**
   * Destroy the canvas
   */
  destroy() {
    this.clear();
    Util.each(this.get('plugins'), plugin => {
      plugin.destroyPlugin();
    });
    this.get('eventController').destroy();
    this.get('itemController').destroy();
    this.get('modeController').destroy();
    this.get('viewController').destroy();
    this.get('stateController').destroy();
    this.get('canvas').destroy();
    this._cfg = null;
    this.destroyed = true;
  }
}

module.exports = Graph;
