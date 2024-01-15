# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.7] - 2024-01-15

### Changed

- Bump nodejs-mobile core library to v18.17.2
  - Update node engine to v18.17.1

## [1.0.0-beta.6] - 2023-09-30

### Added

- Add activity lifecycle callbacks to `bridge` module
  - Add `onPause()` method
  - Add `onResume()` method

### Fixed

- Kill Node.js process when closing Electron app

### Changed

- Provide types package for the `bridge` module as `.tgz`

## [1.0.0-beta.5] - 2023-09-15

### Fixed

- Fix `bridge` addListener callback only fired once

## [1.0.0-beta.4] - 2023-08-25

_If you are upgrading: please see [`UPGRADING.md`](UPGRADING.md)._

### Added

- Add a types package for the `bridge` module ([#6](https://github.com/hampoelz/Capacitor-NodeJS/issues/6))
- Allow manual startup of the Node.js runtime, pass environment variables and arguments ([#8](https://github.com/hampoelz/Capacitor-NodeJS/issues/8))
  - Add `startMode` configuration
  - Add `start()` method
- Add API to get a writeable data directory on each platform

### Changed

- **Breaking:** Change return type of `send()` method to `void`
- Rewrite the `bridge` module in TypeScript ([#14](https://github.com/hampoelz/Capacitor-NodeJS/issues/14))
- Start the Node.js runtime as child process on Electron ([#12](https://github.com/hampoelz/Capacitor-NodeJS/issues/12), [#15](https://github.com/hampoelz/Capacitor-NodeJS/issues/15))
- Change loading mechanism of the `bridge` module to a built-in module ([#12](https://github.com/hampoelz/Capacitor-NodeJS/issues/12))

## [1.0.0-beta.3] - 2023-08-19

_If you are upgrading: please see [`UPGRADING.md`](UPGRADING.md)._

### Changed

- Update to Capacitor v5 ([#11](https://github.com/hampoelz/Capacitor-NodeJS/issues/11), [#13](https://github.com/hampoelz/Capacitor-NodeJS/issues/13))
  - **Breaking:** Drop support for Capacitor v3 and v4
- Move native API behind a JavaScript wrapper
  - **Breaking:** Change plugin name in Capacitor configuration from `NodeJS` to `CapacitorNodeJS`

## [1.0.0-beta.2] - 2023-01-30

### Changed

- Bump nodejs-mobile core library to v16.17.0
  - Update node engine to v16.17.1
  - Disable Android 32-bit x86 support for now

## [1.0.0-beta.1] - 2023-01-29

_If you are upgrading: please see [`UPGRADING.md`](UPGRADING.md)._

### Added

- Add `whenReady()` method ([#4](https://github.com/hampoelz/Capacitor-NodeJS/issues/4))

### Changed

- **Breaking:** Change loading mechanism of bridge module _(manually adding the dependency to the NodeJS project is now required!)_
- **Breaking:** Change default NodeJS project folder from the app's source directory to the subfolder `nodejs`

### Fixed

- Fix bridge library not found when building Android app
- Fix bridge module not found after packaging Electron app
- Fix loading native implementations instead of the web implementation

## [0.0.1]

_First release._
