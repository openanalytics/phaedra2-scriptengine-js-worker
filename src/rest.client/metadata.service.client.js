'use strict';

const axios = require('axios')
const oauth2 = require('../auth/oauth2.client')

module.exports = {

    addProperty: async (measID, propName, propValue) => {
        const url = makeURL('/properties');
        const body = JSON.stringify({
            objectClass: "MEASUREMENT",
            objectId: measID,
            propertyName: propName,
            propertyValue: propValue
        });
        const headers = await buildRequestHeaders();
        const response = await axios.post(url, body, { headers: headers });
    },

    addTag: async (measID, tagValue) => {
        const url = makeURL('/tags');
        const body = JSON.stringify({
            objectClass: "MEASUREMENT",
            objectId: measID,
            tag: tagValue
        });
        const headers = await buildRequestHeaders();
        const response = await axios.post(url, body, { headers: headers });
    }

}

function makeURL(path) {
    const host = process.env.METADATA_SERVICE_HOST || 'http://localhost:3008'
    return `${host}/phaedra/metadata-service${path}`;
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
