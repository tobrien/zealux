/* eslint-disable no-console */
import { transform } from '@babel/core';
// eslint-disable-next-line import/extensions
import * as Zealux from './dist/zealux.js';

export default {
    "globals": {
        "exports": {
            "Zealux": Zealux
        },
        "console": {
            "log": console.log,
            "error": console.error,
            "warn": console.warn,
            "info": console.info,
            "debug": console.debug
        }
    },
    "require": {
        '@tobrien/zealux': Zealux
    },
    transformCode: (code) => {
        // transform the code using @bable/preset-typescript
        const transformedCode = transform(code, {
            filename: 'test.ts',
            presets: ['@babel/preset-typescript'],
            plugins: [
                '@babel/plugin-transform-typescript',
                '@babel/plugin-transform-modules-commonjs'
            ],
            comments: true // Preserve comments
        })?.code;

        return transformedCode;
    }
}