const Message = require('../model/Message');

module.exports = {
    async index() {
        const message = await Message.findAll();
        return message;
    },

    async show({ level }) {
        console.log(level);
        const message = await Message.findAll ({ where: { level: level } });
        return message;
    },

    /*async store({ name, phone_number, actual_level }) {
        const contact = await Contact.create({ name, phone_number, actual_level })
        return contact;
    }*/
};