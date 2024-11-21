import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js', // Entry point
  output: [
    {
      file: 'dist/lattice.min.js',
      format: 'umd',
      name: 'LatticeLibrary', // Global variable name for UMD builds
      plugins: [terser()],
    },
    {
      file: 'dist/lattice.esm.js',
      format: 'esm', // ESM build for module imports
    },
  ],
  plugins: [
    resolve(), // Resolves node_modules dependencies
    commonjs(), // Converts CommonJS modules to ES6
    terser(), // Minifies the output
  ],
};
