import { sdk } from '../../sdk'
import { setInterfaces } from '../interfaces'
import { writeConf } from './conf'
import { configSpec } from './spec'

/**
 * This function executes on config save
 *
 * Use it to persist config data to various files and to establish any resulting dependencies
 */
export const save = sdk.setupConfigSave(
  configSpec,
  async ({ effects, utils, input, dependencies }) => {
    const password = 'TODO'
    await writeConf({
      rpcbind: input.rpc.enable ? ['0.0.0.0:8332'] : [],
      rpcallowip: input.rpc.enable ? ['0.0.0.0/0'] : [],
      rpcuser: [input.rpc.username],
      rpcpassword: [password],
      rpcauth: input.rpc.advanced.auth,
      rpcserialversion: [
        input.rpc.advanced.serialversion === 'segwit' ? '1' : '0',
      ],
      rpcservertimeout: [`${input.rpc.advanced.servertimeout}`],
      rpcthreads: [`${input.rpc.advanced.threads}`],
      rpcworkqueue: [`${input.rpc.advanced.workqueue}`],
      mempoolfullrbf: [input.advanced.mempool.mempoolfullrbf ? '1' : '0'],
      persistmempool: [input.advanced.mempool.persistmempool ? '1' : '0'],
      maxmempool: [`${input.advanced.mempool.maxmempool}`],
      mempoolexpiry: [`${input.advanced.mempool.mempoolexpiry}`],
      listen: [input.advanced.peers.listen ? '1' : '0'],
      bind: input.advanced.peers.listen ? ['0.0.0.0:8333'] : [],
      connect: input.advanced.peers.onlyconnect
        ? input.advanced.peers.addnode.map(
            (node) => `${node.hostname}:${node.port}`,
          )
        : [],
      addnode: input.advanced.peers.onlyconnect
        ? []
        : input.advanced.peers.addnode.map(
            (node) => `${node.hostname}:${node.port}`,
          ),
      onlynet: input.advanced.peers.onlyonion ? ['onion'] : [],
      whitelist: ['172.18.0.0/16'],
      prune:
        input.advanced.pruning.unionSelectKey === 'manual'
          ? ['1']
          : input.advanced.pruning.unionSelectKey === 'automatic'
          ? [`${input.advanced.pruning.unionValueKey.size}`]
          : [],
      dbcache: input.advanced.dbcache ? [`${input.advanced.dbcache}`] : [],
      disablewallet: [input.wallet.enable ? '0' : '1'],
      avoidpartialspends: [input.wallet.avoidpartialspends ? '1' : '0'],
      discardfee: [`${input.wallet.discardfee}`],
      zmqpubrawblock: input['zmq-enabled'] ? ['tcp://0.0.0.0:28332'] : [],
      zmqpubhashblock: input['zmq-enabled'] ? ['tcp://0.0.0.0:28332'] : [],
      zmqpubrawtx: input['zmq-enabled'] ? ['tcp://0.0.0.0:28332'] : [],
      zmqpubhashtx: input['zmq-enabled'] ? ['tcp://0.0.0.0:28332'] : [],
      zmqpubsequence: input['zmq-enabled'] ? ['tcp://0.0.0.0:28332'] : [],
      txindex: [input.txindex ? '1' : '0'],
      peerbloomfilters: [
        input.advanced.bloomfilters.peerbloomfilters ? '1' : '0',
      ],
      blockfilterindex: input.advanced.blockfilters.blockfilterindex
        ? ['basic']
        : [],
      peerblockfilters: [
        input.advanced.blockfilters.peerblockfilters ? '1' : '0',
      ],
    })

    const dependenciesReceipt = await effects.setDependencies([])
    const interfacesReceipt = await setInterfaces({ effects, utils, input })

    return {
      dependenciesReceipt,
      interfacesReceipt,
      restart: true,
    }
  },
)
