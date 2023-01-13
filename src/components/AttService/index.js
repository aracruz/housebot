const { List, MessageMedia, Buttons } = require('whatsapp-web.js');
const { houseMessage, delay } = require('../../helpers');
const ContactController = require('../../controllers/ContactUserController');

const AttService = async (contactUser, msg, client ) => {
   const attServicesList = {
      title: 'Escolha o assunto ou serviço:',
      rows: [
         {
            title: 'Falar com atendimento Geral',
            id: 'sendto_atendimento_geral'
         },
         {
            title: 'Falar sobre IPTU',
            id: 'sendto_imobiliaria_iptu'
         },
         {
            title: 'Setor Imobiliária',
            id: 'sendto_imobiliaria'
         },
         {
            title: 'Setor Geoprocessamento',
            id: 'sendto_geo'
         },
         {
            title: 'Setor Dívida Ativa',
            id: 'sendto_da'
         },
         {
            title: 'Falar sobre transferência de imóvel',
            id: 'sendto_itbi'
         },
         {
            title: 'Setor ITBI',
            id: 'sendto_itbi'
         },
         {
            title: 'Setor Mobiliário',
            id: 'sendto_mob'
         },
         {
            title: 'Setor Nota Fiscal Eletrônica',
            id: 'sendto_nfe'
         },
         {
            title: 'PAV - Receita Federal',
            id: 'sendto_pav'
         },
         {
            title: 'Setor Produtor Rural',
            id: 'sendto_prural'
         },
      ],
   };

   const contactNumber = msg.id.remote.split('@')[0];
   const nomeContato = msg._data.notifyName;
   
   if (contactUser.actual_level === 0) {

      await ContactController.update({
         phone_number: contactNumber,
         actual_level: 1,
         service: 'att_services_list'
      });

      delay(3000).then(async function () {
         const list = new List(houseMessage('Entendi, para facilitar o atendimento escolha, o setor ou o assunto que deseja falar com o atendente.'), 'Serviços', [attServicesList])
         await client.sendMessage(msg.from, list);
      });

      return false;
   } else {
      let numberToSand = null;
      let sector = null;

      switch (msg.selectedRowId) {
         case 'sendto_atendimento_geral':
            numberToSand = '5527997583314@c.us' // Mudar isso para um .env
            sector = 'Atendimento Geral';
            break;

         case 'sendto_imobiliaria_iptu':
         case 'sendto_imobiliaria':
            numberToSand = '552732707951@c.us';
            sector = 'Setor Imobiliária';
            break;

         case 'sendto_geo':
            numberToSand = '552732707950@c.us';
            sector = 'Setor Geoprocessamento';
            break;

         case 'sendto_da':
            numberToSand = '552732707955@c.us';
            sector = 'Setor Dívida Ativa';
            break;

         case 'sendto_itbi':
            numberToSand = '5527997583314@c.us' // Lembrar de cadastrar o numero do ITBI
            sector = 'Setor de ITBI';
            break;

         case 'sendto_mob':
            numberToSand = '5527997583314@c.us' // Lembrar de cadastrar o numero do MOB
            sector = 'Setor de cadastro Mobiliária';
            break;

         case 'sendto_nfe':
            numberToSand = '5527997583314@c.us' // Lembrar de cadastrar o numero do NFE
            sector = 'Setor de Nota fiscal Eletrônica';
            break;

         case 'sendto_pav':
            numberToSand = '552799831-3326@c.us'
            sector = 'Ponto de Atendimento Virtual da Receita Federal';
            break;

         case 'sendto_prural':
            numberToSand = '5527998313326@c.us'
            sector = 'Setor de Produto Rural';
            break;

         default:
            numberToSand = '5527997583314@c.us' // Mudar isso para um .env
            sector = 'Atendimento Geral';
            break;
      }

      await client.sendMessage(
         numberToSand,
         houseMessage(`Um contribuinte deseja falar diretamente com o ${sector}:\nNome:${nomeContato} \nTelefone:${contactNumber} `)
      );

      delay(3000).then(async function () {
         await client.sendMessage(
            msg.from,
            houseMessage(`Transferir seu atendimento e avisei ao ${sector} que você deseja falar com atendete; Em instantes um atendente entrar com contato.`));
      });

      //abrir um atendomento para o contribuinte no setor desejado 
      await ContactController.update({
         phone_number: contactNumber,
         actual_level: 0,
         service: 'no_service'
      });

   }


}

module.exports = { AttService }