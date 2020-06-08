/**
 * @fileOverview common node shape
 * @author huangtonger@aliyun.com
 */

const Shape = require('./shape');
const Util = require('../util/index');
const Global = require('../global');
const SingleShapeMixin = require('./single-shape-mixin');

// Register Node's factory method
Shape.registerFactory('node', {
  defaultShapeType: 'circle'
});

const singleNodeDefinition = Util.mix({}, SingleShapeMixin, {
  itemType: 'node',
  // Types of individual graphics
  shapeType: '',
  /**
   * The position of the text relative to the graphic, the default is the center point
   * Positions include: top, bottom, left, right, center
   * @type {String}
   */
  labelPosition: 'center',
  /**
   * Get node width and height
   * @internal returns the size of the node, maintained in the manner of [width, height]
   * @param {Object} cfg node configuration items
   * @return {Array} width and height
   */
  getSize(cfg) {
    let size = cfg.size || Global.defaultNode.size;
    if (!Util.isArray(size)) {
      size = [ size, size ];
    }
    return size;
  },
  // Private method, this method is not replicated by nodes that do not want to expand
  getLabelStyleByPosition(cfg, labelCfg) {
    const labelPosition = labelCfg.position || this.labelPosition;
    // The default position (the most likely case), so put it on top
    if (labelPosition === 'center') {
      return { x: 0, y: 0 };
    }
    const size = this.getSize(cfg);
    const width = size[0];
    const height = size[1];
    let offset = labelCfg.offset;
    if (Util.isNil(offset)) { // Consider the scenario with offset = 0, instead of labelCfg.offset || Global.nodeLabel.offset
      offset = Global.nodeLabel.offset; // Offset when not centered
    }
    let style;
    switch (labelPosition) {
      case 'top':
        style = {
          x: 0,
          y: 0 - height / 2 - offset,
          textBaseline: 'bottom' // The text is above the graphic
        };
        break;
      case 'bottom':
        style = {
          x: 0,
          y: height / 2 + offset,
          textBaseline: 'top'
        };
        break;
      case 'left':
        style = {
          x: 0 - width / 2 - offset,
          y: 0,
          textAlign: 'right'
        };
        break;
      default:
        style = {
          x: width / 2 + offset,
          y: 0,
          textAlign: 'left'
        };
        break;
    }
    return style;
  },
  drawShape(cfg, group) {
    const shapeType = this.shapeType; // || this.type，Have added shapeType
    const style = this.getShapeStyle(cfg);
    const shape = group.addShape(shapeType, {
      attrs: style
    });
    return shape;
  }
});
// The basis of a single figure can have a label, the default label is centered
Shape.registerNode('single-shape', singleNodeDefinition);

/**
 * Basic circle, you can add text, the default text is centered
 */
Shape.registerNode('circle', {
  shapeType: 'circle',
  getShapeStyle(cfg) {
    const size = this.getSize(cfg);
    const color = cfg.color || Global.defaultNode.color;
    const style = Util.mix({}, {
      x: 0, // The position of the node is determined in the upper layer, so here only the relative position can be used
      y: 0,
      r: size[0] / 2, // size can generally provide width and height information
      stroke: color
    }, Global.defaultNode.style, cfg.style);
    return style;
  }
}, 'single-shape');

/**
 * Basic ellipse, you can add text, the default text is centered
 */
Shape.registerNode('ellipse', {
  shapeType: 'ellipse',
  getShapeStyle(cfg) {
    const size = this.getSize(cfg);
    const rx = size[0] / 2;
    const ry = size[1] / 2;
    const color = cfg.color || Global.defaultNode.color;
    const style = Util.mix({}, {
      x: 0, // The position of the node is determined in the upper layer, so here only the relative position can be used
      y: 0,
      rx, // size can generally provide width and height information
      ry,
      stroke: color
    }, Global.defaultNode.style, cfg.style);
    return style;
  }
}, 'single-shape');

/**
 * Basic rectangle, you can add text, the default text is centered
 */
Shape.registerNode('rect', {
  shapeType: 'rect',
  getShapeStyle(cfg) {
    const size = this.getSize(cfg);
    const width = size[0];
    const height = size[1];
    const color = cfg.color || Global.defaultNode.color;
    const style = Util.mix({}, Global.defaultNode.style, {
      x: 0 - width / 2, // The position of the node is determined in the upper layer, so here only the relative position can be used
      y: 0 - height / 2,
      width,
      height,
      stroke: color
    }, cfg.style);
    return style;
  }
}, 'single-shape');

/**
 * Basic pictures, you can add text, the default text is below the picture
 */
Shape.registerNode('image', {
  shapeType: 'image',
  labelPosition: 'bottom',
  getShapeStyle(cfg) {
    const size = this.getSize(cfg);
    const img = cfg.img;
    const width = size[0];
    const height = size[1];
    const style = Util.mix({}, {
      x: 0 - width / 2, // The position of the node is determined in the upper layer, so here only the relative position can be used
      y: 0 - height / 2,
      width,
      height,
      img
    }, cfg.style);
    return style;
  }
}, 'single-shape');

