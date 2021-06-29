# 📱 Capacitor NodeJS-Integration

➡ A full-fledged [Node.js](https://nodejs.org/) runtime for [Capacitor](https://capacitorjs.com) apps.

> ℹ️ This project uses the [Node.js for Mobile Apps](https://github.com/JaneaSystems/nodejs-mobile) toolkit to add NodeJS support in Android and IOS

> **⚠ In early development ⚠**
> - _Note:_ The project is still very unstable, if you have any problems or suggestions it would be nice if you create an issue.
> - Only the Android platform is currently supported.
> - When the project is stable it will be published on NPM.
> - Features like IOS- and [Electron](https://github.com/capacitor-community/electron)- support or a command to update the NodeJS runtime will be added in the future.

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
import { NodeJS } from 'capacitor-nodejs';

NodeJS.addListener('msg-from-nodejs', event => {
    document.body.innerHTML = `<p>First argument: ${event.args[0]}<br>Second argument: ${event.args[1]}</p>`
    console.log(event);
});

NodeJS.send({
    eventName: "msg-from-capacitor",
    args: [ "Hello from Capacitor!" ]
});
```

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
* [`addListener(...)`](#addlistener)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### send(...)

```typescript
send(options: MessageOptions) => any
```

Send a message to the NodeJS process.

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#messageoptions">MessageOptions</a></code> |

**Returns:** <code>any</code>

**Since:** 1.0.0

--------------------


### addListener(...)

```typescript
addListener(eventName: string, listenerFunc: ChannelListener) => Promise<PluginListenerHandle> & PluginListenerHandle
```

Listens to `eventName`, when a new message arrives `listenerFunc` from the NodeJS process would be called with `listenerFunc(event)`.

| Param              | Type                                                  |
| ------------------ | ----------------------------------------------------- |
| **`eventName`**    | <code>string</code>                                   |
| **`listenerFunc`** | <code>(event: ChannelListenerEvent) =&gt; void</code> |

**Returns:** <code>any</code>

**Since:** 1.0.0

--------------------


### Interfaces


#### MessageOptions

Options to send a message to the NodeJS process via `eventName`, along with
arguments. Arguments will be serialized with JSON.

| Prop            | Type                | Description                         | Since |
| --------------- | ------------------- | ----------------------------------- | ----- |
| **`eventName`** | <code>string</code> | The name of the event being send to | 1.0.0 |
| **`args`**      | <code>{}</code>     | Array of arguments to send          | 1.0.0 |


#### PluginListenerHandle

| Prop         | Type                      |
| ------------ | ------------------------- |
| **`remove`** | <code>() =&gt; any</code> |

</docgen-api>
