const Util = require('../../util');
const Item = require('../../item');

const NODE = 'node';
const EDGE = 'edge';
const CFG_PREFIX = 'default';
const MAPPER_SUFFIX = 'Mapper';
const hasOwnProperty = Object.hasOwnProperty;

class ItemController {
  constructor(graph) {
    this.graph = graph;
  }
  addItem(type, model) {
    const graph = this.graph;
    const parent = graph.get(type + 'Group') || graph.get('group');
    const upperType = Util.upperFirst(type);
    let item;
    let styles = graph.get(type + 'Style') || {};
    const defaultModel = graph.get(CFG_PREFIX + upperType);
    const mapper = graph.get(type + MAPPER_SUFFIX);
    if (mapper) {
      const mappedModel = mapper(model);
      if (mappedModel.styles) {
        styles = mappedModel.styles;
        delete mappedModel.styles;
      }
      Util.each(mappedModel, (val, cfg) => {
        model[cfg] = val;
      });
    } else if (defaultModel) {
      // Many layouts will directly modify the original data model, so you cannot use the form of merge to write into the original model one by one
      Util.each(defaultModel, (val, cfg) => {
        if (!hasOwnProperty.call(model, cfg)) {
          if (Util.isObject(val)) {
            model[cfg] = Util.clone(val);
          } else {
            model[cfg] = defaultModel[cfg];
          }
        }
      });
    }
    graph.emit('beforeadditem', { type, model });
    if (type === EDGE) {
      let source = model.source;
      let target = model.target;
      if (source && Util.isString(source)) {
        source = graph.findById(source);
      }
      if (target && Util.isString(target)) {
        target = graph.findById(target);
      }
      if (!source || !target) {
        console.warn('The source or target node of edge ' + model.id + ' does not exist!');
        return;
      }
      item = new Item[upperType]({
        model,
        source,
        target,
        styles,
        linkCenter: graph.get('linkCenter'),
        group: parent.addGroup()
      });
    } else {
      item = new Item[upperType]({
        model,
        styles,
        group: parent.addGroup()
      });
    }
    graph.get(type + 's').push(item);
    graph.get('itemMap')[item.get('id')] = item;
    graph.autoPaint();
    graph.emit('afteradditem', { item, model });
    return item;
  }
  updateItem(item, cfg) {
    const graph = this.graph;
    if (Util.isString(item)) {
      item = graph.findById(item);
    }
    if (!item || item.destroyed) {
      return;
    }
    // If the data items related to the mapped attributes are modified, the mapped attributes need to be changed accordingly
    const mapper = graph.get(item.getType() + MAPPER_SUFFIX);
    if (mapper) {
      const newModel = Util.mix({}, item.getModel(), cfg);
      const mappedModel = mapper(newModel);
      if (mappedModel.styles) {
        item.set('styles', mappedModel.styles);
        delete mappedModel.styles;
      }
      Util.each(mappedModel, (val, key) => {
        cfg[key] = val;
      });
    }
    graph.emit('beforeupdateitem', { item, cfg });
    if (item.getType() === EDGE) {
      // If you want to update source || target, in order not to affect the internal model of the example, and recalculate startPoint and endPoint, manually set
      if (cfg.source) {
        let source = cfg.source;
        if (Util.isString(source)) {
          source = graph.findById(source);
        }
        item.setSource(source);
      }
      if (cfg.target) {
        let target = cfg.target;
        if (Util.isString(target)) {
          target = graph.findById(target);
        }
        item.setTarget(target);
      }
    }
    item.update(cfg);
    if (item.getType() === NODE) {
      const autoPaint = graph.get('autoPaint');
      graph.setAutoPaint(false);
      Util.each(item.getEdges(), edge => {
        graph.refreshItem(edge);
      });
      graph.setAutoPaint(autoPaint);
    }
    graph.autoPaint();
    graph.emit('afterupdateitem', { item, cfg });
  }
  removeItem(item) {
    const graph = this.graph;
    if (Util.isString(item)) {
      item = graph.findById(item);
    }
    if (!item || item.destroyed) {
      return;
    }
    graph.emit('beforeremoveitem', { item });
    const type = item.getType();
    const items = graph.get(item.getType() + 's');
    const index = items.indexOf(item);
    items.splice(index, 1);
    delete graph.get('itemMap')[item.get('id')];
    if (type === NODE) {
      // If you are removing a node, you need to delete the edges connected to it
      const edges = item.getEdges();
      for (let i = edges.length; i >= 0; i--) {
        graph.removeItem(edges[i]);
      }
    }
    item.destroy();
    graph.autoPaint();
    graph.emit('afterremoveitem', { item });
  }
  setItemState(item, state, enabled) {
    const graph = this.graph;
    if (item.hasState(state) === enabled) {
      return;
    }
    graph.emit('beforeitemstatechange', { item, state, enabled });
    item.setState(state, enabled);
    graph.autoPaint();
    graph.emit('afteritemstatechange', { item, state, enabled });
  }
  clearItemStates(item, states) {
    const graph = this.graph;
    if (Util.isString(item)) {
      item = graph.findById(item);
    }
    graph.emit('beforeitemstatesclear', { item, states });
    item.clearStates(states);
    graph.autoPaint();
    graph.emit('afteritemstatesclear', { item, states });
  }
  refreshItem(item) {
    const graph = this.graph;
    if (Util.isString(item)) {
      item = graph.findById(item);
    }
    graph.emit('beforeitemrefresh', { item });
    item.refresh();
    graph.autoPaint();
    graph.emit('afteritemrefresh', { item });
  }
  changeItemVisibility(item, visible) {
    const self = this;
    const graph = self.graph;
    if (Util.isString(item)) {
      item = graph.findById(item);
    }
    graph.emit('beforeitemvisibilitychange', { item, visible });
    item.changeVisibility(visible);
    if (item.getType() === NODE) {
      const autoPaint = graph.get('autoPaint');
      graph.setAutoPaint(false);
      Util.each(item.getEdges(), edge => {
        // If the node is hidden, the associated edge is also hidden
        // If a node is displayed, the associated edge will also be displayed, but it is necessary to determine that the nodes at both ends of the edge are visible
        if (visible && (!(edge.get('source').isVisible() && edge.get('target').isVisible()))) {
          return;
        }
        self.changeItemVisibility(edge, visible);
      });
      graph.setAutoPaint(autoPaint);
    }
    graph.autoPaint();
    graph.emit('afteritemvisibilitychange', { item, visible });
  }
  destroy() {
    this.graph = null;
    this.destroyed = true;
  }
}

module.exports = ItemController;
