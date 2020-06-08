const Hierarchy = require('@antv/hierarchy');
const Util = require('../util');
const Graph = require('./graph');

function indexOfChild(children, child) {
  let index = -1;
  Util.each(children, (former, i) => {
    if (child.id === former.id) {
      index = i;
      return false;
    }
  });
  return index;
}

class TreeGraph extends Graph {
  constructor(cfg) {
    super(cfg);
    // Used to cache the nodes that need to be deleted after the animation ends
    this.set('removeList', []);
    this.set('layoutMethod', this._getLayout());
  }
  getDefaultCfg() {
    const cfg = super.getDefaultCfg();
    // Tree map opens animation by default
    cfg.animate = true;
    return cfg;
  }
  /**
   * Render the view according to the data of the data interface
   */
  render() {
    const self = this;
    const data = self.get('data');
    if (!data) {
      throw new Error('data must be defined first');
    }
    self.clear();
    self.emit('beforerender');
    self.refreshLayout(this.get('fitView'));
    self.emit('afterrender');
  }
  /**
   * Add a subtree to the node with the corresponding id
   * @param {object} data subtree data model
   * @param {string} parent The parent node id of the subtree
   */
  addChild(data, parent) {
    const self = this;
    // Add data to the source data, take the changeData method
    if (!Util.isString(parent)) {
      parent = parent.get('id');
    }
    const parentData = self.findDataById(parent);
    if (!parentData.children) {
      parentData.children = [];
    }
    parentData.children.push(data);
    self.changeData();
  }
  // The calculated layout data is added to the graph
  _addChild(data, parent, animate) {
    const self = this;
    const model = data.data;
    // The model should store real data, especially real children
    model.x = data.x;
    model.y = data.y;
    model.depth = data.depth;
    const node = self.addItem('node', model);
    if (parent) {
      node.set('parent', parent);
      if (animate) {
        const origin = parent.get('origin');
        if (origin) {
          node.set('origin', origin);
        } else {
          const parentModel = parent.getModel();
          node.set('origin', {
            x: parentModel.x,
            y: parentModel.y
          });
        }
      }
      const childrenList = parent.get('children');
      if (!childrenList) {
        parent.set('children', [ node ]);
      } else {
        childrenList.push(node);
      }
      self.addItem('edge', { source: parent, target: node, id: parent.get('id') + ':' + node.get('id') });
    }
    // When rendering to the view, you should refer to the children of the layout to avoid drawing more collapsed nodes
    Util.each(data.children, child => {
      self._addChild(child, node, animate);
    });
    return node;
  }
  /**
   * Update the data model, update the difference and re-render
   * @param {object} data data model
   */
  changeData(data) {
    const self = this;
    if (data) {
      self.data(data);
      self.render();
    } else {
      self.refreshLayout(this.get('fitView'));
    }
  }
  /**
   * Update source data, difference update subtree
   * @param {object} data subtree data model
   * @param {string} parent The parent node id of the subtree
   */
  updateChild(data, parent) {
    const self = this;
    // If there is no parent node, it is a full update, reset the data directly
    if (!parent) {
      self.changeData(data);
      return;
    }
    const parentModel = self.findById(parent).getModel();
    const current = self.findById(data.id);
    // If the node does not exist, add
    if (!current) {
      if (!parentModel.children) {
        parentModel.children = [ current ];
      } else {
        parentModel.children.push(data);
      }
    } else {
      const index = indexOfChild(parentModel.children, data);
      parentModel.children[index] = data;
    }
    self.changeData();
  }

  // Transform changes in data to views
  _updateChild(data, parent, animate) {
    const self = this;
    const current = self.findById(data.id);
    // If the subtree does not exist, add it as a whole
    if (!current) {
      self._addChild(data, parent, animate);
      return;
    }
    // Update all child nodes under the new node
    Util.each(data.children, child => {
      self._updateChild(child, current, animate);
    });
    // Use the children instance of the current node to delete the removed child node
    const children = current.get('children');
    if (children) {
      const len = children.length;
      if (len > 0) {
        let child;
        for (let i = children.length - 1; i >= 0; i--) {
          child = children[i].getModel();
          if (indexOfChild(data.children, child) === -1) {
            self._removeChild(child.id, {
              x: data.x,
              y: data.y
            }, animate);
            // Update the list of child node item instances cached under the parent node
            children.splice(i, 1);
          }
        }
      }
    }
    const model = current.getModel();
    if (animate) {
      // If there is animation, first cache the node motion and then update the node
      current.set('origin', {
        x: model.x,
        y: model.y
      });
    }
    current.set('model', data.data);
    current.updatePosition({ x: data.x, y: data.y });
  }
  /**
   * Delete subtree
   * @param {string} id subtree root node id
   */
  removeChild(id) {
    const self = this;
    const node = self.findById(id);
    if (!node) {
      return;
    }
    const parent = node.get('parent');
    if (parent && !parent.destroyed) {
      const siblings = self.findDataById(parent.get('id')).children;
      const index = indexOfChild(siblings, node.getModel());
      siblings.splice(index, 1);
    }
    self.changeData();
  }
  // Delete the child node Item object
  _removeChild(id, to, animate) {
    const self = this;
    const node = self.findById(id);
    if (!node) {
      return;
    }
    Util.each(node.get('children'), child => {
      self._removeChild(child.getModel().id, to, animate);
    });
    if (animate) {
      const model = node.getModel();
      node.set('to', to);
      node.set('origin', { x: model.x, y: model.y });
      self.get('removeList').push(node);
    } else {
      self.removeItem(node);
    }
  }
  /**
   * Export graph data
   * @return {object} data
   */
  save() {
    return this.get('data');
  }
  /**
   * Get the corresponding source data according to id
   * @param {string|object} id element id
   * @param {object} parent From which node to start searching, when empty, start from the root
   * @return {object} corresponds to the source data
   */
  findDataById(id, parent) {
    const self = this;
    if (!parent) {
      parent = self.get('data');
    }
    if (id === parent.id) {
      return parent;
    }
    let result = null;
    Util.each(parent.children, child => {
      if (child.id === id) {
        result = child;
        return false;
      }
      result = self.findDataById(id, child);
      if (result) {
        return false;
      }
    });
    return result;
  }
  /**
   * Change and apply the tree layout algorithm
   * @param {object} layout layout algorithm
   */
  changeLayout(layout) {
    const self = this;
    if (!layout) {
      console.warn('layout cannot be null');
      return;
    }
    self.set('layout', layout);
    self.set('layoutMethod', self._getLayout());
    self.refreshLayout();
  }

  /**
   * Refresh the layout according to the current data and update to the canvas. Used to refresh the view after changing data.
   * @param {boolean} fitView Whether to adapt to the window when updating the layout
   */
  refreshLayout(fitView) {
    const self = this;
    const data = self.get('data');
    const layoutData = self.get('layoutMethod')(data, self.get('layout'));
    const animate = self.get('animate');
    const autoPaint = self.get('autoPaint');
    self.emit('beforerefreshlayout', { data, layoutData });
    self.setAutoPaint(false);
    self._updateChild(layoutData, null, animate);
    if (fitView) {
      self.get('viewController')._fitView();
    }
    if (!animate) {
      // If there is no animation, only the position of the node is updated, and the style of the edge is refreshed
      self.refresh();
      self.paint();
    } else {
      self.layoutAnimate(layoutData, null);
    }
    self.setAutoPaint(autoPaint);
    self.emit('afterrefreshlayout', { data, layoutData });
  }
  /**
   * Layout animation interface, used to animate node position update when data is updated
   * @param {object} data updated data
   * @param {function} onFrame defines how to move when the node position is updated
   * @param {number} duration animation time
   * @param {string} ease specified motion effect
   * @param {function} callback The callback when the animation ends
   * @param {number} delay animation delay execution (ms)
   */
  layoutAnimate(data, onFrame) {
    const self = this;
    this.setAutoPaint(false);
    const animateCfg = this.get('animateCfg');
    self.emit('beforeanimate', { data });
    // If no anchor point is specified in the edge, but it has anchor point control, keep the anchor point unchanged during the animation
    self.getEdges().forEach(edge => {
      const model = edge.get('model');
      if (!model.sourceAnchor) {
        model.sourceAnchor = edge.get('sourceAnchorIndex');
      }
    });
    this.get('canvas').animate({
      onFrame(ratio) {
        Util.traverseTree(data, child => {
          const node = self.findById(child.id);
          let origin = node.get('origin');
          const model = node.get('model');
          if (!origin) {
            origin = {
              x: model.x,
              y: model.y
            };
            node.set('origin', origin);
          }
          if (onFrame) {
            const attrs = onFrame(node, ratio, origin, data);
            node.set('model', Util.mix(model, attrs));
          } else {
            model.x = origin.x + (child.x - origin.x) * ratio;
            model.y = origin.y + (child.y - origin.y) * ratio;
          }
        });
        Util.each(self.get('removeList'), node => {
          const model = node.getModel();
          const from = node.get('origin');
          const to = node.get('to');
          model.x = from.x + (to.x - from.x) * ratio;
          model.y = from.y + (to.y - from.y) * ratio;
        });
        self.refreshPositions();
      }
    }, animateCfg.duration, animateCfg.ease, () => {
      Util.each(self.getNodes(), node => {
        node.set('origin', null);
      });
      Util.each(self.get('removeList'), node => {
        self.removeItem(node);
      });
      self.set('removeList', []);
      if (animateCfg.callback) {
        animateCfg.callback();
      }
      self.paint();
      this.setAutoPaint(true);
      self.emit('afteranimate', { data });
    }, animateCfg.delay);
  }
  /**
   * Stop layout animation immediately
   */
  stopLayoutAnimate() {
    this.get('canvas').stopAnimate();
    this.emit('layoutanimateend', { data: this.get('data') });
    this.layoutAnimating = false;
  }

  /**
   * Is the layout animation
   * @return {boolean} Is there a layout animation
   */
  isLayoutAnimating() {
    return this.layoutAnimating;
  }
  _getLayout() {
    const layout = this.get('layout');
    if (!layout) {
      return null;
    }
    if (typeof layout === 'function') {
      return layout;
    }
    if (!layout.type) {
      layout.type = 'dendrogram';
    }
    if (!layout.direction) {
      layout.direction = 'TB';
    }
    if (layout.radial) {
      return function(data) {
        const layoutData = Hierarchy[layout.type](data, layout);
        Util.radialLayout(layoutData);
        return layoutData;
      };
    }
    return function(data) {
      return Hierarchy[layout.type](data, layout);
    };
  }
}

module.exports = TreeGraph;
