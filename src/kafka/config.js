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