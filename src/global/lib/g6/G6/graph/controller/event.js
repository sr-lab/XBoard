const Util = require('../../util');

const EVENTS = [
  'click',
  'mousedown',
  'mouseup',
  'dblclick',
  'contextmenu',
  'mouseenter',
  'mouseout',
  'mouseover',
  'mousemove',
  'mouseleave',
  'dragstart',
  'dragend',
  'drag',
  'dragenter',
  'dragleave',
  'drop'
];

function getItemRoot(shape) {
  while (shape && !shape.get('item')) {
    shape = shape.get('parent');
  }
  return shape;
}

const ORIGIN_MATRIX = [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ];
const MATRIX_LEN = 9;

function isViewportChanged(matrix) {
  for (let i = 0; i < MATRIX_LEN; i++) {
    if (matrix[i] !== ORIGIN_MATRIX[i]) {
      return true;
    }
  }
  return false;
}

class Event {
  constructor(graph) {
    this.graph = graph;
    this.extendEvents = [];
    this._initEvents();
  }
  _initEvents() {
    const self = this;
    const graph = self.graph;
    const canvas = graph.get('canvas');
    const el = canvas.get('el');
    const extendEvents = self.extendEvents;
    const canvasHandler = Util.wrapBehavior(self, '_onCanvasEvents');
    const originHandler = Util.wrapBehavior(self, '_onExtendEvents');
    const wheelHandler = Util.wrapBehavior(self, '_onWheelEvent');
    Util.each(EVENTS, event => {
      canvas.on(event, canvasHandler);
    });
    this.canvasHandler = canvasHandler;
    extendEvents.push(Util.addEventListener(el, 'DOMMouseScroll', wheelHandler));
    extendEvents.push(Util.addEventListener(el, 'mousewheel', wheelHandler));
    window && extendEvents.push(Util.addEventListener(window, 'keydown', originHandler));
    window && extendEvents.push(Util.addEventListener(window, 'keyup', originHandler));
  }
  _onCanvasEvents(e) {
    const self = this;
    const graph = self.graph;
    const canvas = graph.get('canvas');
    const pixelRatio = canvas.get('pixelRatio');
    const target = e.target;
    const eventType = e.type;
    /**
     * (clientX, clientY): coordinates relative to the page;
     * (canvasX, canvasY): relative to the upper left corner of <canvas>;
     * (x, y): relative to the coordinates of the entire canvas, it is in the same dimension as the x, y of the model.
     */
    e.canvasX = e.x / pixelRatio;
    e.canvasY = e.y / pixelRatio;
    let point = { x: e.canvasX, y: e.canvasY };
    if (isViewportChanged(graph.get('group').getMatrix())) {
      point = graph.getPointByCanvas(e.canvasX, e.canvasY);
    }
    e.x = point.x;
    e.y = point.y;
    // Event currentTarget is graph
    e.currentTarget = graph;
    if (target === canvas) {
      if (eventType === 'mousemove') {
        self._handleMouseMove(e, 'canvas');
      }
      e.target = canvas;
      e.item = null;
      graph.emit(eventType, e);
      graph.emit('canvas:' + eventType, e);
      return;
    }
    const itemShape = getItemRoot(target);
    if (!itemShape) {
      graph.emit(eventType, e);
      return;
    }
    const item = itemShape.get('item');
    if (item.destroyed) {
      return;
    }
    const type = item.getType();
    // Event target is the Shape instance that triggered the event, and item is the item instance that triggered the event
    e.target = target;
    e.item = item;
    graph.emit(eventType, e);
    // The event of g will bubble. If the target is not canvas, it may cause the same node to trigger multiple times, which needs to be judged separately.
    if (eventType === 'mouseenter' || eventType === 'mouseleave' || eventType === 'dragenter' || eventType === 'dragleave') {
      return;
    }
    graph.emit(type + ':' + eventType, e);
    if (eventType === 'dragstart') {
      self.dragging = true;
    }
    if (eventType === 'dragend') {
      self.dragging = false;
    }
    if (eventType === 'mousemove') {
      self._handleMouseMove(e, type);
    }
  }
  _onExtendEvents(e) {
    this.graph.emit(e.type, e);
  }
  _onWheelEvent(e) {
    if (Util.isNil(e.wheelDelta)) {
      e.wheelDelta = -e.detail;
    }
    this.graph.emit('wheel', e);
  }
  _handleMouseMove(e, type) {
    const self = this;
    const canvas = this.graph.get('canvas');
    const item = e.target === canvas ? null : e.item;
    const preItem = this.preItem;
    // Avoid that the type of e is different from the triggered event
    e = Util.cloneEvent(e);
    // Move directly from the previous item to the current item, triggering the leave event of the previous item
    if (preItem && preItem !== item && !preItem.destroyed) {
      e.item = preItem;
      self._emitCustomEvent(preItem.getType(), 'mouseleave', e);
      if (self.dragging) {
        self._emitCustomEvent(preItem.getType(), 'dragleave', e);
      }
    }
    // Move from an item or canvas to the current item, trigger the enter event of the current item
    if (item && preItem !== item) {
      e.item = item;
      self._emitCustomEvent(type, 'mouseenter', e);
      if (self.dragging) {
        self._emitCustomEvent(type, 'dragenter', e);
      }
    }
    this.preItem = item;
  }
  _emitCustomEvent(itemType, type, e) {
    e.type = type;
    this.graph.emit(itemType + ':' + type, e);
  }
  destroy() {
    const graph = this.graph;
    const canvasHandler = this.canvasHandler;
    const canvas = graph.get('canvas');
    Util.each(EVENTS, event => {
      canvas.off(event, canvasHandler);
    });
    Util.each(this.extendEvents, event => {
      event.remove();
    });
  }
}

module.exports = Event;
