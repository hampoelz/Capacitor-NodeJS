## Capacitor-NodeJS v1.0.0-beta.4

Remove the `bridge` module from your Node.js project dependencies. It is now a built-in module on all platforms.

```diff
  {
    "name": "capacitor-nodejs-project",
    "version": "1.0.0",
    "main": "./server.js"
    "dependencies": {
-     "bridge": "file:../../node_modules/capacitor-nodejs/assets/builtin_modules/bridge"
    }
  }
```

## Capacitor-NodeJS v1.0.0-beta.3

Change the plugin name in your Capacitor configuration from `NodeJS` to `CapacitorNodeJS`.
For example in `capacitor.config.json`:

```diff
  {
    "plugins": {
-     "NodeJS": {
+       "CapacitorNodeJS": {
          "nodeDir": "custom-nodejs"
        }
      }
    }
  }
```

## Capacitor-NodeJS v1.0.0-beta.1

1. Move your NodeJS project from you app's Capacitor webDir to the subfolder `nodejs`. You can skip this step if you set a custom nodeDir in your capacitor configuration. Your project structure should then look something like this:

```
my-capacitor-app/
├── ...
├── src/                    # Capacitor webDir
│   ├── ...
│   ├── nodejs/             # Node.js project directory
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


2. Add `"bridge": "file:../../node_modules/capacitor-nodejs/assets/builtin_modules/bridge"` to `dependencies` in your NodeJS project's package.json file. The file should then look something like this:

```diff
  {
    "name": "capacitor-nodejs-project",
    "version": "1.0.0",
    "main": "./server.js"
    "dependencies": {
+     "bridge": "file:../../node_modules/capacitor-nodejs/assets/builtin_modules/bridge"
    }
  }
```

3. Run `npm install` in your NodeJS project folder to install the added bridge module.
