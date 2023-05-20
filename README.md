# 📱 Capacitor NodeJS-Integration

➡ A full-fledged [Node.js](https://nodejs.org/) runtime for [Capacitor](https://capacitorjs.com) apps.

> ℹ️ This project uses the [Node.js for Mobile Apps](https://github.com/nodejs-mobile/nodejs-mobile) toolkit to add NodeJS support in Android and IOS

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
**You've to use Capacitor v3 or newer. This project isn't compatible with lower versions of Capacitor.**

```bash
npm install https://github.com/hampoelz/capacitor-nodejs/releases/download/v1.0.0-beta.2/capacitor-nodejs.tgz
npx cap sync
```

> ❗ Important
>
> For now Android 32-bit x86 support is disabled in Capacitor-NodeJS v1.0.0-beta.2 _(based on node.js v16)_ as there is currently no support for it in the latest version of the nodejs-mobile core library. However, you can use Capacitor-NodeJS v1.0.0-beta.1 which is based on node.js v12.

## Examples

Currently there are two example projects available. One without any additional framework, located in the [`example/vanilla`](https://github.com/hampoelz/Capacitor-NodeJS/tree/example/vanilla) branch. And one that uses the vitejs framework in [`example/vite`](https://github.com/hampoelz/Capacitor-NodeJS/tree/example/vite).

## Getting Started

To add a NodeJS project to your app, the following steps are required:

1. Create a new directory called `nodejs` inside your app's source/public directory _(this is usually the `src` folder or if you use a build system the `public` folder)_. The `nodejs` dir will serve as your NodeJS project folder. _(modules can be installed later in this folder)_
2. Create a `package.json` file in it as the starting point of the NodeJS integration:
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
3. Create the main script of the NodeJS integration _(in this case `main.js`)_, which could look like this:
  ```javascript
  const { channel } = require('bridge');

  channel.addListener('msg-from-capacitor', message => {
      console.log('[node] Message from Capacitor code: ' + message);
      channel.send("msg-from-nodejs", "Replying to this message: " + message, "And optionally add further args");
  });
  ```
4. Run `npm install` in your newly created NodeJS project folder.

After that, the project structure should look something like this:
```
my-capacitor-app/
├── ...
├── src/                    # app source directory
│   ├── ...
│   ├── nodejs/             # NodeJS project directory
│   │   ├── node_modules/
│   │   ├── main.js         # main script of the NodeJS integration
│   │   ├── package.json    # starting point of the NodeJS integration
│   ├── ...
│   ├── index.html
├── capacitor.config.json
├── package.json
├── README.md
└── ...
```

Now you can communicate with the NodeJS layer in your CapacitorJS app:
```typescript
import { NodeJS } from 'capacitor-nodejs';
//const NodeJS = Capacitor.Plugins.NodeJS;

// Listens to "msg-from-nodejs" from the NodeJS process.
NodeJS.addListener('msg-from-nodejs', event => {
  document.body.innerHTML = `<p>First argument: ${event.args[0]}<br>Second argument: ${event.args[1]}</p>`
  console.log(event);
});

// Wait for the NodeJS process to initialize.
NodeJS.whenReady().then(() => {

  // Send a message to the NodeJS process.
  NodeJS.send({
      eventName: "msg-from-capacitor",
      args: [ "Hello from Capacitor!" ]
  });

});
```

> ❗ Important
>
> If you use a build system for your app, make sure to add the NodeJS project directory to you static assets. _(Or copy the nodejs dir to the output directory, for example by adding `cp -r src/nodejs dist/` to your build steps.)_
> 

> ℹ️ Information
>
> If you are using the [`capacitor-community/electron`](https://github.com/capacitor-community/electron) plugin, packaging with the electron-builder may cause problems since it does not include the modules from the nodejs project by default.
>
> To fix this issue, add `"includeSubNodeModules": true` to your `electron-builder.config.json`.

## Configuration
You can customize the NodeJS project directory. By default, it is a folder named `nodejs` in your app's source directory. But it can be changed in the `capacitor.config.json` file.

```json
{
  "plugins": {
    "NodeJS": {
      "nodeDir": "custom-nodejs"
    }
  }
}
```

For example, if you change it to `custom-nodejs`, then your project structure should look something like this:
```
my-capacitor-app/
├── ...
├── src/                    # app source directory
│   ├── ...
│   ├── custom-nodejs/      # the new NodeJS project directory
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
Node modules can be added to the project using npm. The Node modules have to be installed in the NodeJS project folder in which the `package.json` file was created.

Go to the NodeJS project folder and proceed with the installation of the Node modules you want to add to your Node.js project.

Sync and rebuild your Capacitor project so that the newly added Node modules are added to the application.

On Android, the plugin extracts the project files and the Node modules from the APK assets in order to make them available to the Node.js for Mobile Apps engine. They are extracted from the APK and copied to a working folder (`context.getFilesDir().getAbsolutePath() + "/public/<nodeDir>"` where `<nodeDir>` is the NodeJS project folder configured in the `capacitor.config.json` file. If there is no configuration, the `<nodeDir>` can be omitted in the path) when the application is launched for the first time or a new version of the application has been installed.

> ⚠️ Warning
>
> Given the project folder will be overwritten after each application update, it should not be used for persistent data storage.

You may want to add a gitignore file to ignore unnecessary files. To do this, create a new file named `.gitignore` in the NodeJS project folder and copy the contents of [github.com/github/gitignore/blob/master/Node.gitignore](https://github.com/github/gitignore/blob/master/Node.gitignore) into it.

## API - NodeJS layer
The `channel` module is an [Event Emitter](https://nodejs.org/api/events.html#events_class_eventemitter). It provides a few methods so you can send messages from the NodeJS process to the capacitor layer. You can also receive replies from the capacitor layer.

It has the following method to listen for events and send messages:

### `channel.on(eventName, listener)`

* `eventName` String
* `listener` Function
  * `...args` any[]

Listens to `eventName`, when a new message arrives `listener` would be called with
`listener(args...)`.

### `channel.once(eventName, listener)`

* `eventName` String
* `listener` Function
  * `...args` any[]

Adds a one time `listener` function for the event. This `listener` is invoked
only the next time a message is sent to `eventName`, after which it is removed.

### `channel.addListener(eventName, listener)`

* `eventName` String
* `listener` Function
  * `...args` any[]

Alias for `channel.on(eventName, listener)`.

### `channel.removeListener(eventName, listener)`

* `eventName` String
* `listener` Function
  * `...args` any[]

Removes the specified `listener` from the listener array for the specified
`eventName`.

### `channel.removeAllListeners(eventName)`

* `eventName` String

Removes all listeners, or those of the specified `eventName`.

### `channel.send(eventName, ...args)`

* `eventName` String
* `...args` any[]

Send a message to the capacitor layer via `eventName`, along with
arguments. Arguments will be serialized with JSON.

## API - Capacitor layer
The `NodeJS` module is the API you use in your Capacitor app. It provides a few methods so you can send messages from the NodeJS layer and wait for them.

<docgen-index>

* [`send(...)`](#send)
* [`addListener(string, ...)`](#addlistenerstring)
* [`whenReady()`](#whenready)
* [`removeListener(...)`](#removelistener)
* [`removeAllListeners()`](#removealllisteners)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### send(...)

```typescript
send(options: MessageOptions) => Promise<{ value: boolean; }>
```

Send a message to the NodeJS process.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#messageoptions">MessageOptions</a></code> |

**Returns:** <code>Promise&lt;{ value: boolean; }&gt;</code>

**Since:** 1.0.0

--------------------


### addListener(string, ...)

```typescript
addListener(eventName: string, listenerFunc: ChannelListener) => Promise<PluginListenerHandle> & PluginListenerHandle
```

Listens to `eventName`, when a new message arrives `listenerFunc` from the NodeJS process would be called with `listenerFunc(event)`.

**Note:** When using the electron platform, `listenerHandle.remove()` does not work due to limitations. Use [`removeListener(listenerFunc)`](#removelistener) instead.

| Param              | Type                                                        |
| ------------------ | ----------------------------------------------------------- |
| **`eventName`**    | <code>string</code>                                         |
| **`listenerFunc`** | <code><a href="#channellistener">ChannelListener</a></code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt; & <a href="#pluginlistenerhandle">PluginListenerHandle</a></code>

**Since:** 1.0.0

--------------------


### whenReady()

```typescript
whenReady() => Promise<void>
```

Fulfilled when the NodeJS process is initialized.

**Since:** 1.0.0

--------------------


### removeListener(...)

```typescript
removeListener(listenerHandle: Promise<PluginListenerHandle> | PluginListenerHandle) => Promise<void>
```

Remove the `listenerFunc` of the specified `listenerHandle` from the listener array for the event named `eventName`.

| Param                | Type                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`listenerHandle`** | <code><a href="#pluginlistenerhandle">PluginListenerHandle</a> \| Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code> |

**Since:** 1.0.0

--------------------


### removeAllListeners()

```typescript
removeAllListeners() => Promise<void>
```

Remove all listeners for this plugin.

**Note:** When using the electron platform, this method does not work! _(will be solved by https://github.com/capacitor-community/electron/pull/185)_

**Since:** 1.0.0

--------------------


### Interfaces


#### MessageOptions

Options to send a message to the NodeJS process via `eventName`, along with
arguments. Arguments will be serialized with JSON.

| Prop            | Type                | Description                         | Since |
| --------------- | ------------------- | ----------------------------------- | ----- |
| **`eventName`** | <code>string</code> | The name of the event being send to | 1.0.0 |
| **`args`**      | <code>any[]</code>  | Array of arguments to send          | 1.0.0 |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


#### ChannelListenerEvent

The event object when a message from the NodeJS process arrives.

| Prop       | Type               | Description                 | Since |
| ---------- | ------------------ | --------------------------- | ----- |
| **`args`** | <code>any[]</code> | Received array of arguments | 1.0.0 |


### Type Aliases


#### ChannelListener

The callback function when listen to messages from the NodeJS process.

<code>(event: <a href="#channellistenerevent">ChannelListenerEvent</a>): void</code>

</docgen-api>

---

<p align="center">
  Made with ❤️ by Rene Hampölz
  <br><br>
  <a href="https://github.com/hampoelz"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
  <a href="https://www.instagram.com/rene_hampi/"><img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram"></a>
  <a href="https://twitter.com/rene_hampi/"><img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter"></a>
</p>
