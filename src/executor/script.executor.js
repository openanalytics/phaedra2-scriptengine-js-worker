const vm = require('node:vm');

let activeInvocationCount = 0;
const executorStateCallbacks = [];
const scriptExecutorCapacity = parseInt(process.env.EXECUTOR_CAPACITY || 4);

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