import builtins from 'rollup-plugin-node-builtins';
import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs'

export default [
  {
    input: 'mediasoup-client',
    output: [{
      file: 'src/libs/mediasoup-client.mjs',
      format: 'es',
    }],
    plugins: [
      builtins(),
      resolve({
        browser: true
      }),
      commonJS({
        include: ['node_modules/**','config.js']
      }),
    ]
  }
];