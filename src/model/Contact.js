const { Model, DataTypes } = require('sequelize');

class Contact extends Model {
    static init(sequelize) {
        super.init({
            name: DataTypes.STRING,
            phone_number: DataTypes.STRING,
            actual_level: DataTypes.INTEGER,
            service: DataTypes.STRING,
            contact_action: DataTypes.STRING,
            bot_action: DataTypes.STRING,
            document_type: DataTypes.STRING,
            document_num: DataTypes.STRING,
            document_encoder: DataTypes.STRING,
        }, {
            sequelize,
        });

    }
}

module.exports = Contact;