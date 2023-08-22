import { join } from 'path';
import copy from 'rollup-plugin-copy'
import dts from "rollup-plugin-dts";

import { version } from '../package.json'

const outputName = "index";

const destinations = [
    "android/src/main/assets/builtin_modules/bridge",
    "electron/assets/builtin_modules/bridge"
]

function generateOutputConfig() {
    const outputConfig = [];

    function generateOutput(outputDest, outputFormat) {
        let ext = "js";
        switch (outputFormat) {
            case "cjs":
            case "commonjs":
                ext = "cjs";
                break;
            case "es":
            case "esm":
            case "module":
                ext = "mjs";
                break;
        }

        return {
            file: join(outputDest, "dist", `${outputName}.${ext}`),
            format: outputFormat,
            sourcemap: 'inline',
            inlineDynamicImports: true
        };
    }

    for (const destination of destinations) {
        const esmOutput = generateOutput(destination, "esm");
        const cjsOutput = generateOutput(destination, "cjs");
        outputConfig.push(esmOutput);
        outputConfig.push(cjsOutput);
    }

    return outputConfig;
}

function generateCopyTargets() {
    const targets = [];

    function generateTarget(outputDest) {
        return {
            src: 'bridge/package.module.json',
            dest: outputDest,
            rename: "package.json",
            transform: contents => contents.toString().replace('__VERSION__', version)
        };
    }

    for (const destination of destinations) {
        const target = generateTarget(destination);
        targets.push(target);
    }

    return targets;
}

export default [
    {
        input: "bridge/build/bridge/src/index.js",
        output: generateOutputConfig(),
        external: ['events', 'process'],
        plugins: [
            copy({ targets: generateCopyTargets() })
        ],
    },
    {
        input: "bridge/build/bridge/src/index.d.ts",
        output: [
            {
                file: `assets/types/bridge/dist/${outputName}.d.ts`,
                format: "esm"
            }
        ],
        external: ['events'],
        plugins: [
            dts(),
            copy({
                targets: [
                    {
                        src: 'bridge/package.types.json',
                        dest: 'assets/types/bridge/',
                        rename: "package.json",
                        transform: contents => contents.toString().replace('__VERSION__', version)
                    }
                ]
            })
        ],
    },
];
