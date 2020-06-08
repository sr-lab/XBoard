const { mix } = require('../util');
const { delegateStyle } = require('../global');
const body = document.body;

module.exports = {
  getDefaultCfg() {
    return {
      updateEdge: true,
      delegate: true,
      delegateStyle: {}
    };
  },
  getEvents() {
    return {
      'node:dragstart': 'onDragStart',
      'node:drag': 'onDrag',
      'node:dragend': 'onDragEnd',
      'canvas:mouseleave': 'onOutOfRange'
    };
  },
  onDragStart(e) {
    if (!this.shouldBegin.call(this, e)) {
      return;
    }
    this.target = e.item;
    this.origin = {
      x: e.x,
      y: e.y
    };
  },
  onDrag(e) {
    if (!this.origin) {
      return;
    }
    if (!this.get('shouldUpdate').call(this, e)) {
      return;
    }
    this._update(this.target, e);
  },
  onDragEnd(e) {
    if (!this.shouldEnd.call(this, e)) {
      return;
    }
    if (!this.origin) {
      return;
    }
    const delegateShape = this.target.get('delegateShape');
    if (delegateShape) {
      delegateShape.remove();
      this.target.set('delegateShape', null);
    }
    this._update(this.target, e, true);
    this.point = null;
    this.origin = null;
    // When terminating, you need to determine whether you are monitoring the mouseup event outside the canvas at this time.
    const fn = this.fn;
    if (fn) {
      body.removeEventListener('mouseup', fn, false);
      this.fn = null;
    }
  },
  // If the mouse moves out of the canvas area while dragging, releasing the mouse at this time cannot terminate the drag behavior. Monitor the mouseup event outside the canvas, and terminate it when it is released
  onOutOfRange(e) {
    const self = this;
    if (this.origin) {
      const canvasElement = self.graph.get('canvas').get('el');
      const fn = ev => {
        if (ev.target !== canvasElement) {
          self.onDragEnd(e);
        }
      };
      this.fn = fn;
      body.addEventListener('mouseup', fn, false);
    }
  },
  _update(item, e, force) {
    const origin = this.origin;
    const model = item.get('model');
    if (!this.point) {
      this.point = {
        x: model.x,
        y: model.y
      };
    }
    const x = e.x - origin.x + this.point.x;
    const y = e.y - origin.y + this.point.y;
    this.origin = { x: e.x, y: e.y };
    this.point = { x, y };
    if (this.delegate && !force) {
      this._updateDelegate(item, x, y);
      return;
    }
    if (this.get('updateEdge')) {
      this.graph.updateItem(item, { x, y });
    } else {
      item.updatePosition({ x, y });
      this.graph.paint();
    }
  },
  _updateDelegate(item, x, y) {
    const self = this;
    let shape = item.get('delegateShape');
    const bbox = item.get('keyShape').getBBox();
    if (!shape) {
      const parent = self.graph.get('group');
      const attrs = mix({}, delegateStyle, this.delegateStyle);
      // x, y on the model are relative to the center of the graph, delegateShape is the instance of g, and x, y are the absolute coordinates
      shape = parent.addShape('rect', {
        attrs: {
          width: bbox.width,
          height: bbox.height,
          x: x - bbox.width / 2,
          y: y - bbox.height / 2,
          ...attrs
        }
      });
      shape.set('capture', false);
      item.set('delegateShape', shape);
    }
    shape.attr({ x: x - bbox.width / 2, y: y - bbox.height / 2 });
    this.graph.paint();
  }
};
