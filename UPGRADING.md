## Capacitor-NodeJS v1.0.0-beta.4

Remove the `bridge` module from the Node.js project dependencies. It is now a built-in module on all platforms.

```diff
# static/nodejs/package.json
{
  "name": "capacitor-nodejs-project",
  "version": "1.0.0",
  "main": "./server.js"
  "dependencies": {
-   "bridge": "file:../../node_modules/capacitor-nodejs/assets/builtin_modules/bridge"
  }
}
```

## Capacitor-NodeJS v1.0.0-beta.3

Change the plugin name in the Capacitor configuration from `NodeJS` to `CapacitorNodeJS`.
For example in `capacitor.config.json`:

```diff
# in capacitor.config.json or capacitor.config.ts
{
  "plugins": {
-   "NodeJS": {
+   "CapacitorNodeJS": {
      "nodeDir": "custom-nodejs"
    }
  }
}
```

## Capacitor-NodeJS v1.0.0-beta.1

1. Move the Node.js project from the Capacitor `webDir` to a subfolder named `nodejs`. This step can be skipped if a custom `nodeDir` has been set in the Capacitor configuration. The project structure should then look something like this:

```diff
  capacitor-app/
  ├── ...
  ├── src/                    # Capacitor webDir
  │   ├── ...
+ │   ├── nodejs/             # Node.js project directory
+ │   │   ├── node_modules/
+ │   │   ├── main.js
+ │   │   ├── package.json
- │   ├── node_modules/
- │   ├── main.js
- │   ├── package.json
  │   ├── index.html
  │   ├── ...
  ├── capacitor.config.json
  ├── package.json
  ├── README.md
  └── ...
```


2. Add `"bridge": "file:../../node_modules/capacitor-nodejs/assets/builtin_modules/bridge"` to the `dependencies` object in the Node.js project's `package.json` file. The file should then look something like this:

```diff
# src/nodejs/package.json
{
  "name": "capacitor-nodejs-project",
  "version": "1.0.0",
  "main": "./server.js"
  "dependencies": {
+   "bridge": "file:../../node_modules/capacitor-nodejs/assets/builtin_modules/bridge"
  }
}
```

3. Run `npm install --install-links` in the Node.js project folder to install the added bridge module.
