# 📱 Capacitor NodeJS-Integration

➡ A full-fledged [Node.js](https://nodejs.org/) runtime for [Capacitor](https://capacitorjs.com) apps.

> ℹ️ This project uses the [Node.js for Mobile Apps](https://github.com/nodejs-mobile/nodejs-mobile) toolkit to add Node.js support in Android and IOS

> **⚠ WIP - Work in Progress ⚠**
>
> The project is part of my diploma thesis, an overview can be found at [hampoelz/HTL_Diplomarbeit](https://github.com/hampoelz/HTL_Diplomarbeit).
>
> ⏰ Planed Deadline: September 2023
>
> Notes:
> - The project is still very unstable, if you have any problems or suggestions it would be nice if you create an issue.
> - When the project is stable it will be published on NPM.
> - Features like IOS support will be added in the future.
> - The node.js version used in this project depends on the [Node.js for Mobile Apps](https://github.com/nodejs-mobile/nodejs-mobile) toolkit.

### Supported Platforms

- [x] Android
- [ ] IOS _(coming soon)_
- [x] Using the [`capacitor-community/electron` plugin](https://github.com/capacitor-community/electron):
  - [x] Windows
  - [x] Linux
  - [x] macOS

## Install

**You've to use Capacitor v5 or newer. This project isn't compatible with lower versions of Capacitor.**

```bash
npm install https://github.com/hampoelz/capacitor-nodejs/releases/download/v1.0.0-beta.2/capacitor-nodejs.tgz
npx cap sync
```

> ❗ Important
>
> For now Android 32-bit x86 support is disabled in Capacitor-NodeJS v1.0.0-beta.2 _(based on node.js v16)_ as there is currently no support for it in the latest version of the nodejs-mobile core library. However, you can use Capacitor-NodeJS v1.0.0-beta.1 which is based on node.js v12.

## Examples

Several example projects can be found in the [hampoelz/Capacitor-NodeJS_Examples](https://github.com/hampoelz/Capacitor-NodeJS_Examples) repository.

Currently there are two example projects available. One without any additional framework, located in the [`example/vanilla`](https://github.com/hampoelz/Capacitor-NodeJS_Examples/tree/example/vanilla) branch. And one that uses the vitejs framework in [`example/vite`](https://github.com/hampoelz/Capacitor-NodeJS_Examples/tree/example/vite).

## Getting Started

To add a Node.js project to your app, the following steps are required:

1. Create a new directory called `nodejs` inside your app's source/public directory _(this is usually the `src` folder or if you use a build system the `public` folder)_. The `nodejs` dir will serve as your Node.js project folder. _(modules can be installed later in this folder)_
2. Create a `package.json` file in it as the starting point of the Node.js integration:
  ```json
  {
      "name": "capacitor-node-project",
      "version": "1.0.0",
      "description": "node part of the project",
      "main": "main.js",
      "author": "hampoelz",
      "license": "MIT",
      "dependencies": {
          "bridge": "file:../../node_modules/capacitor-nodejs/assets/builtin_modules/bridge"
      }
  }
  ```
3. Create the main script of the Node.js integration _(in this case `main.js`)_, which could look like this:
  ```javascript
  const { channel } = require('bridge');

  channel.addListener('msg-from-capacitor', message => {
      console.log('[node] Message from Capacitor code: ' + message);
      channel.send("msg-from-nodejs", "Replying to this message: " + message, "And optionally add further args");
  });
  ```
4. Run `npm install --install-links` in your newly created Node.js project folder.

After that, the project structure should look something like this:

```
my-capacitor-app/
├── ...
├── src/                    # app source directory
│   ├── ...
│   ├── nodejs/             # Node.js project directory
│   │   ├── node_modules/
│   │   ├── main.js         # main script of the Node.js integration
│   │   ├── package.json    # starting point of the Node.js integration
│   ├── ...
│   ├── index.html
├── capacitor.config.json
├── package.json
├── README.md
└── ...
```

Now you can communicate with the Node.js layer in your Capacitor app:

```typescript
import { NodeJS } from 'capacitor-nodejs';

// Listens to "msg-from-nodejs" from the Node.js process.
NodeJS.addListener('msg-from-nodejs', event => {
  document.body.innerHTML = `<p>First argument: ${event.args[0]}<br>Second argument: ${event.args[1]}</p>`
  console.log(event);
});

// Wait for the Node.js process to initialize.
NodeJS.whenReady().then(() => {

  // Send a message to the Node.js process.
  NodeJS.send({
      eventName: "msg-from-capacitor",
      args: [ "Hello from Capacitor!" ]
  });

});
```

> ❗ Important
>
> If you use a build system for your app, make sure to add the Node.js project directory to you static assets. _(Or copy the nodejs dir to the output directory, for example by adding `cp -r src/nodejs dist/` to your build steps.)_
> 

> ℹ️ Information
>
> If you are using the [`capacitor-community/electron`](https://github.com/capacitor-community/electron) plugin, packaging with the electron-builder may cause problems since it does not include the modules from the nodejs project by default.
>
> To fix this issue, add `"includeSubNodeModules": true` to your `electron-builder.config.json`.

## Configuration

<docgen-config>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

These config values are available:

| Prop          | Type                | Description                                                                    | Default               | Since |
| ------------- | ------------------- | ------------------------------------------------------------------------------ | --------------------- | ----- |
| **`nodeDir`** | <code>string</code> | Relative path of the integrated Node.js project based on the Capacitor webdir. | <code>"nodejs"</code> | 1.0.0 |

### Examples

In `capacitor.config.json`:

```json
{
  "plugins": {
    "CapacitorNodeJS": {
      "nodeDir": "custom-nodejs"
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
    },
  },
};

export default config;
```

</docgen-config>

If you change your `nodeDir` to `custom-nodejs`, then your project structure should look something like this:

```
my-capacitor-app/
├── ...
├── src/                    # app source directory
│   ├── ...
│   ├── custom-nodejs/      # the new Node.js project directory
│   │   ├── node_modules/
│   │   ├── main.js
│   │   ├── package.json
│   ├── ...
│   ├── index.html
├── capacitor.config.json
├── package.json
├── README.md
└── ...
```

## Node Modules

Node modules can be added to the project using npm. The Node modules have to be installed in the Node.js project folder in which the `package.json` file was created.

Go to the Node.js project folder and proceed with the installation of the Node modules you want to add to your Node.js project.

Sync and rebuild your Capacitor project so that the newly added Node modules are added to the application.

On Android, the plugin extracts the project files and the Node modules from the APK assets in order to make them available to the Node.js for Mobile Apps engine. They are extracted from the APK and copied to a working folder (`context.getFilesDir().getAbsolutePath() + "/public/<nodeDir>"` where `<nodeDir>` is the Node.js project folder configured in the `capacitor.config.json` file. If there is no configuration, the `<nodeDir>` can be omitted in the path) when the application is launched for the first time or a new version of the application has been installed.

> ⚠️ Warning
>
> Given the project folder will be overwritten after each application update, it should not be used for persistent data storage.

You may want to add a gitignore file to ignore unnecessary files. To do this, create a new file named `.gitignore` in the Node.js project folder and copy the contents of [github.com/github/gitignore/blob/master/Node.gitignore](https://github.com/github/gitignore/blob/master/Node.gitignore) into it.

## API - Node.js layer

The `channel` module is an [Event Emitter](https://nodejs.org/api/events.html#events_class_eventemitter). It provides a few methods so you can send messages from the Node.js process to the Capacitor layer. You can also receive replies from the Capacitor layer. To use this module, you need to add it to the dependencies of your Node.js project, as described in the [Getting Started](#getting-started) section.

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

The `NodeJS` module is the API you use in your Capacitor app. It provides a few methods so you can send messages from the Node.js layer and wait for them.

It has the following methods:

<docgen-index>

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

### send(...)

```typescript
send(args: ChannelPayloadData) => Promise<{ value: boolean; }>
```

Sends a message to the Node.js process.

| Param      | Type                                                              |
| ---------- | ----------------------------------------------------------------- |
| **`args`** | <code><a href="#channelpayloaddata">ChannelPayloadData</a></code> |

**Returns:** <code>Promise&lt;{ value: boolean; }&gt;</code>

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
removeAllListeners(eventName?: string | undefined) => Promise<void>
```

Removes all listeners, or those of the specified `eventName`, for this plugin.

| Param           | Type                |
| --------------- | ------------------- |
| **`eventName`** | <code>string</code> |

**Since:** 1.0.0

--------------------


### Interfaces


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
