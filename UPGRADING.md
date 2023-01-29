## Capacitor-NodeJS v1.0.0-beta.1

1. Move your NodeJS project from you app's source directory to the subfolder `nodejs`. You can skip this step if you set a custom nodeDir in your capacitor configuration. Your project structure should then look something like this:
  ```
  my-capacitor-app/
  ├── ...
  ├── src/                    # app source directory
  │   ├── ...
  │   ├── nodejs/             # NodeJS project directory
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

3. Run `npm install` in your NodeJS project folder to install the added bridge module.
