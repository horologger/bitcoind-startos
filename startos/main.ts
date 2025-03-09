import { sdk } from './sdk'
import { bitcoinConfFile } from './file-models/bitcoin.conf'
import { bitcoinConfDefaults, GetBlockchainInfo } from './utils'
import * as diskusage from 'diskusage'
import { T, utils } from '@start9labs/start-sdk'
import { configToml } from './file-models/rpc-proxy.toml'
import { peerInterfaceId, rpcPort } from './interfaces'
import { promises } from 'fs'

const diskUsage = utils.once(() => diskusage.check('/'))
const archivalMin = 900_000_000_000
export const mainMounts = sdk.Mounts.of().addVolume(
  'main',
  null,
  '/data',
  false,
)

export const main = sdk.setupMain(async ({ effects, started }) => {
  /**
   * ======================== Setup (optional) ========================
   */

  const conf = (await bitcoinConfFile.read.const(effects))!

  const disk = await diskUsage()
  if (disk.total < archivalMin && conf.prune === 0) {
    conf.prune = 550
    conf.rpcbind = '127.0.0.1:18332'
    conf.rpcallowip = '127.0.0.1/32'
    await bitcoinConfFile.merge(conf)
  }

  const osIp = await sdk.getOsIp(effects)

  const bitcoinArgs: string[] = []

  bitcoinArgs.push(`-onion=${osIp}:9050`)
  bitcoinArgs.push('-datadir=/data/')
  bitcoinArgs.push('-conf=/data/bitcoin.conf')

  if (conf.externalip === 'initial-setup') {
    const peerInterface = await sdk.serviceInterface
      .getOwn(effects, peerInterfaceId)
      .once()
    const onionUrls = peerInterface?.addressInfo?.publicUrls.filter((x) =>
      x.includes('.onion'),
    )

    if (onionUrls) {
      bitcoinConfFile.merge({ externalip: onionUrls[0] })
    } else {
      bitcoinConfFile.merge({ externalip: bitcoinConfDefaults.externalip })
    }
  }

  const reindexBlockchain = await sdk.store
    .getOwn(effects, sdk.StorePath.reindexBlockchain)
    .once()

  if (reindexBlockchain) {
    bitcoinArgs.push('-reindex')
    await sdk.store.setOwn(effects, sdk.StorePath.reindexBlockchain, false)
  }

  sdk.store.getOwn(effects, sdk.StorePath.reindexBlockchain).const()

  const reindexChainstate = await sdk.store
    .getOwn(effects, sdk.StorePath.reindexChainstate)
    .once()

  if (reindexChainstate) {
    bitcoinArgs.push('-reindex')
    await sdk.store.setOwn(effects, sdk.StorePath.reindexChainstate, false)
  }

  sdk.store.getOwn(effects, sdk.StorePath.reindexChainstate).const()

  /**
   * ======================== Additional Health Checks (optional) ========================
   */

  const syncCheck = sdk.HealthCheck.of(effects, {
    id: 'sync-progress',
    name: 'Blockchain Sync Progress',
    fn: async () => {
      const res = await sdk.runCommand(
        effects,
        { imageId: 'bitcoind' },
        [
          'bitcoin-cli',
          '-conf=/data/bitcoin.conf',
          '-rpccookiefile=/data/.cookie',
          `-rpcport=${conf.prune ? 18332 : rpcPort}`,
          'getblockchaininfo',
        ],
        { mounts: mainMounts.build() },
        'getblockchaininfo',
      )

      if (res.stdout !== '' && typeof res.stdout === 'string') {
        const info: GetBlockchainInfo = JSON.parse(res.stdout)

        if (info.initialblockdownload) {
          const percentage = (info.verificationprogress * 100).toFixed(2)
          return {
            message: `Syncing blocks...${percentage}%`,
            result: 'loading',
          }
        }

        return {
          message: 'Bitcoin is fully synced',
          result: 'success',
        }
      }

      return {
        message: null,
        result:
          typeof res.stderr === 'string' && res.stderr !== ''
            ? 'starting'
            : 'failure',
      }
    },
  })

  const healthReceipts: T.HealthReceipt[] = [syncCheck]

  /**
   * ======================== Daemons ========================
   */

  const daemons = sdk.Daemons.of(effects, started, healthReceipts).addDaemon(
    'primary',
    {
      subcontainer: { imageId: 'bitcoind' },
      command: ['bitcoind', ...bitcoinArgs],
      mounts: mainMounts,
      ready: {
        display: 'RPC',
        fn: async () => {
          const res = await sdk.runCommand(
            effects,
            { imageId: 'bitcoind' },
            [
              'bitcoin-cli',
              '-conf=/data/bitcoin.conf',
              '-rpccookiefile=/data/.cookie',
              `-rpcport=${conf.prune ? 18332 : rpcPort}`,
              'getrpcinfo',
            ],
            { mounts: mainMounts.build() },
            'getrpcinfo',
          )
          if (res.stderr !== '') {
            return {
              message: 'The Bitcoin RPC Interface is not ready',
              result: 'starting',
            }
          } else {
            return {
              message: 'The Bitcoin RPC Interface is ready',
              result: 'success',
            }
          }
        },
      },
      requires: [],
    },
  )

  if (conf.prune) {
    /*
      @TODO setting listen=0 seems to break btc_rpc_proxy (temporarily?) with the below error. Strangely the health check for port 8332 remains green indicating proxy is listening. 

      2025-02-26T14:15:02-07:00  Error: /usr/bin/btc_rpc_proxy exited with code 1
      2025-02-26T14:15:02-07:00      at ChildProcess.<anonymous> (/usr/lib/startos/package/index.js:13380:43)
      2025-02-26T14:15:02-07:00      at ChildProcess.emit (node:events:518:28)
      2025-02-26T14:15:02-07:00      at ChildProcess._handle.onexit (node:internal/child_process:293:12)
      2025-02-26T14:15:02-07:00  Error: failed to create the listening socket: failed to bind 0.0.0.0:8332
    */
    await configToml.write({
      bitcoind_address: '127.0.0.1',
      bitcoind_port: 18332,
      bind_address: '0.0.0.0',
      bind_port: rpcPort,
      cookie_file: '/main/.cookie',
      tor_proxy: `${osIp}:9050`,
      tor_only: !!conf.onlynet,
    })

    await promises.chmod(configToml.path, 0o600)

    daemons.addDaemon('proxy', {
      subcontainer: { imageId: 'proxy' },
      command: ['/usr/bin/btc_rpc_proxy', '--conf', '/data/config.toml'],
      mounts: mainMounts,
      ready: {
        display: 'RPC Proxy',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, rpcPort, {
            successMessage: 'The Bitcoin RPC Proxy is ready',
            errorMessage: 'The Bitcoin RPC Proxy is not ready',
          }),
      },
      requires: [],
    })
  }
  return daemons
})
