import { sdk } from '../../sdk'
import { reindex } from './reindex'

/**
 * Add each new Action as the next argument to this function
 */
export const { actions, actionsMetadata } = sdk.setupActions(reindex)
