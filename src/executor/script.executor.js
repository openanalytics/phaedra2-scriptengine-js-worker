/*
 * Phaedra II
 * 
 * Copyright (C) 2016-2025 Open Analytics
 * 
 * ===========================================================================
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Apache License as published by
 * The Apache Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * Apache License for more details.
 * 
 * You should have received a copy of the Apache License
 * along with this program.  If not, see <http://www.apache.org/licenses/>
 */
const vm = require('node:vm');

let activeInvocationCount = 0;
const executorStateCallbacks = [];
const scriptExecutorCapacity = parseInt(process.env.EXECUTOR_CAPACITY || 4);
const startupScriptURL = process.env.STARTUP_SCRIPT_URL;

const defaultScriptContext = {
    console: console,
    require: require,
    measurementService: require('../client/measurement.service.client'),
    metadataService: require('../client/metadata.service.client'),
    s3: require('../context/s3.api'),
    sourcePathUtils: require('../context/source.path.utils'),
    plateUtils: require('../context/plate.utils'),
    imageCodec: require('../context/image.codec.jp2k'),
    imageIdentifier: require('../context/image.identifier'),
    queueManager: require('../util/microqueue')
};

const updateExecutorState = (newActiveInvocationCount) => {
    if (activeInvocationCount < scriptExecutorCapacity && newActiveInvocationCount == scriptExecutorCapacity) {
        // Limit reached
        executorStateCallbacks.forEach(cb => cb(false));
    } else if (activeInvocationCount == scriptExecutorCapacity && newActiveInvocationCount < scriptExecutorCapacity) {
        // Room is available again
        executorStateCallbacks.forEach(cb => cb(true));
    }
    activeInvocationCount = newActiveInvocationCount;
};

exports.SCRIPT_LANGUAGE_JS = "JS";

exports.addExecutorStateCallback = (callback) => {
    executorStateCallbacks.push(callback);
};

exports.initialize = async () => {
    if (startupScriptURL) {
        const scripts = (await defaultScriptContext.s3.list(startupScriptURL)).filter(script => script.toLowerCase().endsWith(".js")).sort();
        console.log(`Running ${scripts.length} startup script(s) from ${startupScriptURL}`);
        for (const script of scripts) {
            console.log(`Invoking startup script: ${script}`);
            try {
                const scriptBody = await defaultScriptContext.s3.getAsString(script);
                exports.invokeScript(scriptBody);
            } catch (err) {
                console.error(err);
            }
        }
    }
};

exports.invokeScript = async (script, context) => {
    updateExecutorState(activeInvocationCount + 1);
    try {
        const ctx = { ...defaultScriptContext, ...(context || {})};
        ctx.output = null;
        ctx.executionPromise = null;

        // Wrap in async function and return a promise, so the script itself can use async code too.
        const wrappedCode = "wrapper = (async () => { " + script + " }); executionPromise = wrapper();";

        vm.createContext(ctx);
        vm.runInContext(wrappedCode, ctx);
        await ctx.executionPromise;

        if (ctx.output == null) {
            // If no explicit output was provided, return the original context (which may have been modified by the script).
            ctx.output = context;
        }

        return ctx.output;
    } finally {
        updateExecutorState(activeInvocationCount - 1);
    }
}