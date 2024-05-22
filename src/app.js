const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.listen(port, function () {
    console.log('ScriptEngine JS Worker started on port ' + port);
});

const messageConsumer = require('./kafka/message.consumer');
messageConsumer.run();