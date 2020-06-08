/**
 * Created by OXOYO on 2019/7/3.
 *
 * Package G6
 */

// import G6 from '@antv/g6'
// FIXME Call G6 source code for easy debugging
import G6 from './G6'
import registerBehavior from './behavior/index'
import registerEdge from './edge/index'
import registerNode from './node/index'

import config from './config/index'

// Mount config
G6.$C = config

// Register interaction
registerBehavior(G6)
// register side
registerEdge(G6)
// Register node
registerNode(G6)

export default G6
