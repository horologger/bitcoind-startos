import { sdk } from '../sdk'
import { configSpec } from './config/spec'

export const rpcPort = 8332
export const rpcInterfaceId = 'rpc'
export const peerPort = 8333
export const peerInterfaceId = 'peer'
export const zmqBlockPort = 28332
export const zmqTxPort = 28333
export const zmqInterfaceId = 'zmq'

/**
 * ======================== Interfaces ========================
 *
 * In this section, you will decide how the service will be exposed to the outside world
 *
 * This function runs on service install/update AND on config save
 */
export const setInterfaces = sdk.setupInterfaces(
  configSpec,
  async ({ effects, utils, input }) => {
    const rpc = utils.host.multi('multi') // technically just a multi hostname
    const rpcOrigin = await rpc.bindPort(8332, {
      protocol: 'http',
      preferredExternalPort: 8332,
      scheme: 'btcstandup',
    })
    const rpcInterface = utils.createInterface({
      name: 'RPC',
      id: rpcInterfaceId,
      description: 'The RPC interface for Bitcoin Core',
      ui: false,
      username: input?.rpc.username || null,
      path: '',
      search: {},
    })

    const rpcReceipt = await rpcInterface.export([rpcOrigin])

    return [rpcReceipt]
  },
)
