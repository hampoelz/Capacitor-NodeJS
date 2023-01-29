# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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