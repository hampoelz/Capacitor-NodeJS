# 📱 Capacitor NodeJS-Integration

➡ A full-fledged [Node.js](https://nodejs.org/) runtime for [Capacitor](https://capacitorjs.com) apps.

> ℹ️ This project uses the [Node.js for Mobile Apps](https://github.com/JaneaSystems/nodejs-mobile) toolkit to add NodeJS support in Android and IOS

> **⚠ In early development ⚠**
> - _Note:_ The project is still very unstable, if you have any problems or suggestions it would be nice if you create an issue.
> - Only the Android platform is currently supported.
> - When the project is stable it will be published on NPM.
> - Features like IOS support or a command to update the NodeJS runtime will be added in the future.

### Supported Platforms
- [x] Android
- [ ] IOS _(coming soon)_
- [x] Using the [Electron-Platform CapacitorJS plugin](https://github.com/capacitor-community/electron):
  - [x] Windows
  - [x] Linux
  - [x] macOS

## Install
**You've to use Capacitor v3. This project isn't compatible with lower versions of Capacitor.**

```bash
npm install hampoelz/capacitor-nodejs
npx cap sync
```

## Example
The starting point of the NodeJS integration is a `package.json` file.

So we need to go into the webdir (For Angular, this is `www`, React is `build`, and Vue is `dist`. If you don’t know right now, you can check this value in the `capacitor.config.ts`.) and create a `package.json` file:
```json
{
    "name": "capacitor-node-project",
    "version": "1.0.0",
    "description": "node part of the project",
    "main": "main.js",
    "author": "hampoelz",
    "license": "MIT"
}
```

The main script of the NodeJS integration is defined in the `package.json` file, in this case `main.js`. The NodeJS apis and modules can then be accessed from there. Therefore we also have to create a `main.js` file inside the Capacitor webdir.

The main script `main.js` could look like this:
```javascript
const { channel } = require('bridge');

channel.addListener('msg-from-capacitor', message => {
    console.log('[node] Message from Capacitor code: ' + message);
    channel.send("msg-from-nodejs", "Replying to this message: " + message, "And optionally add further args");
});
```

After that, our project structure should look something like this:
```
my-capacitor-app/
 +-- android
 +-- node_modules
 +-- www (capacitor webdir)
 |   +-- css
 |   +-- js
 |   +-- index.html
 |   +-- main.js (nodejs main file, defined in package.json)
 |   +-- manifest.json
 |   +-- package.json (nodejs start point)
 +-- .gitignore
 +-- capacitor.config.json
 +-- package-lock.json
 +-- package.json
 +-- README.md
```

Now in our Capacitor app we can send messages from the NodeJS layer and wait for them:
```typescript
const NodeJS = Capacitor.Plugins.NodeJS || CapacitorCustomPlatform.plugins.NodeJS;
//import { NodeJS } from 'capacitor-nodejs';

NodeJS.addListener('msg-from-nodejs', event => {
    document.body.innerHTML = `<p>First argument: ${event.args[0]}<br>Second argument: ${event.args[1]}</p>`
    console.log(event);
});

NodeJS.send({
    eventName: "msg-from-capacitor",
    args: [ "Hello from Capacitor!" ]
});
```

Since Capacitor-Electron doesn't automatically register the plugin to `Capacitor.Plugins.NodeJS` (See [capacitor-community/electron#115](https://github.com/capacitor-community/electron/issues/115)) we've to use `CapacitorElectronPlugins.NodeJS` instead.

## Configuration
We can customize the NodeJS project directory. By default it is in the root of the Capacitor webdir. But it can be changed in the `capacitor.config.json` file so that the Capacitor- and the NodeJS- project are more separated.

```json
{
  "plugins": {
    "NodeJS": {
      "nodeDir": "nodejs"
    }
  }
}
```
For example, if we change it to `nodejs`, we've to create a `nodejs` directory inside the Capacitor webdir and move the files `package.json` and `main.js` to the newly created directory. Then our project structure should look something like this:
```
my-capacitor-app/
 +-- android
 +-- node_modules
 +-- www
 |   +-- css
 |   +-- js
 |   +-- nodejs     (our new node directory)
 |   |   +-- main.js
 |   |   +-- package.json
 |   +-- index.html
 |   +-- manifest.json 
 +-- .gitignore
 +-- capacitor.config.json
 +-- package-lock.json
 +-- package.json
 +-- README.md
 +-- ...
```

## Node Modules
Node modules can be added to the project using npm. The Node modules have to be installed in the NodeJS project folder in which we created the `package.json` file.

Go to the NodeJS project folder and proceed with the installation of the Node modules you want to add to your Node.js project.

Sync and rebuild your Capacitor project so that the newly added Node modules are added to the application.

On Android, the plugin extracts the project files and the Node modules from the APK assets in order to make them available to the Node.js for Mobile Apps engine. They are extracted from the APK and copied to a working folder (`context.getFilesDir().getAbsolutePath() + "/public/<nodeDir>"` -> `<nodeDir>` is the NodeJS project folder configured in the `capacitor.config.json` file. If there is no configuration, the `<nodeDir>` can be omitted in the path) when the application is launched for the first time or a new version of the application has been installed.

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
