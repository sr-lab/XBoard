module.exports = {
  getDefaultCfg() {
    return {
      /**
       * Callback when contraction/expansion changes occur
       */
      onChange() {}
    };
  },
  getEvents() {
    return {
      'node:click': 'onNodeClick'
    };
  },
  onNodeClick(e) {
    const item = e.item;
    // If the node has been updated, the model will be merged, and directly changing the model can not change the layout, so you need to change the source data
    const sourceData = this.graph.findDataById(item.get('id'));
    const children = sourceData.children;
    // The contraction and expansion of the leaf node is meaningless
    if (!children || children.length === 0) {
      return;
    }
    const collapsed = !sourceData.collapsed;
    if (!this.shouldBegin(e, collapsed)) {
      return;
    }
    sourceData.collapsed = collapsed;
    item.getModel().collapsed = collapsed;
    this.graph.emit('itemcollapsed', { item: e.item, collapsed });
    if (!this.shouldUpdate(e, collapsed)) {
      return;
    }
    try {
      this.onChange(item, collapsed);
    } catch (e) {
      console.warn('G6 since version 3.0.4 supports getting source data directly from item.getModel() (temporary notification, will be cleared in a later version)', e);
    }
    this.graph.refreshLayout();
  }
};
