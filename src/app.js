const dotenv = require('dotenv');
dotenv.config();

const messageConsumer = require('./kafka/message.consumer');
messageConsumer.run();