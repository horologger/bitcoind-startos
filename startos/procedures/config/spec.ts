import { Variants } from '@start9labs/start-sdk/lib/config/builder/variants'
import { sdk } from '../../sdk'
const { Config, Value, List } = sdk

/**
 * Here you define the config specification that will ultimately present to the user as validated form inputs
 *
 * Most form controls are available, including text, textarea, number, toggle, select, multiselect, list, color, datetime, object (a subform), and union (a conditional subform)
 */
export const configSpec = Config.of({
  rpc: Value.object(
    {
      name: 'RPC Settings',
      description: 'RPC configuration options.',
    },
    Config.of({
      enable: Value.toggle({
        name: 'Enable',
        description: 'Allow remote RPC requests.',
        default: true,
      }),
      username: Value.text({
        name: 'Username',
        description: 'The username for connecting to Bitcoin over RPC.',
        required: { default: 'bitcoin' },
        masked: true,
        patterns: [
          {
            regex: '^[a-zA-Z0-9_]+$',
            description: 'Must be alphanumeric (can contain underscore).',
          },
        ],
      }),
      advanced: Value.object(
        {
          name: 'Advanced',
          description: 'Advanced RPC Settings',
        },
        Config.of({
          auth: Value.list(
            List.text(
              {
                name: 'Authorization',
                description:
                  'Username and hashed password for JSON-RPC connections. RPC clients connect using the usual http basic authentication.',
                default: [],
              },
              {
                patterns: [
                  {
                    regex:
                      '^[a-zA-Z0-9_-]+:([0-9a-fA-F]{2})+\\$([0-9a-fA-F]{2})+$',
                    description:
                      'Each item must be of the form "<USERNAME>:<SALT>$<HASH>".',
                  },
                ],
              },
            ),
          ),
          serialversion: Value.select({
            name: 'Serialization Version',
            description:
              'Return raw transaction or block hex with Segwit or non-SegWit serialization.',
            values: { 'non-segwit': 'non-segwit', segwit: 'segwit' },
            required: { default: 'segwit' },
          }),
          servertimeout: Value.number({
            name: 'Rpc Server Timeout',
            description:
              'Number of seconds after which an uncompleted RPC call will time out.',
            min: 5,
            max: 300,
            integer: true,
            units: 'seconds',
            required: { default: 30 },
          }),
          threads: Value.number({
            name: 'Threads',
            description:
              'Set the number of threads for handling RPC calls. You may wish to increase this if you are making lots of calls via an integration.',
            required: { default: 16 },
            min: 1,
            max: 64,
            integer: true,
            units: 'threads',
          }),
          workqueue: Value.number({
            name: 'Work Queue',
            description:
              'Set the depth of the work queue to service RPC calls. Determines how long the backlog of RPC requests can get before it just rejects new ones.',
            required: { default: 128 },
            min: 8,
            max: 256,
            integer: true,
            units: 'requests',
          }),
        }),
      ),
    }),
  ),
  'zmq-enabled': Value.toggle({
    name: 'ZeroMQ Enabled',
    description: 'Enable the ZeroMQ interface',
    default: true,
  }),
  txindex: Value.toggle({
    name: 'Transaction Index',
    description: 'Enable the Transaction Index (txindex)',
    default: true,
  }),
  wallet: Value.object(
    {
      name: 'Wallet',
      description: 'Wallet Settings',
    },
    Config.of({
      enable: Value.toggle({
        name: 'Enable Wallet',
        description: 'Load the wallet and enable wallet RPC calls.',
        default: true,
      }),
      avoidpartialspends: Value.toggle({
        name: 'Avoid Partial Spends',
        description:
          'Group outputs by address, selecting all or none, instead of selecting on a per-output basis. This improves privacy at the expense of higher transaction fees.',
        default: true,
      }),
      discardfee: Value.number({
        name: 'Discard Change Tolerance',
        description:
          'The fee rate (in BTC/kB) that indicates your tolerance for discarding change by adding it to the fee.',
        required: { default: 0.0001 },
        min: 0,
        max: 0.01,
        integer: false,
        units: 'BTC/kB',
      }),
    }),
  ),
  advanced: Value.object(
    {
      name: 'Advanced',
      description: 'Advanced Settings',
    },
    Config.of({
      mempool: Value.object(
        {
          name: 'Mempool',
          description: 'Mempool Settings',
        },
        Config.of({
          mempoolfullrbf: Value.toggle({
            name: 'Enable Full RBF',
            description:
              'Policy for your node to use for relaying and mining unconfirmed transactions.  For details, see https://github.com/bitcoin/bitcoin/blob/master/doc/release-notes/release-notes-24.0.md#notice-of-new-option-for-transaction-replacement-policies',
            default: false,
          }),
          persistmempool: Value.toggle({
            name: 'Persist Mempool',
            description: 'Save the mempool on shutdown and load on restart.',
            default: true,
          }),
          maxmempool: Value.number({
            name: 'Max Mempool Size',
            description:
              'Keep the transaction memory pool below <n> megabytes.',
            min: 1,
            integer: true,
            units: 'MiB',
            required: { default: 300 },
          }),
          mempoolexpiry: Value.number({
            name: 'Mempool Expiration',
            description:
              'Do not keep transactions in the mempool longer than <n> hours.',
            min: 1,
            integer: true,
            units: 'Hr',
            required: { default: 336 },
          }),
        }),
      ),
      peers: Value.object(
        {
          name: 'Peers',
          description: 'Peer Connection Settings',
        },
        Config.of({
          listen: Value.toggle({
            name: 'Make Public',
            description:
              'Allow other nodes to find your server on the network.',
            default: true,
          }),
          onlyconnect: Value.toggle({
            name: 'Disable Peer Discovery',
            description: 'Only connect to specified peers.',
            default: false,
          }),
          onlyonion: Value.toggle({
            name: 'Disable Clearnet',
            description: 'Only connect to peers over Tor.',
            default: false,
          }),
          addnode: Value.list(
            List.obj(
              {
                name: 'Add Nodes',
                description: 'Add addresses of nodes to connect to.',
                default: [],
              },
              {
                spec: Config.of({
                  hostname: Value.text({
                    name: 'Hostname',
                    description: 'Domain or IP address of bitcoin peer',
                    patterns: [
                      {
                        regex:
                          '(^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$)|((^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$)|(^[a-z2-7]{16}\\.onion$)|(^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$))',
                        description:
                          "Must be either a domain name, or an IPv4 or IPv6 address. Do not include protocol scheme (eg 'http://') or port.",
                      },
                    ],
                    required: { default: null },
                  }),
                  port: Value.number({
                    name: 'Port',
                    description:
                      'Port that peer is listening on for inbound p2p connections',
                    min: 0,
                    max: 65535,
                    integer: true,
                    required: false,
                  }),
                }),
              },
            ),
          ),
        }),
      ),
      dbcache: Value.number({
        name: 'Database Cache',
        description:
          "How much RAM to allocate for caching the TXO set. Higher values improve syncing performance, but increase your chance of using up all your system's memory or corrupting your database in the event of an ungraceful shutdown. Set this high but comfortably below your system's total RAM during IBD, then turn down to 450 (or leave blank) once the sync completes.",
        warning:
          'WARNING: Increasing this value results in a higher chance of ungraceful shutdowns, which can leave your node unusable if it happens during the initial block download. Use this setting with caution. Be sure to set this back to the default (450 or leave blank) once your node is synced. DO NOT press the STOP button if your dbcache is large. Instead, set this number back to the default, hit save, and wait for bitcoind to restart on its own.',
        min: 0,
        integer: true,
        units: 'MiB',
        required: false,
      }),
      pruning: Value.filteredUnion(
        ({}) => {
          throw 'todo'
        },
        {
          name: 'Pruning Settings',
          description:
            'Blockchain Pruning Options\nReduce the blockchain size on disk\n',
          warning:
            'If you set pruning to Manual and your disk is smaller than the total size of the blockchain, you MUST have something running that prunes these blocks or you may overfill your disk!\nDisabling pruning will convert your node into a full archival node. This requires a resync of the entire blockchain, a process that may take several days. Make sure you have enough free disk space or you may fill up your disk.\n',
          required: { default: 'disabled' },
        },
        Variants.of({
          disabled: {
            name: 'Disabled',
            spec: Config.of({}),
          },
          automatic: {
            name: 'Automatic',
            spec: Config.of({
              size: Value.number({
                name: 'Max Chain Size',
                description: 'Limit of blockchain size on disk.',
                warning:
                  'Increasing this value will require re-syncing your node.',
                required: { default: 550 },
                min: 550,
                max: 1000000,
                integer: true,
                units: 'MiB',
              }),
            }),
          },
          manual: {
            name: 'Manual',
            spec: Config.of({}),
          },
        }),
      ),
      blockfilters: Value.object(
        {
          name: 'Block Filters',
          description: 'Settings for storing and serving compact block filters',
        },
        Config.of({
          blockfilterindex: Value.toggle({
            name: 'Compute Compact Block Filters (BIP158)',
            description:
              "Generate Compact Block Filters during initial sync (IBD) to enable 'getblockfilter' RPC. This is useful if dependent services need block filters to efficiently scan for addresses/transactions etc.",
            default: true,
          }),
          peerblockfilters: Value.toggle({
            name: 'Serve Compact Block Filters to Peers (BIP157)',
            description:
              "Serve Compact Block Filters as a peer service to other nodes on the network. This is useful if you wish to connect an SPV client to your node to make it efficient to scan transactions without having to download all block data.  'Compute Compact Block Filters (BIP158)' is required.",
            default: false,
          }),
        }),
      ),
      bloomfilters: Value.object(
        {
          name: 'Bloom Filters (BIP37)',
          description: 'Setting for serving Bloom Filters',
        },
        Config.of({
          peerbloomfilters: Value.toggle({
            name: 'Serve Bloom Filters to Peers',
            description:
              'Peers have the option of setting filters on each connection they make after the version handshake has completed. Bloom filters are for clients implementing SPV (Simplified Payment Verification) that want to check that block headers  connect together correctly, without needing to verify the full blockchain.  The client must trust that the transactions in the chain are in fact valid.  It is highly recommended AGAINST using for anything except Bisq integration.',
            warning:
              'This is ONLY for use with Bisq integration, please use Block Filters for all other applications.',
            default: false,
          }),
        }),
      ),
    }),
  ),
})

// This line is necessary to satisfy Typescript typings. Do not touch it
export type ConfigSpec = typeof configSpec.validator._TYPE
