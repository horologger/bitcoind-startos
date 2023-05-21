import { sdk } from '../../sdk'
import { readConf } from './conf'
import { configSpec } from './spec'

/**
 * This function executes on config get
 *
 * Use this function to gather data from various files and assemble into a valid config to display to the user
 */
export const read = sdk.setupConfigRead(
  configSpec,
  async ({ effects, utils }) => {
    const conf = await readConf([
      'rpcbind',
      'rpcallowip',
      'rpcuser',
      'rpcuser',
      'rpcauth',
      'rpcserialversion',
      'rpcservertimeout',
      'rpcthreads',
      'rpcworkqueue',
      'mempoolfullrbf',
      'persistmempool',
      'maxmempool',
      'mempoolexpiry',
      'listen',
      'bind',
      'connect',
      'addnode',
      'onlynet',
      'whitelist',
      'prune',
      'dbcache',
      'disablewallet',
      'avoidpartialspends',
      'discardfee',
      'zmqpubrawblock',
      'zmqpubhashblock',
      'zmqpubrawtx',
      'zmqpubhashtx',
      'zmqpubsequence',
      'txindex',
      'peerbloomfilters',
      'blockfilterindex',
      'peerblockfilters',
    ] as const)
    return {
      rpc: {
        enable: !!conf.rpcbind.length,
        username: conf.rpcuser[0],
        advanced: {
          auth: conf.rpcauth,
          serialversion:
            conf.rpcserialversion[0] === '0'
              ? ('non-segwit' as const)
              : ('segwit' as const),
          servertimeout: conf.rpcservertimeout[0]
            ? parseInt(conf.rpcservertimeout[0])
            : 30,
          threads: conf.rpcthreads[0] ? parseInt(conf.rpcthreads[0]) : 16,
          workqueue: conf.rpcworkqueue[0]
            ? parseInt(conf.rpcworkqueue[0])
            : 128,
        },
      },
      'zmq-enabled': !!conf.zmqpubrawblock.length,
      txindex: conf.txindex[0] === '1',
      wallet: {
        enable: conf.disablewallet[0] !== '1',
        avoidpartialspends: conf.avoidpartialspends[0] !== '0',
        discardfee: conf.discardfee[0] ? parseFloat(conf.discardfee[0]) : 0.01,
      },
      advanced: {
        blockfilters: {
          blockfilterindex: conf.blockfilterindex[0] === '1',
          peerblockfilters: conf.peerblockfilters[0] === '1',
        },
        bloomfilters: {
          peerbloomfilters: conf.peerbloomfilters[0] === '1',
        },
        dbcache: conf.dbcache[0] ? parseInt(conf.dbcache[0]) : null,
        mempool: {
          maxmempool: conf.maxmempool[0] ? parseInt(conf.maxmempool[0]) : 300,
          mempoolexpiry: conf.mempoolexpiry[0]
            ? parseInt(conf.mempoolexpiry[0])
            : 336,
          mempoolfullrbf: conf.mempoolfullrbf[0] === '1',
          persistmempool: conf.persistmempool[0] !== '0',
        },
        peers: {
          addnode: [
            ...conf.addnode.map((node) => {
              const split = node.split(':')
              return {
                hostname: split[0],
                port: parseInt(split[1]),
              }
            }),
            ...conf.connect.map((node) => {
              const split = node.split(':')
              return {
                hostname: split[0],
                port: parseInt(split[1]),
              }
            }),
          ],
          listen: conf.listen[0] !== '0',
          onlyconnect: !!conf.connect.length,
          onlyonion: conf.onlynet.includes('onion'),
        },
        pruning: conf.prune.length
          ? conf.prune[0] === '1'
            ? { unionSelectKey: 'manual' as const, unionValueKey: {} }
            : {
                unionSelectKey: 'automatic' as const,
                unionValueKey: {
                  size: parseInt(conf.prune[0]),
                },
              }
          : { unionSelectKey: 'disabled' as const, unionValueKey: {} },
      },
    }
  },
)
