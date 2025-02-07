import { bitcoinConfFile, shape } from '../../file-models/bitcoin.conf'
import { sdk } from '../../sdk'
import { bitcoinConfDefaults } from '../../utils'

const {
  persistmempool,
  maxmempool,
  mempoolexpiry,
  mempoolfullrbf,
  permitbaremultisig,
  datacarrier,
  datacarriersize,
} = bitcoinConfDefaults

const { Value } = sdk

const mempoolSpec = sdk.InputSpec.of({
  persistmempool: Value.toggle({
    name: 'Persist Mempool',
    default: !!persistmempool,
    description: 'Save the mempool on shutdown and load on restart.',
  }),
  maxmempool: Value.number({
    name: 'Max Mempool Size',
    description: 'Keep the transaction memory pool below <n> megabytes.',
    required: false,
    default: maxmempool,
    min: 1,
    integer: true,
    units: 'MiB',
    placeholder: maxmempool.toString(),
  }),
  mempoolexpiry: Value.number({
    name: 'Mempool Expiration',
    description:
      'Do not keep transactions in the mempool longer than <n> hours.',
    required: false,
    default: mempoolexpiry,
    min: 1,
    integer: true,
    units: 'Hr',
    placeholder: mempoolexpiry.toString(),
  }),
  mempoolfullrbf: Value.toggle({
    name: 'Enable Full RBF',
    default: !!mempoolfullrbf,
    description:
      'Policy for your node to use for relaying and mining unconfirmed transactions.  For details, see https://github.com/bitcoin/bitcoin/blob/master/doc/release-notes/release-notes-24.0.1.md#notice-of-new-option-for-transaction-replacement-policies',
  }),
  permitbaremultisig: Value.toggle({
    name: 'Permit Bare Multisig',
    default: !!permitbaremultisig,
    description: 'Relay non-P2SH multisig transactions',
  }),
  datacarrier: Value.toggle({
    name: 'Relay OP_RETURN Transactions',
    default: !!datacarrier,
    description: 'Relay transactions with OP_RETURN outputs',
  }),
  datacarriersize: Value.number({
    name: 'Max OP_RETURN Size',
    description: 'Maximum size of data in OP_RETURN outputs to relay',
    required: false,
    default: datacarriersize,
    min: 0,
    max: 10_000,
    integer: true,
    units: 'bytes',
    placeholder: datacarriersize.toString(),
  }),
})

export const mempoolConfig = sdk.Action.withInput(
  // id
  'mempool-config',

  // metadata
  async ({ effects }) => ({
    name: 'Mempool Settings',
    description: 'Edit the Mempool settings in bitcoin.conf',
    warning: null,
    allowedStatuses: 'any',
    group: 'conf',
    visibility: 'enabled',
  }),

  // form input specification
  mempoolSpec,

  // optionally pre-fill the input form
  ({ effects }) => read(effects),

  // the execution function
  ({ effects, input }) => write(input),
)

async function read(effects: any): Promise<PartialMempoolSpec> {
  const bitcoinConf = await bitcoinConfFile.read.const(effects)
  if (!bitcoinConf) return {}

  const mempoolSettings: PartialMempoolSpec = {
    maxmempool: bitcoinConf.maxmempool,
    mempoolexpiry: bitcoinConf.mempoolexpiry,
    datacarriersize: bitcoinConf.datacarriersize,
  }
  bitcoinConf.mempoolfullrbf === undefined
    ? (mempoolSettings.mempoolfullrbf = !!mempoolfullrbf)
    : (mempoolSettings.mempoolfullrbf = !!bitcoinConf.mempoolfullrbf)
  bitcoinConf.persistmempool === undefined
    ? (mempoolSettings.persistmempool = !!persistmempool)
    : (mempoolSettings.persistmempool = !!bitcoinConf.persistmempool)
  bitcoinConf.datacarrier === undefined
    ? (mempoolSettings.datacarrier = !!datacarrier)
    : (mempoolSettings.datacarrier = !!bitcoinConf.datacarrier)
  bitcoinConf.permitbaremultisig === undefined
    ? (mempoolSettings.permitbaremultisig = !!permitbaremultisig)
    : (mempoolSettings.permitbaremultisig = !!bitcoinConf.permitbaremultisig)

  return mempoolSettings
}

async function write(input: MempoolSpec) {
  const mempoolSettings: typeof shape._TYPE = {
    mempoolfullrbf: input.mempoolfullrbf ? 1 : 0,
    persistmempool: input.persistmempool ? 1 : 0,
    datacarrier: input.datacarrier ? 1 : 0,
    permitbaremultisig: input.permitbaremultisig ? 1 : 0,
  }
  mempoolSettings.maxmempool = input.maxmempool ? input.maxmempool : maxmempool
  mempoolSettings.mempoolexpiry = input.mempoolexpiry
    ? input.mempoolexpiry
    : mempoolexpiry
  mempoolSettings.datacarriersize = input.mempoolexpiry
    ? input.mempoolexpiry
    : datacarriersize
  // if (maxmempool) mempoolSettings.maxmempool = maxmempool
  // if (mempoolexpiry) mempoolSettings.mempoolexpiry = mempoolexpiry
  // if (datacarriersize) mempoolSettings.datacarriersize = datacarriersize

  await bitcoinConfFile.merge(mempoolSettings)
}

type MempoolSpec = typeof mempoolSpec._TYPE
type PartialMempoolSpec = typeof mempoolSpec._PARTIAL
