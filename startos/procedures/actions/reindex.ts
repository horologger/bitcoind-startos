import { Config } from '@start9labs/start-sdk/lib/config/builder/config'
import { sdk } from '../../sdk'

/**
 * This is an example Action
 *
 * By convention, each action receives its own file
 *
 * Actions optionally take an arbitrary config form as input
 */
const input = Config.of({})

/**
 * This function defines the Action, including the FormSpec (if any)
 *
 * The first argument is the Action metadata. The second argument is the Action function
 *
 * If no input is required, FormSpec would be null
 */
export const reindex = sdk.createAction(
  {
    name: 'Reindex Blockchain',
    description:
      'Rebuilds the block and chainstate databases starting from genesis. If blocks already exist on disk, these are used rather than being redownloaded. For pruned nodes, this means downloading the entire blockchain over again.',
    id: 'reindex',
    input,
    allowedStatuses: 'any',
  },
  async ({ effects, utils, input }) => {
    await utils.store.setOwn('/reindex', true)

    return {
      message: (await effects.stopped())
        ? 'Bitcoin Core will reindex the next time the service is started.'
        : 'Bitcoin Core is restarting in reindex mode.',
      value: null,
    }
  },
)
