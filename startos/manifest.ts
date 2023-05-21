import { setupManifest } from "@start9labs/start-sdk/lib/manifest/setupManifest";

/**
 * In this function you define static properties of the service
 */
export const manifest = setupManifest({
  id: "bitcoind",
  title: "Bitcoin Core",
  version: "24.0.1.1",
  releaseNotes: "Revamped for StartOS 0.4.0",
  license: "mit",
  replaces: Array<string>(),
  wrapperRepo: "https://github.com/Start9Labs/bitcoind-wrapper",
  upstreamRepo: "https://github.com/bitcoin/bitcoin",
  supportSite: "https://github.com/bitcoin/bitcoin/issues",
  marketingSite: "https://bitcoin.org/",
  donationUrl: "https://bitcoindevlist.com/",
  description: {
    short: "A Bitcoin Full Node by Bitcoin Core",
    long:
      'Bitcoin is an innovative payment network and a new kind of money. Bitcoin uses peer-to-peer technology to operate with no central authority or banks; managing transactions and the issuing of bitcoins is carried out collectively by the network. Bitcoin is open-source; its design is public, nobody owns or controls Bitcoin and everyone can take part. Through many of its unique properties, Bitcoin allows exciting uses that could not be covered by any previous payment system.',
  },
  assets: {
    license: "LICENSE",
    icon: "assets/icon.png",
    instructions: "assets/instructions.md",
  },
  volumes: {
    // This is the image where files from the project asset directory will go
    main: "data",
  },
  containers: {
    main: {
      // Identifier for the main image volume, which will be used when other actions need to mount to this volume.
      image: "main",
      // Specifies where to mount the data volume(s), if there are any. Mounts for pointer dependency volumes are also denoted here. These are necessary if data needs to be read from / written to these volumes.
      mounts: {
        // Specifies where on the service's file system its persistence directory should be mounted prior to service startup
        main: "/root/.bitcoin",
      },
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: "Uninstalling Bitcoin Core will result in permanent loss of data. Without a backup, any funds stored on your node's default hot wallet will be lost forever. If you are unsure, we recommend making a backup, just to be safe.",
    restore:
      "Restoring Bitcoin Core will overwrite its current data. You will lose any transactions recorded in watch-only wallets, and any funds you have received to the hot wallet, since the last backup.",
    start: null,
    stop: null,
  },
  dependencies: {},
});

export type Manifest = typeof manifest;
