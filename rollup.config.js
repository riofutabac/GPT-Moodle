const ts = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const config = require('./tsconfig.json');

module.exports = [
  {
    input: './src/background/index.ts',
    output: {
      file: './extension/MoodleGPT.js',
      format: 'iife',
      name: 'moodleGptBackground',
      sourcemap: true
    },
    plugins: [nodeResolve({ browser: true }), commonjs(), ts(config.compilerOptions), terser()]
  },
  {
    input: './src/popup/index.ts',
    output: {
      file: './extension/popup/popup.js',
      format: 'iife',
      name: 'moodleGptPopup',
      sourcemap: true
    },
    plugins: [nodeResolve({ browser: true }), commonjs(), ts(config.compilerOptions), terser()]
  }
];
