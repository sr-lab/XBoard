/**
 * @fileOverview In the process of customizing nodes and edges, a lot of duplicate code was found
 * @author dxq613@gmail.com
 */
const Global = require('../global');
const Util = require('../util/index');

const CLS_SHAPE_SUFFIX = '-shape';
const CLS_LABEL_SUFFIX = '-label';

// A single shape with a label, share this code
const SingleShape = {
  itemType: '', // node, edge, group, anchor 等
	/**
   * Draw nodes/edges, including text
   * @override
   * @param {Object} cfg node configuration items
   * @param {G.Group} group node container
   * Graphic drawn by @return {G.Shape}
	 */
  draw(cfg, group) {
    const shape = this.drawShape(cfg, group);
    shape.set('className', this.itemType + CLS_SHAPE_SUFFIX);
    if (cfg.label) {
      const label = this.drawLabel(cfg, group);
      label.set('className', this.itemType + CLS_LABEL_SUFFIX);
    }
    return shape;
  },
  drawShape(/* cfg, group */) {

  },
  drawLabel(cfg, group) {
    const labelCfg = cfg.labelCfg || {};
    const labelStyle = this.getLabelStyle(cfg, labelCfg, group);
    const label = group.addShape('text', {
      attrs: labelStyle
    });
    return label;
  },
  getLabelStyleByPosition(/* cfg, labelCfg, group */) {

  },
  /**
   * Get text configuration items
   * @internal will update the text when creating and updating nodes/edges
   * @param {Object} cfg node configuration items
   * @param {Object} labelCfg text configuration item
   * @param {G.Group} group parent container, label positioning may be related to graphics
   * @return {Object} graphic configuration item
   */
  getLabelStyle(cfg, labelCfg, group) {
    const calculateStyle = this.getLabelStyleByPosition(cfg, labelCfg, group);
    calculateStyle.text = cfg.label;
    const attrName = this.itemType + 'Label'; // Get the configuration items of nodeLabel and edgeLabel
    const defaultStyle = Global[attrName] ? Global[attrName].style : null;
    const labelStyle = Util.mix({}, defaultStyle, calculateStyle, labelCfg.style);
    return labelStyle;
  },
  /**
	 * Get graphic configuration items
   * @internal is only used to define this type of node, users create and update nodes
   * @param {Object} cfg node configuration items
   * @return {Object} graphic configuration item
	 */
  getShapeStyle(cfg) {
    return cfg.style;
  },
	/**
	 * Update node with text
   * @override
   * @param {Object} cfg node/edge configuration items
   * @param {G6.Item} item node/edge
	 */
  update(cfg, item) {
    const group = item.getContainer();
    const shapeClassName = this.itemType + CLS_SHAPE_SUFFIX;
    const shape = group.findByClassName(shapeClassName);
    const shapeStyle = this.getShapeStyle(cfg);
    shape.attr(shapeStyle);
    const labelClassName = this.itemType + CLS_LABEL_SUFFIX;
    const label = group.findByClassName(labelClassName);
		// At this time, there are three situations that need to be considered whether the label has been drawn before
    // // 1. No label is needed when updating, but the label originally existed and needs to be deleted at this time
    // // 2. A label is required for updating, but it does not exist originally, create a node
    // // 3. If both exist, update
    if (!cfg.label) {
      label && label.remove();
    } else {
      if (!label) {
        const newLabel = this.drawLabel(cfg, group);
        newLabel.set('className', labelClassName);
      } else {
        const labelCfg = cfg.labelCfg || {};
        const labelStyle = this.getLabelStyle(cfg, labelCfg, group);
        /**
         * fixme The rotation of the shape in g is the cumulative angle, not the desired angle of the rotation of the label
         * Since the label only has rotate operation now, if there is rotate in the style, the transformation will be reset when the label is updated
         * In the future, a Label will be copied based on the Text of g to deal with this type of problem
         */
        label.resetMatrix();
        label.attr(labelStyle);
      }
    }
  },

	/**
	 * Set the state of the node, mainly the interactive state, please implement the business state in the draw method
   * The node of single graph only considers the selected and active states, and users with other states need to copy this method themselves
   * @override
   * @param {String} name State name
   * @param {Object} value status value
   * @param {G6.Item} item node
   */
  setState(name, value, item) {
    const shape = item.get('keyShape');
    if (!shape) {
      return;
    }
    const stateStyle = item.getStateStyle(name);
    if (value) { // If the state is set, the drawing attributes are superimposed on the original state
      shape.attr(stateStyle);
    } else {// Reset all states when canceling the state, superimpose the remaining states in turn
      const style = item.getCurrentStatesStyle();
      // If attr is not set in the default state, if it is set in a certain state, it needs to be reset to the state without setting
      Util.each(stateStyle, (val, attr) => {
        if (!style[attr]) {
          style[attr] = null;
        }
      });
      shape.attr(style);
    }
  }
};

module.exports = SingleShape;
