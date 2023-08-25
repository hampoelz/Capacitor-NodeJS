import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'electron/build/electron/src/index.js',
  output: [
    {
      file: 'electron/dist/plugin.js',
      format: 'cjs',
      sourcemap: 'inline',
      inlineDynamicImports: true,
      exports: 'default',
    },
  ],
  external: [
    '@capacitor/core',
    'child_process',
    'electron',
    'events',
    'path',
    'fs',
  ],
  plugins: [
    nodeResolve(),
    commonjs({
      ignoreDynamicRequires: true,
      dynamicRequireTargets: [
        'node_modules/capacitor-nodejs/electron/dist/plugin.js',
      ],
    }),
  ],
};
