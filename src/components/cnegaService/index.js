const { List, MessageMedia, Buttons } = require('whatsapp-web.js');
const { validaCpfCnpj, houseMessage, delay, encodeDocEL } = require('../../helpers');
const ContactController = require('../../controllers/ContactUserController');
const cnega = require('./cnegaSearch');

const cnegaService = async (contactUser, msg, contactNumber, nomeAtendente, client, chat) => {

   const tipoDocValido = +contactUser.actual_level === 2 ? validaCpfCnpj(msg.body) : 'insc'

   if (+contactUser.actual_level === 0) {
      delay(2000).then(async function () {
         msg.react('👍');
         await chat.sendStateTyping();
      });

      delay(4000).then(async function () {
         const answer = `Para retirar a certidão negativa é necessário informar o CPF/CNPJ ou a Inscrição municipal, qual opção deseja informar?`
         const options = `\n\n[ *31* ] - CPF/CNPJ\n[ *32* ] - Inscrição municipal`

         const buttons_reply = new Buttons(answer, [{
            body: 'CPF/CNPJ',
            id: 'cpf_cnpj'
         }, {
            body: 'Inscrição municipal',
            id: 'insc_munic'
         }], `${nomeAtendente} - Assistente Virtual 👩🏻‍💻:`, '')

         client.sendMessage(msg.from, buttons_reply);
      });

      await ContactController.update({
         phone_number: contactNumber,
         actual_level: 1,
         service: 'cnega_service'
      });
   }


   if (+contactUser.actual_level === 1) {
      delay(2000).then(async function () {
         msg.react('👍');
         await chat.sendStateTyping();
      });

      const tipoDoc = (msg.selectedButtonId === 'cpf_cnpj' || +msg.body === 11) ? 'seu CPF/CNPJ' : 'sua inscrição municipal'
      const newLevel = (msg.selectedButtonId === 'cpf_cnpj' || +msg.body === 12) ? 2 : 3

      delay(4000).then(async function () {
         chat.clearState();
         const newMessage = houseMessage(`Informe ${tipoDoc}, apenas números *_(sem pontos ou traços)_*:`)
         client.sendMessage(msg.from, newMessage);
      });

      await ContactController.update({
         phone_number: contactNumber,
         actual_level: newLevel,
      });
   }

   else if (+contactUser.actual_level === 2 || +contactUser.actual_level === 3) {

      if (contactUser.bot_action === 'search') {
         delay(1000).then(async function () {
            msg.react('🤔');
            await chat.sendStateTyping();

            delay(2000).then(async function () {
               msg.reply(houseMessage(`Ainda estou pesquisando seus dados, essa pesquisa pode demorar alguns minutos...`));
            });
         });

         return false;
      }

     

      if (tipoDocValido) {

         await ContactController.update({
            phone_number: contactNumber,
            bot_action: 'search',
            document_type: tipoDocValido,
            document_num: msg.body.replace(/[^0-9]/g, ''),
            document_encoder: encodeDocEL(msg.body.replace(/[^0-9]/g, ''))

         });

         delay(500).then(async function () {
            msg.react('👍');
            delay(500).then(async function () {
               const textMessage = +contactUser.actual_level === 2 ?
                  houseMessage(`Aguarde um instante, irei pesquisar a Certidão Negativa pertencentes ao ${tipoDocValido} informado.`) :
                  houseMessage(`Aguarde um instante, irei pesquisar a Certidão Negativa pertencentes a inscrição informada.`)
               msg.reply(textMessage);
            });
         });

         const resultNavegation = await cnega.getByCpfOrCnpj(msg.body, tipoDocValido.toLowerCase())

         if (resultNavegation.status === 500) {
            client.sendMessage(msg.from, houseMessage(resultNavegation.description));
            return false;
         }

         if (resultNavegation.status === 200 && resultNavegation.result === 0) {
            const pathPDF = `./store/cnega/${resultNavegation.description}.pdf`
            const media = await MessageMedia.fromFilePath(pathPDF);
            await client.sendMessage(msg.from, media);
      
            const buttons_reply = new Buttons(`Acima ⬆️⬆️, a Certidão Negativa.`, [{
               body: 'Voltar',
               id: 'reset_service'
            }, {
               body: 'Finalizar',
               id: 'end_service'
            }],)

            client.sendMessage(msg.from, buttons_reply);
            
            return false;
         }

         if (resultNavegation.status === 200 && resultNavegation.result === -1) {
            const listOptionReturn = []

            if (tipoDocValido != 'insc') listOptionReturn.push({id: `view_extract`,body: 'Ver Extrato 📃'})
            listOptionReturn.push({id: 'reset_service', body: 'Nova conulta ♻️'}),
            listOptionReturn.push({id: 'end_service', body: 'Finalizar Atendimento 👋🏼'})
            
            const buttonMessage = new Buttons(houseMessage(resultNavegation.message ?? `Não há Certidão Negativa`),listOptionReturn, '', '')
            client.sendMessage(msg.from, buttonMessage);

            await ContactController.update({
               phone_number: contactNumber,
               actual_level: 4,
            });

         }

      } else {
         delay(2000).then(async function () {
            msg.react('🚫');
            await chat.sendStateTyping();
         });

         delay(4000).then(async function () {
            chat.clearState();
            client.sendMessage(msg.from, `*${nomeAtendente} - Assistente Virtual 👩🏻‍💻:*\n\n❌ *_CPF ou CNPJ inválido!_* ❌\nInforme um CPF/CNPJ *válido*.`);
         });

      }
   }

   else if (+contactUser.actual_level === 4) {

      const documentSearch = contactUser.document_encoder

      if (msg.selectedButtonId === 'view_extract') {

         const puppeteer = require('puppeteer');
         const browser = await puppeteer.launch({
            headless: true,
            args: [
               '--no-sandbox',
               '--disable-setuid-sandbox',
               '--disable-dev-shm-usage',
               '--disable-accelerated-2d-canvas',
               '--no-first-run',
               '--no-zygote',
               '--single-process', // <- this one doesn't works in Windows
               '--disable-gpu'
            ]
         });
         const page = await browser.newPage();

         await page.setViewport({
            width: 800,
            height: 600
         })

         const pathPDF = `./store/extract_general/extrato_${contactUser.document_num}.pdf`
         await page.goto(`http://nfe.pma.es.gov.br:8081/services/extrato_pagamento_impressao.php?s=Y&cd=${contactUser.document_encoder}`);
         await page.pdf({ path: pathPDF, format: 'A4' });
         await browser.close();
         const media = await MessageMedia.fromFilePath(pathPDF);
         await client.sendMessage(msg.from, media);

         await ContactController.update({
            phone_number: contactNumber,
            actual_level: 0,
            service: 'no_service',
            contact_action: null,
            bot_action: '',
         });
      } else if (msg.selectedButtonId === 'reset_service') { //Melhor isso colocar em um função geral
         delay(3000).then(async function () {
            await client.sendMessage(msg.from, houseMessage('Correto, vou lhe apresentar as opções de serviço novamente'));
            delay(1000).then(async function () {
               const list = new List('Abaixo uma lista com nossa serviços, estão me conta como posso ajudar!', 'Serviços', [servicesListWhats])
               await client.sendMessage(msg.from, list);
            });
         });

         await ContactController.update({
            phone_number: contactNumber,
            actual_level: 0,
            service: 'no_service',
            contact_action: null,
            bot_action: '',
         });

      } else if (msg.selectedButtonId === 'end_service') { //Melhor isso colocar em um função geral
         delay(500).then(async function () {
            const chat = await msg.getChat();
            chat.sendStateTyping();
          });
          delay(1000).then(async function () {
            client.sendMessage(msg.from, houseMessage('Agradecemos pelo seu contato e nos colocamos sempre a disposição para melhor lhe atender! 😉'));
          });

         await ContactController.update({
            phone_number: contactNumber,
            actual_level: 0,
            service: 'no_service',
            contact_action: null,
            bot_action: '',
         });
      }

   }
}

module.exports = { cnegaService }




