import { sdk } from './sdk'
import { exposedStore } from './store'
import { setDependencies } from './dependencies/dependencies'
import { setInterfaces } from './interfaces'
import { migrations } from './migrations'

const install = sdk.setupInstall(async ({ effects }) => {})

const uninstall = sdk.setupUninstall(async ({ effects }) => {})

/**
 * Plumbing. DO NOT EDIT.
 */
export const { init, uninit } = sdk.setupInit(
  migrations,
  install,
  uninstall,
  setInterfaces,
  setDependencies,
  exposedStore,
)
