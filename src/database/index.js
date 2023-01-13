const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const ContactUser = require('../model/Contact');
const Message = require('../model/Message');

const connection = new Sequelize(dbConfig);

ContactUser.init(connection);
Message.init(connection);

module.exports = connection;