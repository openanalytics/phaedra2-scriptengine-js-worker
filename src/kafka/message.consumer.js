const config = require('./config');
const scriptExecutor = require('../executor/script.executor');
const producer = config.makeProducer();

const handleMessage = async (message) => {
    const scriptRequest = JSON.parse(message.value.toString());
    const scriptLanguage = scriptRequest.language;
    if (scriptLanguage != scriptExecutor.SCRIPT_LANGUAGE_JS) return;
    
    const response = {
        inputId: scriptRequest.id,
        output: null,
        statusCode: null,
        statusMessage: "",
        exitCode: 0
    };

    try {
        console.log(`Invoking script ${scriptRequest.id}`);
        response.output = await scriptExecutor.invokeScript(scriptRequest.script, JSON.parse(scriptRequest.input));
        response.statusCode = "SUCCESS";
    } catch (err) {
        response.statusCode = "SCRIPT_ERROR";
        response.statusMessage = err.toString();
    }

    await producer.send({
        topic: config.TOPIC_SCRIPTENGINE_UPDATES,
        messages: [{
            value: JSON.stringify(response)
        }]
    });
}

module.exports = {
    run: async () => {
        await producer.connect();

        const consumer = config.makeConsumer();
        await consumer.connect();
        await consumer.subscribe({ topic: config.TOPIC_SCRIPTENGINE_REQUESTS, fromBeginning: false });

        await scriptExecutor.initialize();

        scriptExecutor.addExecutorStateCallback(acceptingScripts => {
            // console.log(`Script executor is accepting new invocations? ${acceptingScripts}`);
            if (acceptingScripts) consumer.resume([{ topic: config.TOPIC_SCRIPTENGINE_REQUESTS }]);
            else consumer.pause([{ topic: config.TOPIC_SCRIPTENGINE_REQUESTS }]);
        });
        
        await consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                try {
                    handleMessage(message);
                } catch (err) {
                    console.error(err);
                }
            }
        });
    }
};