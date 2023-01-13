const { List, MessageMedia, Buttons } = require('whatsapp-web.js');
const { houseMessage } = require('../../helpers');
const ContactController = require('../../controllers/ContactUserController');


const listService = async (contactUser, msg, contactNumber, nomeAtendente, client, chat) => {
   
   /*if (contactUser.actual_level === 0) {
      delay(2000).then(async function () {
         msg.react('👍');
         await chat.sendStateTyping();
      });

      delay(4000).then(async function () {
         const answer = `Para retirar o BCI é necessário informar o CPF/CNPJ ou a Inscrição municipal, qual opção deseja informar?`
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
         service: 'bci_service'
      });
   }

   /*  Opçãoes para os serviços de IPTU*/
   /*else if (contactUser.service === 'bci_service' && +contactUser.actual_level !== 0) {
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

         const tipoDocValido = +contactUser.actual_level === 2 ? validaCpfCnpj(msg.body) : 'insc'

         if (tipoDocValido) {
            await ContactController.update({
               phone_number: contactNumber,
               bot_action: 'search'
            });

            delay(500).then(async function () {
               msg.react('👍');
               delay(500).then(async function () {
                  const textMessage = +contactUser.actual_level === 2 ?
                     houseMessage(`Aguarde um instante, irei pesquisar o BCI pertencentes ao ${tipoDocValido} informado.`) :
                     houseMessage(`Aguarde um instante, irei pesquisar o BCI pertencentes a inscrição informada.`)
                  msg.reply(textMessage);
               });
            });

            const imovelInscricoes = await cnega.getByCpfOrCnpj(msg.body, tipoDocValido.toLowerCase())

            if (imovelInscricoes.status === 500) {
               client.sendMessage(msg.from, houseMessage(imovelInscricoes.description));
               return false;
            }

            if (imovelInscricoes.status === 200 && imovelInscricoes.result !== 0) {
               const totalisacricoes = imovelInscricoes.result.length;
               const messageBci = `Encontrei ${totalisacricoes} inscriç${+totalisacricoes === 1 ? 'ão' : 'ões'}, escolha abaixo o BCI que deseja imprimir`;
               const contentListBci = imovelInscricoes.result.map(itemInscricao => {
                  return {
                     title: `Imóvel: ${itemInscricao.insc}`,
                     id: `${itemInscricao.cd}:${itemInscricao.tpc}:${itemInscricao.insc}`
                  }
               });


               const section = {
                  title: `Esolha o BCI`,
                  rows: contentListBci,
               };

               const list = new List(messageBci, `Ver BCIs 📑`, [section])

               await client.sendMessage(msg.from, list);
               await client.sendMessage(msg.from, `Escolha acima ⬆️⬆️, as inscrições e parcelas que deseja receber. Quando finalizar digite *FIM*, para encerrar o atendimento.`);

               await ContactController.update({
                  phone_number: contactNumber,
                  actual_level: 4,
                  bot_action: 'waiting'
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

         const [cd, tpc, inscr_munic] = msg.selectedRowId.split(':')

         const date = new Date();
         const busca_data = date.toLocaleDateString('pt-BR');

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
            width: 1333,
            height: 786
         })

         const pathPDF = `./store/bci/bci_${inscr_munic}.pdf`
         await page.goto(`http://nfe.pma.es.gov.br:8081/services/consulta_bci_impresso.php?cd=${cd}&tpc=${tpc}`);
         await page.pdf({
            path: pathPDF,
            format: 'A4',
            margin: {
               top: "20px",
               bottom: "40px",
               left: "20px",
               right: "20px"
            }
         });
         await browser.close();
         const media = await MessageMedia.fromFilePath(pathPDF);
         await client.sendMessage(msg.from, media);

      }

   }*/
}

module.exports = { listService }