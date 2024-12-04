const { Kafka } = require('kafkajs');

const BROKERS = [ process.env.KAFKA_SERVERS ];
const activeInstances = [];

const shutdownHandler = require('../util/shutdown.handler');
shutdownHandler(async () => {
    for (let i = 0; i < activeInstances.length; i++) {
        try {
            await activeInstances[i].disconnect();
        } catch (err) {
            console.error(err);
        }
    }
});

exports.GROUP_ID = process.env.KAFKA_GROUP_ID || "scriptengine-js-worker";

exports.TOPIC_SCRIPTENGINE_REQUESTS = "scriptengine-requests"
exports.TOPIC_SCRIPTENGINE_UPDATES = "scriptengine-updates"
exports.TOPIC_MEASUREMENTS = "measurements"

exports.EVENT_REQUEST_MEAS_SAVE_WELLDATA = "requestMeasurementSaveWellData"
exports.EVENT_REQUEST_MEAS_SAVE_SUBWELLDATA = "requestMeasurementSaveSubwellData"

exports.makeConsumer = () => {
    let kafka = new Kafka({ brokers: BROKERS });
    let newConsumer = kafka.consumer({ groupId: exports.GROUP_ID });
    activeInstances.push(newConsumer);
    return newConsumer;
}

exports.makeProducer = () => {
    let kafka = new Kafka({ brokers: BROKERS });
    let newProducer = kafka.producer();
    activeInstances.push(newProducer);
    return newProducer;
}