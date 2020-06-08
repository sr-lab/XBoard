const Util = require('../util');
const Behavior = {};

/**
 * Method of registering behavior
 * @param {string} type Behavior type, external reference must be specified, do not duplicate the existing behavior type
 * @param {object} behavior Behavioral content, including elements, see the details of the augmentation
 */
Behavior.registerBehavior = function(type, behavior) {
  if (!behavior) {
    throw new Error('please specify handler for this behavior:' + type);
  }
  const base = function(cfg) {
    const self = this;
    Util.mix(self, self.getDefaultCfg(), cfg);
    const events = self.getEvents();
    if (events) {
      const eventsToBind = {};
      Util.each(events, (handler, event) => {
        eventsToBind[event] = Util.wrapBehavior(self, handler);
      });
      this._events = eventsToBind;
    }
  };
  Util.augment(base, {
    /**
     * Whether to prevent the behavior from happening, not by default
     * @return {boolean} Does not trigger behavior when returning false
     */
    shouldBegin() {
      return true;
    },
    /**
     * Whether to prevent behavior from updating data and changing the view
     * @return {boolean} Update data when false
     */
    shouldUpdate() {
      return true;
    },
    /**
     * Whether to prevent the behavior from entering the termination state
     * @return {boolean} Block when returning false
     */
    shouldEnd() {
      return true;
    },
    /**
     * The event listener that defines the behavior, the behavior will automatically bind the event internally.
     * 例如： return { click: 'onClick' }, Internally, the click event of the graph will be monitored to trigger this.onClick
     */
    getEvents() {},
    /**
     * Bind events, bind getEvents return events by default, no need to overwrite
     * @param {object} graph canvas example
     */
    bind(graph) {
      const events = this._events;
      this.graph = graph;
      Util.each(events, (handler, event) => {
        graph.on(event, handler);
      });
    },
    /**
     * Unbind events are mostly used to switch behavior modes. By default, unbind getEvents returns events. When rewriting bind, you need to rewrite unbind at the same time.
     * @param {object} graph canvas example
     */
    unbind(graph) {
      const events = this._events;
      Util.each(events, (handler, event) => {
        graph.off(event, handler);
      });
    },
    get(val) {
      return this[val];
    },
    set(key, val) {
      this[key] = val;
      return this;
    },
    /**
     * Define the default parameters of the custom behavior, which will be merged with the parameters passed by the user
     */
    getDefaultCfg() {}
  }, behavior);
  Behavior[type] = base;
};

Behavior.hasBehavior = function(type) {
  return !!Behavior[type];
};

Behavior.getBehavior = function(type) {
  return Behavior[type];
};

module.exports = Behavior;

