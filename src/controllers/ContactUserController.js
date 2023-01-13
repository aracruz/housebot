const ContactUser = require('../model/Contact');

module.exports = {
    async index() {
        const contact = await ContactUser.findAll();
        return contact.json(contact);
    },

    async show({ phone_number }) {
        // const contact = await Contact.findOne({ where: { phone_number } });

        const [contact, created] = await ContactUser.findOrCreate({
            where: { phone_number },
            defaults: {
                actual_level: 0
            }
        });

        return contact;
    },

    async store({ name, phone_number, actual_level }) {
        const contact = await ContactUser.create({ name, phone_number, actual_level })
        return contact;
    },

    async update(fields) {
        const {phone_number, ...updatefields}  = fields
        
        /*{ phone_number, actual_level, service, contact_action, bot_action }
        if (service) {
            dataUpdate = { actual_level, service, contact_action, bot_action }
        }*/

        const contact = await ContactUser.update(updatefields, {
            where: { phone_number }
        });

        return contact;
    }
};