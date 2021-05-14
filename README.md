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
* [`addListener(string, ...)`](#addlistenerstring-)
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

| Param              | Type                                                        |
| ------------------ | ----------------------------------------------------------- |
| **`eventName`**    | <code>string</code>                                         |
| **`listenerFunc`** | <code><a href="#channellistener">ChannelListener</a></code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt; & <a href="#pluginlistenerhandle">PluginListenerHandle</a></code>

**Since:** 1.0.0

--------------------


### Interfaces


#### MessageOptions

Options to send a message to the NodeJS process via `eventName`, along with
arguments. Arguments will be serialized with JSON.

| Prop            | Type                                               | Description                                     | Since |
| --------------- | -------------------------------------------------- | ----------------------------------------------- | ----- |
| **`eventName`** | <code>string</code>                                | The name of the event being send to             | 1.0.0 |
| **`args`**      | <code><a href="#array">Array</a>&lt;any&gt;</code> | <a href="#array">Array</a> of arguments to send | 1.0.0 |


#### Array

| Prop         | Type                | Description                                                                                            |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------ |
| **`length`** | <code>number</code> | Gets or sets the length of the array. This is a number one higher than the highest index in the array. |

| Method             | Signature                                                                                                                     | Description                                                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **toString**       | () =&gt; string                                                                                                               | Returns a string representation of an array.                                                                                                                                                                                                |
| **toLocaleString** | () =&gt; string                                                                                                               | Returns a string representation of an array. The elements are converted to string using their toLocalString methods.                                                                                                                        |
| **pop**            | () =&gt; T \| undefined                                                                                                       | Removes the last element from an array and returns it. If the array is empty, undefined is returned and the array is not modified.                                                                                                          |
| **push**           | (...items: T[]) =&gt; number                                                                                                  | Appends new elements to the end of an array, and returns the new length of the array.                                                                                                                                                       |
| **concat**         | (...items: <a href="#concatarray">ConcatArray</a>&lt;T&gt;[]) =&gt; T[]                                                       | Combines two or more arrays. This method returns a new array without modifying any existing arrays.                                                                                                                                         |
| **concat**         | (...items: (T \| <a href="#concatarray">ConcatArray</a>&lt;T&gt;)[]) =&gt; T[]                                                | Combines two or more arrays. This method returns a new array without modifying any existing arrays.                                                                                                                                         |
| **join**           | (separator?: string \| undefined) =&gt; string                                                                                | Adds all the elements of an array into a string, separated by the specified separator string.                                                                                                                                               |
| **reverse**        | () =&gt; T[]                                                                                                                  | Reverses the elements in an array in place. This method mutates the array and returns a reference to the same array.                                                                                                                        |
| **shift**          | () =&gt; T \| undefined                                                                                                       | Removes the first element from an array and returns it. If the array is empty, undefined is returned and the array is not modified.                                                                                                         |
| **slice**          | (start?: number \| undefined, end?: number \| undefined) =&gt; T[]                                                            | Returns a copy of a section of an array. For both start and end, a negative index can be used to indicate an offset from the end of the array. For example, -2 refers to the second to last element of the array.                           |
| **sort**           | (compareFn?: ((a: T, b: T) =&gt; number) \| undefined) =&gt; this                                                             | Sorts an array in place. This method mutates the array and returns a reference to the same array.                                                                                                                                           |
| **splice**         | (start: number, deleteCount?: number \| undefined) =&gt; T[]                                                                  | Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.                                                                                                                      |
| **splice**         | (start: number, deleteCount: number, ...items: T[]) =&gt; T[]                                                                 | Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.                                                                                                                      |
| **unshift**        | (...items: T[]) =&gt; number                                                                                                  | Inserts new elements at the start of an array, and returns the new length of the array.                                                                                                                                                     |
| **indexOf**        | (searchElement: T, fromIndex?: number \| undefined) =&gt; number                                                              | Returns the index of the first occurrence of a value in an array, or -1 if it is not present.                                                                                                                                               |
| **lastIndexOf**    | (searchElement: T, fromIndex?: number \| undefined) =&gt; number                                                              | Returns the index of the last occurrence of a specified value in an array, or -1 if it is not present.                                                                                                                                      |
| **every**          | &lt;S extends T&gt;(predicate: (value: T, index: number, array: T[]) =&gt; value is S, thisArg?: any) =&gt; this is S[]       | Determines whether all the members of an array satisfy the specified test.                                                                                                                                                                  |
| **every**          | (predicate: (value: T, index: number, array: T[]) =&gt; unknown, thisArg?: any) =&gt; boolean                                 | Determines whether all the members of an array satisfy the specified test.                                                                                                                                                                  |
| **some**           | (predicate: (value: T, index: number, array: T[]) =&gt; unknown, thisArg?: any) =&gt; boolean                                 | Determines whether the specified callback function returns true for any element of an array.                                                                                                                                                |
| **forEach**        | (callbackfn: (value: T, index: number, array: T[]) =&gt; void, thisArg?: any) =&gt; void                                      | Performs the specified action for each element in an array.                                                                                                                                                                                 |
| **map**            | &lt;U&gt;(callbackfn: (value: T, index: number, array: T[]) =&gt; U, thisArg?: any) =&gt; U[]                                 | Calls a defined callback function on each element of an array, and returns an array that contains the results.                                                                                                                              |
| **filter**         | &lt;S extends T&gt;(predicate: (value: T, index: number, array: T[]) =&gt; value is S, thisArg?: any) =&gt; S[]               | Returns the elements of an array that meet the condition specified in a callback function.                                                                                                                                                  |
| **filter**         | (predicate: (value: T, index: number, array: T[]) =&gt; unknown, thisArg?: any) =&gt; T[]                                     | Returns the elements of an array that meet the condition specified in a callback function.                                                                                                                                                  |
| **reduce**         | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T) =&gt; T                           | Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.                      |
| **reduce**         | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T, initialValue: T) =&gt; T          |                                                                                                                                                                                                                                             |
| **reduce**         | &lt;U&gt;(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) =&gt; U, initialValue: U) =&gt; U | Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.                      |
| **reduceRight**    | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T) =&gt; T                           | Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function. |
| **reduceRight**    | (callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) =&gt; T, initialValue: T) =&gt; T          |                                                                                                                                                                                                                                             |
| **reduceRight**    | &lt;U&gt;(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) =&gt; U, initialValue: U) =&gt; U | Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function. |


#### ConcatArray

| Prop         | Type                |
| ------------ | ------------------- |
| **`length`** | <code>number</code> |

| Method    | Signature                                                          |
| --------- | ------------------------------------------------------------------ |
| **join**  | (separator?: string \| undefined) =&gt; string                     |
| **slice** | (start?: number \| undefined, end?: number \| undefined) =&gt; T[] |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


#### ChannelListenerEvent

The event object when a message from the NodeJS process arrives.

| Prop       | Type                                               | Description                 | Since |
| ---------- | -------------------------------------------------- | --------------------------- | ----- |
| **`args`** | <code><a href="#array">Array</a>&lt;any&gt;</code> | Received array of arguments | 1.0.0 |


### Type Aliases


#### ChannelListener

The callback function when listen to messages from the NodeJS process.

<code>(event: <a href="#channellistenerevent">ChannelListenerEvent</a>): void</code>

</docgen-api>
