# 📱 Capacitor NodeJS-Integration

:arrow_right: A full-fledged [Node.js](https://nodejs.org/) runtime for [Capacitor](https://capacitorjs.com) apps.

> [!NOTE]  
> This project uses the [Node.js for Mobile Apps](https://github.com/nodejs-mobile/nodejs-mobile) toolkit to add Node.js support in Android and iOS

> [!WARNING]  
> **WIP - Work in Progress**

**Table of contents**

* [Install](#install)
  + [Supported Platforms](#supported-platforms)
* [Examples](#examples)
* [Getting Started](#getting-started)
  + [Basics](#basics)
  + [Minimal example](#minimal-example)
  + [Inter-Process Communication](#inter-process-communication)
* [Complex Projects](#complex-projects)
  + [Custom starting point](#custom-starting-point)
  + [Install Node.js Modules](#install-nodejs-modules)
  + [Improve Node.js loading times](#improve-nodejs-loading-times)
  + [Manual Node.js runtime start](#manual-nodejs-runtime-start)
  + [Data storage](#data-storage)
* [Mobile Node.js APIs differences](#mobile-nodejs-apis-differences)
* [Configuration](#configuration)
* [API - Bridge module](#api---bridge-module)
* [API - Capacitor layer](#api---capacitor-layer)

## Install

**Capacitor v5 or newer is required. This project isn't compatible with lower versions of Capacitor.**

```bash
npm install https://github.com/hampoelz/capacitor-nodejs/releases/download/v1.0.0-beta.5/capacitor-nodejs.tgz
npx cap sync
```

> [!NOTE]  
> For now Android 32-bit x86 support is disabled since Capacitor-NodeJS v1.0.0-beta.2 _(based on node.js v16)_ as there is currently no support for it in the latest version of the nodejs-mobile core library.

### Supported Platforms

- [x] Android
- [ ] IOS _(coming soon)_
- [x] Using the [`capacitor-community/electron` plugin](https://github.com/capacitor-community/electron):
  - [x] Windows
  - [x] Linux
  - [x] macOS
- [ ] _Web (maybe in future with WebAssembly?)_

## Examples

Example projects can be found in the [hampoelz/Capacitor-NodeJS_Examples](https://github.com/hampoelz/Capacitor-NodeJS_Examples) repository.
Each example project is provided in a separate branch.

## Getting Started

This guide shows how to add a minimal Node.js project to a Capacitor application and communicate between these processes.

### Basics

In the example below the Vite build system is used. However, any build system can be used as long as the following criteria are met:

1. The Node.js project (to be executed by the engine) must be located in a subdirectory named `nodejs` _(or the path set via `nodeDir`)_ of the Capacitor `webDir`.
2. The Node.js project must have a starting point, this can either be a script named `index.js` or a package.json with a `main` field.

> For example if the Node.js project needs to be compiled or bundled then this output should be located in the subdirectory of the Capacitor `webDir`.

### Minimal example

In this example the directory for the app's source files is named `src`, the directory for static assets is named `static`,
the directory for the compiled files is named `dist`, and the directory for the Node.js project is named `nodejs`.

So the configurations should contain at least the following values:

**Vite Configurations:**

```typescript
// in vite.config.js or vite.config.ts
{
  root: './src',
  publicDir: '../static',
  build: {
    outDir: '../dist'
  }
}
```

**Capacitor Configurations:**

```typescript
// in capacitor.config.json or capacitor.config.ts
{
  "webDir": 'dist',
  "plugins": {
    "CapacitorNodeJS": {
      "nodeDir": "nodejs"
    }
  }
}
```

</br>

To meet the criteria from above using Vite, just create a new directory called `nodejs` inside the `static` directory.
And create a new file called `index.js` in it as the starting point.

> Vite will copy assets from the `static` directory to the root of the `dist` directory as-is.
> So the created `nodejs` project directory will be placed in the Capacitor `webdir` after build.

</br>

The project structure should now look something like this:

```diff
  capacitor-app/
  ├── ...
  ├── dist/                   # Capacitor webdir
  ├── src/                    # app source directory
+ ├── static/                 # static assets
+ │   ├── nodejs/             # Node.js project directory
+ │   │   ├── index.js        # Node.js main script
  ├── capacitor.config.json
  ├── vite.config.ts
  ├── ...
```

</br>

After building and syncing the project, the main script will be executed by the Node.js runtime when the app is launched.

A guide for a more complex Node.js project can be found in the [Complex Projects](#complex-projects) section.

### Inter-Process Communication

A bridge module to communicate between the Capacitor layer and the Node.js process is built-in.

Use the following code in a Node.js script to wait for messages from the Capacitor layer and send messages back:

```javascript
const { channel } = require('bridge');

// Listens to "msg-from-capacitor" from the Capacitor layer.
channel.addListener('msg-from-capacitor', message => {
    console.log('[Node.js] Message from Capacitor: ' + message);
    
    // Sends a message back to the Capacitor layer.
    channel.send("msg-from-nodejs",
      `Replying to the message '${message}'.`,
      "And optionally add more arguments."
    );
});
```

</br>

Now it is possible to communicate with the Node.js process in the Capacitor app:

```typescript
import { NodeJS } from 'capacitor-nodejs';

// Listens to "msg-from-nodejs" from the Node.js process.
NodeJS.addListener('msg-from-nodejs', event => {
  document.body.innerHTML = `
    <p>
      <b>Message from Capacitor</b><br>
      First argument: ${event.args[0]}<br>
      Second argument: ${event.args[1]}
    </p>
  `;
  console.log(event);
});

// Waits for the Node.js process to initialize.
NodeJS.whenReady().then(() => {

  // Sends a message to the Node.js process.
  NodeJS.send({
      eventName: "msg-from-capacitor",
      args: [ "Hello from Capacitor!" ]
  });

});
```

A full API documentation can be found in the [API - Bridge module](#api---bridge-module) section.

---

## Complex Projects

**The examples in this guide are a continuation of the examples in the [Getting Started](#getting-started) guide.**

### Custom starting point

In the [Getting Started](#getting-started) guide, the default starting point `index.js` was used for the Node.js project.
However, the main script can be renamed or moved to subdirectories for a better organized project.

To change this starting point, add a file called `package.json` to the Node.js project, which describes the project more in detail.
Using the `main` field in this file, a custom starting point for the Node.js project can be specified.
This should be a module relative to the root of the Node.js project directory.

The package.json file could look like the following, if the `main` field is set to `server.js`:

```javascript
// static/nodejs/package.json
{
    "name": "capacitor-nodejs-project",
    "version": "1.0.0",
    "main": "./server.js"
}
```

The project structure should then change to something like this:

```diff
  capacitor-app/
  ├── ...
  ├── dist/
  ├── src/
  ├── static/
  │   ├── nodejs/             # Node.js project directory
- │   │   ├── index.js        # main script (old)
+ │   │   ├── server.js       # main script (new)
+ │   │   ├── package.json    # starting point
  ├── capacitor.config.json
  ├── vite.config.ts
  ├── ...
```

### Install Node.js Modules

To install Node.js modules, the project requires a `package.json` file.
See section [Custom starting point](#custom-starting-point) for more details.

The modules have to be installed in the Node.js project directory in which the `package.json` file was created using the npm CLI.
After installing modules, rebuild and sync the Capacitor project to update the application with the Node.js project.

For convenience, a postinstall script can be added to the main `package.json` in the root of the Capacitor project to automatically install the modules of the Node.js project:

```javascript
// package.json
{
  "scripts": {
    "postinstall": "cd static/nodejs/ && npm install"
  },
  // other config options
}
```

> You may also want to add a gitignore file to ignore unnecessary files.
> To do this, create a new file called `.gitignore` in the Node.js project directory and copy the contents of [github/gitignore/Node.gitignore](https://github.com/github/gitignore/blob/main/Node.gitignore) into it.

> [!IMPORTANT]  
> If the [`capacitor-community/electron`](https://github.com/capacitor-community/electron) plugin is used, packaging with the electron-builder may cause problems since it does not include the modules installed in the Node.js project by default.
>
> To fix this issue, add the configuration `"includeSubNodeModules": true` to the `electron-builder.config.json`.

### Improve Node.js loading times

The Node.js project can quickly grow very large when installing modules.
For projects that contain a large number of files, the load time can be reduced by decreasing the number of files and the file sizes.

For this reason, it is recommended to use bunder tools such as [Rollup.js](https://rollupjs.org/).
In the following example, Rollup is used to bundle the Node.js project with all its modules to a single file.

To get started install Rollup and its plugins "commonjs", "node-resolve" and "json" into the root of the Capacitor project.
If Vite is used as build system, Rollup is already pre-installed and does not need to be installed:

```bash
# Install Rollup (If Vite is used, this command is not needed)
npm i --save-dev rollup

# Install Rollup Plugins
npm i --save-dev @rollup/plugin-commonjs @rollup/plugin-json @rollup/plugin-node-resolve
```

Since the Node.js project is now to be bundled, the project structure needs some changes.
The Node.js project should no longer be copied directly from Vite to the Capacitor webDir directory, instead it will be bundled with Rollup.

This means that the Node.js project directory needs to be moved from the static assets to somewhere else.
For example to the root directory of the Capcitors project:

```diff
  capacitor-app/
  ├── ...
  ├── dist/
  ├── src/
  ├── static/
- │   ├── nodejs/
- │   │   ├── node_modules/
- │   │   ├── server.js
- │   │   ├── package.json
- │   │   ├── ...
+ ├── nodejs/
+ │   ├── node_modules/
+ │   ├── server.js
+ │   ├── package.json
+ │   ├── ...
  ├── capacitor.config.json
  ├── vite.config.ts
  ├── ...
```

> Don't forget to update the new path to the project in the postinstall script,
> if one is used, as described in the [Installing Node.js modules](#install-nodejs-modules) section. 

After the restructuring of the project, Rollup can be configured.
Create a new file called `rollup.config.mjs` with the following content:

```typescript
// rollup.config.mjs
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'nodejs/server.js',
  output: {
    file: 'dist/nodejs/index.js',
    format: 'cjs',
  },
  external: ['bridge'],
  plugins: [
    commonjs(),
    json(),
    nodeResolve({
      preferBuiltins: true,
    }),
  ],
};
```

To add bundling of the Node.js project to the build steps, modify the main `package.json` in the root of the Capacitor project 
and add `&& rollup -c rollup.config.mjs` to the `build` entry in the `scripts` object:

```diff
# package.json
{
  "scripts": {
-  	"build": "vite build"
+  	"build": "vite build && rollup -c rollup.config.mjs"
  }
}
```

So the project structure should look something like this:

```diff
  capacitor-app/
  ├── ...
  ├── dist/
  ├── src/
  ├── nodejs/
  │   ├── node_modules/
  │   ├── server.js
  │   ├── package.json
  │   ├── ...
  ├── capacitor.config.json
+ ├── rollup.config.mjs
  ├── vite.config.ts
  ├── ...
```

<!-- TODO: Add @rollup/plugin-terser to further reduce the size of the bundle -->

After building and syncing the project, the Node.js runtime should start faster now.

### Manual Node.js runtime start

By default, the Node.js runtime starts automatically with application start.
However, this behavior may not be suitable for all projects. 

This behavior can be disabled globally via the `startMode` plugin configuration:

```diff
# in capacitor.config.json or capacitor.config.ts
{
  "webDir": 'dist',
  "plugins": {
    "CapacitorNodeJS": {
      "nodeDir": "nodejs",
+     "startMode": "manual",
    },
  },
}
```

Now the Node.js runtime has to be started manually with the `NodeJS.start()` command:

```typescript
import { NodeJS } from 'capacitor-nodejs';

// Starts the Node.js engine.
NodeJS.start();

// Waits for the Node.js process to initialize.
NodeJS.whenReady().then(() => {
  // Communicate with the Node.js process.
});
```

Manually starting the Node.js runtime provides options to override the `nodeDir` configuration or even the path for the main script.

In addition, arguments can be passed to the main script and environment variables for the Node.js runtime can be set:

```typescript
import { NodeJS } from 'capacitor-nodejs';

// Options for starting the Node.js engine manually.
const options = {
  args: [ "--option", "value" ],
  env: {
    "DB_HOST": "localhost",
    "DB_USER": "myuser",
    "DB_PASS": "mypassword"
  }
}

// Starts the Node.js engine with properties as set by the `options`.
NodeJS.start(options);
```

> [!Note]  
>
> Due to limitations in the Node.js for Mobile Apps toolkit, restarting the runtime after it has finished is not supported.

### Data storage

Mobile platforms are different than the usual desktop platforms in that they require applications to write in specific sandboxed paths and don't have permissions to write elsewhere.

The built-in bridge module provides an API to get a per-user application data directory on each platform:

```javascript
const { getDataPath } = require('bridge');

// Get a path where data can be read and written.
const dataPath = getDataPath();
```

> [!WARNING]  
> 
> Do not use the Node.js project directory itself for data storage, it will be overwritten after each application update!

To get a path for temporary files, the node.js inbuilt method `os.tmpdir()` can be used:

```javascript
const os = require('os');

// Get a path for temporary files.
const tmpPath = os.tmpdir();
```

> [!WARNING]  
> 
> On Android, the files in the cache are kept until the system needs space, so it increases the application's disk space unless the developer manually deletes them.

---

## Mobile Node.js APIs differences

> [!NOTE]
>
> This section is based on the documentation of the Node.js for Mobile Apps toolkits.

Not every API is supported on mobile devices. Mobile operating systems do not allow applications to call certain APIs that are expected to be available on other operating systems.

### child_process module

Mobile applications are expected to be a single process.
APIs that create new processes, such as `child_process.spawn()` or `child_process.fork()` will therefore run into permission issues.

### file system (fs) module

On mobile platforms, the current working directory is the root directory of the file system.
This can lead to unexpected behavior in code that assumes that the current working directory is set to the directory of the Node.js project.

On Android creating hard links (`fs.link()` and `fs.linkSync()`) is not supported.

### internationalization (intl) module

The internationalization (`intl`) module is not available on current nodejs-mobile builds.

### os module

- `os.cpus()` may return inconsistent/unreliable results, since different OS versions will have different permissions for accessing CPU information.
- `os.homedir()` on mobile platforms there is no concept of user home directories.
- `os.platform()` can also return 'android' or 'ios', depending on the platform.

On Android, the files in the cache (`os.tmpdir()`) are kept until the system needs space, so it increases the application's disk space unless the developer manually deletes them.

### process module

- `process.cwd()` is the root directory of the file system, instead of the start directory of the project.
- `process.exit()` is not allowed by the Apple App Store guildelines.
- `process.stdin` is not available.
- `process.platform` can also be 'android' or 'ios', depending on the platform.
- `process.versions` includes the 'mobile' key, containing the nodejs-mobile core library version.

The following functions are only available on POSIX platforms, so they are unavailable on Android:

- `process.getegid()`
- `process.geteuid()`
- `process.getgid()`
- `process.getgroups()`
- `process.getuid()`
- `process.setegid()`
- `process.seteuid()`
- `process.setgid()`
- `process.setgroups()`
- `process.setuid()`

---

## Configuration

<docgen-config>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

These config values are available:

| Prop            | Type                            | Description                                                                                                                                                                                                                               | Default               | Since |
| --------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----- |
| **`nodeDir`**   | <code>string</code>             | Relative path of the integrated Node.js project based on the Capacitor webdir.                                                                                                                                                            | <code>"nodejs"</code> | 1.0.0 |
| **`startMode`** | <code>'auto' \| 'manual'</code> | Startup mode of the Node.js engine. The following values are accepted: **`auto`**: The Node.js engine starts automatically when the application is launched. **`manual`**: The Node.js engine is started via the `NodeJS.start()` method. | <code>"auto"</code>   | 1.0.0 |

### Examples

In `capacitor.config.json`:

```json
{
  "plugins": {
    "CapacitorNodeJS": {
      "nodeDir": "custom-nodejs",
      "startMode": "manual"
    }
  }
}
```

In `capacitor.config.ts`:

```ts
/// <reference types="capacitor-nodejs" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  plugins: {
    CapacitorNodeJS: {
      nodeDir: "custom-nodejs",
      startMode: "manual",
    },
  },
};

export default config;
```

</docgen-config>

---

## API - Bridge module

The `bridge` module is built-in. It provides an API to communicate between the Capacitor layer and the Node.js process, as well as an API to get a per-user application data directory on each platform.

TypeScript declarations for this `bridge` module can be manually installed as dev-dependency. If needed, the types-only package can be found under `node_modules/capacitor-nodejs/assets/types/bridge` in the root of the Capacitor project.

* [`getDataPath()`](#getDataPath)
* [`channel`](#channel)


### getDataPath()

```typescript
getDataPath: () => string
```

Returns a path for a per-user application data directory on each platform, where data can be read and written.

**Since:** 1.0.0

--------------------

### channel

The `channel` class of the `bridge` module is an [Event Emitter](https://nodejs.org/api/events.html#events_class_eventemitter). It provides a few methods to send messages from the Node.js process to the Capacitor layer, and to receive replies from the Capacitor layer.

It has the following method to listen for events and send messages:

* [`send(...)`](#channelsend)
* [`on(string, ...)`](#channelonstring)
* [`once(string, ...)`](#channeloncestring)
* [`addListener(string, ...)`](#channeladdlistenerstring)
* [`removeListener(...)`](#channelremovelistener)
* [`removeAllListeners(...)`](#channelremovealllisteners)

### channel.send(...)

```typescript
send: (eventName: string, ...args: any[]) => void
```

Sends a message to the Capacitor layer via `eventName`, along with arguments.
Arguments will be serialized with JSON.

| Param           | Type                | Description                          | Since |
| --------------- | ------------------- | ------------------------------------ | ----- |
| **`eventName`** | <code>string</code> | The name of the event being send to. | 1.0.0 |
| **`args`**      | <code>any[]</code>  | The Array of arguments to send.      | 1.0.0 |

**Since:** 1.0.0

--------------------


### channel.on(string, ...)

```typescript
on: (eventName: string, listener: (...args: any[]) => void) => void
```

Listens to `eventName` and calls `listener(args...)` when a new message arrives from the Capacitor layer.

| Param           | Type                                  |
| --------------- | ------------------------------------- |
| **`eventName`** | <code>string</code>                   |
| **`listener`**  | <code>(...args: any[]) => void</code> |

```typescript
listener: (...args: any[]) => void
```

| Param      | Type                | Description                      | Since |
| ---------- | ------------------- | -------------------------------- | ----- |
| **`args`** | <code>any[]</code>  | The received array of arguments. | 1.0.0 |

**Since:** 1.0.0

--------------------


### channel.once(string, ...)

```typescript
once: (eventName: string, listener: (...args: any[]) => void) => void
```

Listens one time to `eventName` and calls `listener(args...)` when a new message arrives from the Capacitor layer, after which it is removed.

| Param           | Type                                  |
| --------------- | ------------------------------------- |
| **`eventName`** | <code>string</code>                   |
| **`listener`**  | <code>(...args: any[]) => void</code> |

```typescript
listener: (...args: any[]) => void
```

| Param      | Type                | Description                      | Since |
| ---------- | ------------------- | -------------------------------- | ----- |
| **`args`** | <code>any[]</code>  | The received array of arguments. | 1.0.0 |

**Since:** 1.0.0

--------------------


### channel.addListener(string, ...)

```typescript
addListener: (eventName: string, listener: (...args: any[]) => void) => void
```

Alias for [`channel.on(string, ...)`](#channelonstring).

| Param           | Type                                  |
| --------------- | ------------------------------------- |
| **`eventName`** | <code>string</code>                   |
| **`listener`**  | <code>(...args: any[]) => void</code> |

```typescript
listener: (...args: any[]) => void
```

| Param      | Type                | Description                      | Since |
| ---------- | ------------------- | -------------------------------- | ----- |
| **`args`** | <code>any[]</code>  | The received array of arguments. | 1.0.0 |

**Since:** 1.0.0

--------------------


### channel.removeListener(...)

```typescript
removeListener: (eventName: string, listener: (...args: any[]) => void) => void
```

Removes the specified `listener` from the listener array for the specified `eventName`.

| Param           | Type                                  |
| --------------- | ------------------------------------- |
| **`eventName`** | <code>string</code>                   |
| **`listener`**  | <code>(...args: any[]) => void</code> |

**Since:** 1.0.0

--------------------


### channel.removeAllListeners(...)

```typescript
removeAllListeners: (eventName?: string) => void
```

Removes all listeners, or those of the specified `eventName`.

| Param           | Type                | Description                                               | Since |
| --------------- | ------------------- | --------------------------------------------------------- | ----- |
| **`eventName`** | <code>string</code> | The name of the event all listeners will be removed from. | 1.0.0 |

**Since:** 1.0.0

--------------------


## API - Capacitor layer

The `NodeJS` module is the API used in the Capacitor app. It provides a few methods to send messages from the Node.js layer and wait for them.

It has the following methods:

<docgen-index>

* [`start(...)`](#start)
* [`send(...)`](#send)
* [`whenReady()`](#whenready)
* [`addListener(string, ...)`](#addlistenerstring)
* [`removeListener(...)`](#removelistener)
* [`removeAllListeners(...)`](#removealllisteners)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### start(...)

```typescript
start(options?: StartOptions) => Promise<void>
```

Starts the Node.js engine with properties as set by the `options`.

**Note:** This method is only available if the Node.js engine startup mode was set to `'manual'` via the plugin configuration.

| Param         | Type                                                  |
| ------------- | ----------------------------------------------------- |
| **`options`** | <code><a href="#startoptions">StartOptions</a></code> |

**Since:** 1.0.0

--------------------


### send(...)

```typescript
send(args: ChannelPayloadData) => Promise<void>
```

Sends a message to the Node.js process.

| Param      | Type                                                              |
| ---------- | ----------------------------------------------------------------- |
| **`args`** | <code><a href="#channelpayloaddata">ChannelPayloadData</a></code> |

**Since:** 1.0.0

--------------------


### whenReady()

```typescript
whenReady() => Promise<void>
```

Resolves when the Node.js process is initialized.

**Since:** 1.0.0

--------------------


### addListener(string, ...)

```typescript
addListener(eventName: string, listenerFunc: ChannelListenerCallback) => Promise<PluginListenerHandle> & PluginListenerHandle
```

Listens to `eventName` and calls `listenerFunc(data)` when a new message arrives from the Node.js process.

**Note:** When using the Electron platform, [`PluginListenerHandle.remove()`](#pluginlistenerhandle) does not work due to limitations.
Use [`removeListener(listenerFunc)`](#removelistener) instead.

| Param              | Type                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| **`eventName`**    | <code>string</code>                                                         |
| **`listenerFunc`** | <code><a href="#channellistenercallback">ChannelListenerCallback</a></code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt; & <a href="#pluginlistenerhandle">PluginListenerHandle</a></code>

**Since:** 1.0.0

--------------------


### removeListener(...)

```typescript
removeListener(listenerHandle: PluginListenerHandle) => Promise<void>
```

Removes the specified `listenerHandle` from the listener array for the event it refers to.

| Param                | Type                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| **`listenerHandle`** | <code><a href="#pluginlistenerhandle">PluginListenerHandle</a></code> |

**Since:** 1.0.0

--------------------


### removeAllListeners(...)

```typescript
removeAllListeners(eventName?: string) => Promise<void>
```

Removes all listeners, or those of the specified `eventName`, for this plugin.

| Param           | Type                |
| --------------- | ------------------- |
| **`eventName`** | <code>string</code> |

**Since:** 1.0.0

--------------------


### Interfaces


#### StartOptions

An interface containing the options used when starting the Node.js engine manually.

| Prop          | Type                                        | Description                                                                                                                                                                                                                                                              | Since |
| ------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| **`nodeDir`** | <code>string</code>                         | Relative path of the integrated Node.js project based on the Capacitor webdir. Defaults to the `nodeDir` field of the global plugin configuration. If the `nodeDir` config is not set, `nodejs` in the Capacitor webdir is used as Node.js project directory.            | 1.0.0 |
| **`script`**  | <code>string</code>                         | The primary entry point to the Node.js program. This should be a module relative to the root of the Node.js project folder. Defaults to the `main` field in the project's package.json. If the `main` field is not set, `index.js` in the project's root folder is used. | 1.0.0 |
| **`args`**    | <code>string[]</code>                       | A list of string arguments.                                                                                                                                                                                                                                              | 1.0.0 |
| **`env`**     | <code><a href="#nodeenv">NodeEnv</a></code> | Environment key-value pairs.                                                                                                                                                                                                                                             | 1.0.0 |


#### NodeEnv

An interface that holds environment variables as string key-value pairs.


#### ChannelPayloadData

The payload data to send a message to the web page via `eventName`,
along with arguments. Arguments will be serialized with JSON.

| Prop            | Type                | Description                          | Since |
| --------------- | ------------------- | ------------------------------------ | ----- |
| **`eventName`** | <code>string</code> | The name of the event being send to. | 1.0.0 |
| **`args`**      | <code>any[]</code>  | The array of arguments to send.      | 1.0.0 |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


#### ChannelCallbackData

The callback data object when a message from the Node.js process arrives.

| Prop       | Type               | Description                      | Since |
| ---------- | ------------------ | -------------------------------- | ----- |
| **`args`** | <code>any[]</code> | The received array of arguments. | 1.0.0 |


### Type Aliases


#### ChannelListenerCallback

The callback function to be called when listen to messages from the Node.js process.

<code>(data: <a href="#channelcallbackdata">ChannelCallbackData</a>): void</code>

</docgen-api>

---

<p align="center">
  Made with ❤️ by Rene Hampölz
  <br><br>
  <a href="https://github.com/hampoelz"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
  <a href="https://www.instagram.com/rene_hampi/"><img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"></a>
  <a href="https://twitter.com/rene_hampi/"><img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter"></a>
</p>
