const { Model, DataTypes } = require('sequelize');

class Message extends Model {
    static init(sequelize) {
        super.init({
            question: DataTypes.STRING,
            answer: DataTypes.STRING,
            level: DataTypes.INTEGER,
        }, {
            sequelize,
        });

    }
}

module.exports = Message