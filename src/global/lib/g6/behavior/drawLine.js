/**
 * Created by OXOYO on 2019/7/4.
 *
 * 连线
 */

export default {
  name: 'draw-line',
  options: {
    getEvents () {
      return {
        'node:click': 'onNodeClick',
        'canvas:mousemove': 'onMousemove',
        'edge:click': 'onEdgeClick'
      }
    },
    onNodeClick (event) {
      let _t = this
      let node = event.item
      let target
      // Anchor point data
      let anchorPoints = node.getAnchorPoints()
      if (anchorPoints && anchorPoints.length) {
        // Get the anchor point closest to the specified coordinate
        target = node.getLinkPoint({ x: event.x, y: event.y })
      } else {
        target = node
      }
      if (_t.graph.$X.isDrawing && _t.graph.$X.currentEdge) {
        _t.graph.updateItem(_t.graph.$X.currentEdge, {
          target: target
        })

        _t.graph.$X.currentEdge = null
        _t.graph.$X.isDrawing = false
        _t.shouldEnd.call(this, event)
      } else {
        _t.graph.$X.currentEdge = _t.graph.addItem('edge', {
          // start node
          source: target,
          // Terminate node/location
          target: {
            x: event.x,
            y: event.y
          },

          // FIXME: The form of the edge needs to be linked with the toolbar
          shape: _t.graph.$X.lineType || 'line',
          startArrow: _t.graph.$X.startArrow || false,
          endArrow: _t.graph.$X.endArrow || false
        })
        _t.graph.$X.isDrawing = true
      }
    },
    onMousemove (event) {
      let _t = this
      if (_t.graph.$X.isDrawing && _t.graph.$X.currentEdge) {
        _t.graph.updateItem(_t.graph.$X.currentEdge, {
          target: {
            x: event.x,
            y: event.y
          }
        })
      }
    },
    onEdgeClick (event) {
      let _t = this
      if (_t.graph.$X.isDrawing && _t.graph.$X.currentEdge === event.item) {
        // Click on the line drawing process to remove the current line drawing
        _t.graph.removeItem(_t.graph.$X.currentEdge)

        _t.graph.$X.currentEdge = null
        _t.graph.$X.isDrawing = false
      }
    }
  }
}
