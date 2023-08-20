export default {
  input: 'electron/build/electron/src/index.js',
  output: [
    {
      file: 'electron/dist/plugin.js',
      format: 'cjs',
      sourcemap: 'inline',
      inlineDynamicImports: true,
    },
  ],
  external: ['@capacitor/core', 'child_process', 'electron', 'events', 'path', 'fs' ],
};
