import builtins from 'rollup-plugin-node-builtins';
import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs'

export default [
  {
    input: 'src/main.mjs',
    output: [{
      file: '../server/static/js.mjs',
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