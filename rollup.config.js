import {terser} from 'rollup-plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

const configNewtonAuth = {
    input: 'dist/newton-auth/index.js',
    output: {
        file: 'dist/newton-auth.min.js',
        format: 'umd',
        name: 'NewtonAuth',
    },
    plugins: [commonjs(), resolve(), json()],
};

if (process.env.NODE_ENV === 'production') {
    configNewtonAuth.plugins.push(terser());
}

export default [configNewtonAuth];
