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
'use strict';

const axios = require('axios')
const oauth2 = require('../auth/oauth2.client')

const kafkaConfig = require('../kafka/config');
const kafkaProducer = kafkaConfig.makeProducer();
kafkaProducer.connect();

module.exports = {

    createMeasurement: async (measurement) => {
        const measBody = structuredClone(measurement);
        delete measBody.properties;

        const url = makeURL('/measurements');
        const headers = await buildRequestHeaders();
        const response = await axios.post(url, JSON.stringify(measBody), { headers: headers });
        measurement.id = response.data.id;
    },

    updateMeasurement: async (measurement) => {
        const measBody = structuredClone(measurement);
        delete measBody.properties;

        const url = makeURL(`/measurements/${measurement.id}`);
        const headers = await buildRequestHeaders();
        const response = await axios.put(url, JSON.stringify(measBody), { headers: headers });
        measurement.id = response.data.id;
    },

    deleteMeasurement: async (measurementId) => {
        const url = makeURL(`/measurements/${measurementId}`);
        const headers = await buildRequestHeaders();
        await axios.delete(url, { headers: headers });
    },

    saveImageData: async (measId, wellNr, channelId, imageData) => {
        console.log(`Uploading imageData for meas ${measId}, well ${wellNr}, channel ${channelId}: ${imageData.length} bytes`);
        const url = makeURL(`/measurements/${measId}/imagedata/${wellNr}/${channelId}`);
        const headers = await buildRequestHeaders(true);
        await axios({
            method: 'POST',
            url: url,
            data: imageData,
            headers: headers
        });
    },

    saveWellData: async (measurementId, columnName, values) => {
        const body = {
            measurementId: measurementId,
            column: columnName,
            data: values
        };
        await kafkaProducer.send({
            topic: kafkaConfig.TOPIC_MEASUREMENTS,
            messages: [
                { key: kafkaConfig.EVENT_REQUEST_MEAS_SAVE_WELLDATA, value: JSON.stringify(body) }
            ]
        });
    },

    saveSubWellData: async (measId, wellNr, dataMap) => {
        const url = makeURL(`/measurements/${measId}/subwelldata/well/${wellNr}`);
        const body = JSON.stringify(dataMap);
        const headers = await buildRequestHeaders();
        await axios.post(url, body, { headers: headers });
    },
    
    saveSubWellDataAsync: async (measurementId, wellNr, columnName, values) => {
        const body = {
            measurementId: measurementId,
            wellNr: wellNr,
            column: columnName,
            data: values
        };
        await kafkaProducer.send({
            topic: kafkaConfig.TOPIC_MEASUREMENTS,
            messages: [
                { key: kafkaConfig.EVENT_REQUEST_MEAS_SAVE_SUBWELLDATA, value: JSON.stringify(body) }
            ]
        });
    }
}

function makeURL(path) {
    const host = process.env.MEASUREMENT_SERVICE_HOST || 'http://localhost:3008'
    return `${host}/phaedra/measurement-service${path}`;
}

async function buildRequestHeaders(isBinary) {
    const token = await oauth2.getAccessToken();
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + token
    };
    if (isBinary) headers['Content-Type'] = 'application/octet-stream';
    return headers;
}
