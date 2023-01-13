'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('contacts', { 
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      actual_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      service: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      contact_action: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bot_action: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      document_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      document_num: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      document_encoder: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.dropTable('users');

  }
};
