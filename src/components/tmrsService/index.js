const { List, MessageMedia, Buttons } = require('whatsapp-web.js');
const { validaCpfCnpj, houseMessage, delay } = require('../../helpers');
const ContactController = require('../../controllers/ContactUserController');
const tmrs = require('./tmrsSearch');

const tmrsService = async (contactUser, msg, contactNumber, nomeAtendente, client, chat) => {
   
   if (true) {
      delay(2000).then(async function () {
         msg.react('⚠️');
         await chat.sendStateTyping();

         delay(2000).then(async function () {
            const buttons_reply = new Buttons(houseMessage(`*ATENÇÃO:*\nO *Taxa de Manejo de Resíduos Sólidos 2023* ainda não está disponível, em caso de dúvida entre em contato com setor de cadastro imobiliário.\nPara pagar o *Taxa de Manejo de Resíduos Sólidos 2022* entre em contado com o setor de divida ativa.`), [{
               body: 'Voltar',
               id: 'reset_service'
            }, {
               body: 'Finalizar',
               id: 'end_service'
            }],)

            client.sendMessage(msg.from, buttons_reply);
         });
      });
      return;
   }

   if (contactUser.actual_level === 0) {
      delay(2000).then(async function () {
         msg.react('👍');
         await chat.sendStateTyping();
      });

      delay(4000).then(async function () {
         const answer = `Para ver o TMRS 2022, é necessário informar o CPF/CNPJ ou a Inscrição municipal, qual opção deseja informar?`
         const options = `\n\n[ *11* ] - CPF/CNPJ\n[ *12* ] - Inscrição municipal`

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
         service: 'tmrs_service'
      });
   }

   /*  Opçãoes para os serviços de TMRS*/
   else if (contactUser.service === 'tmrs_service' && +contactUser.actual_level !== 0) {
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
                     houseMessage(`Aguarde um instante, irei pesquisar as inscrições pertencentes ao ${tipoDocValido} informado.`) :
                     houseMessage(`Aguarde um instante, irei pesquisar a inscrição informada.`)
                  msg.reply(textMessage);
               });
            });

            const imovelInscricoes = await (async () => {
               let tatativasNavegar = 1
               while (tatativasNavegar <= 10) {
                  const resultNavegation = await tmrs.getByCpfOrCnpj(msg.body, tipoDocValido.toLowerCase())
                  if (resultNavegation.status !== 500) {
                     return resultNavegation
                  } -
                     tatativasNavegar++;
               }
               return resultNavegation
            })();

            if (imovelInscricoes.status === 500) {
               client.sendMessage(msg.from, houseMessage(imovelInscricoes.description));
               return false;
            }

            if (imovelInscricoes.status === 200 && imovelInscricoes.result === 0) {
               //const textMessage = houseMessage()
               // +55 (27) 3270-7951
               const buttonMessage = new Buttons(
                  +contactUser.actual_level === 2 ?
                     houseMessage(`Não identifiquei, no meu sistema, parcela de IPTU lançada ou em aberto para o ${tipoDocValido}, caso tenha alguma dúvida, você pode entrar em contato com setor de cadastro imobiliário.`) :
                     houseMessage(`Não identifiquei, no meu sistema, parcela de IPTU lançada ou em aberto para essa inscrição, caso tenha alguma dúvida, você pode entrar em contato com setor de cadastro imobiliário.`),
                  [{
                     id: 'callTo_stci',
                     body: 'Falar com cadastro imobiliário 🏠'
                  },
                  {
                     id: 'reset_service',
                     body: 'Nova conulta ♻️'
                  },
                  {
                     id: 'end_service',
                     body: 'Finalizar Atendimento 👋🏼'
                  },
                  ], '', '')
               client.sendMessage(msg.from, buttonMessage);

               await ContactController.update({
                  phone_number: contactNumber,
                  actual_level: 99,
                  service: 'service_finished',
                  bot_action: 'waiting',
                  contact_action: 'consultation_stci'
               });

               return false;
            }

            if (imovelInscricoes.status === 200 && imovelInscricoes.result !== 0) {
               const totalisacricoes = imovelInscricoes.result.length;

               client.sendMessage(msg.from, `Encontrei ${totalisacricoes} inscriç${+totalisacricoes === 1 ? 'ão' : 'ões'}, escolha abaixo a inscrição e a parcela que deseja imprimir  `);

               await imovelInscricoes.result.forEach(async (itemInscricao) => {
                  const parcelas = itemInscricao.parcela.map(parcela => {
                     return {
                        title: `Parcela: ${parcela}`,
                        id: `${parcela}:${itemInscricao.inscricao}:${itemInscricao.codigo_cnt}:${tipoDocValido.toLocaleLowerCase()}:${itemInscricao.inscr_munic}`
                     }
                  })

                  const section = {
                     title: `*Imóvel* : ${itemInscricao.inscr_munic}`,
                     rows: parcelas,
                  };

                  const list = new List(`*Imóvel* : ${itemInscricao.inscr_munic}\n*Endereço* : ${itemInscricao.endereco}`, `Ver parcelas 🧾`, [section])

                  await client.sendMessage(msg.from, list);
               });

               await client.sendMessage(msg.from, `Escolha acima ⬆️⬆️, as inscrições e parcelas que deseja receber. Quando finalizar digite *FIM*, para encerrar o atendimento.`);

               await ContactController.update({
                  phone_number: contactNumber,
                  actual_level: 4,
                  bot_action: 'waiting'
               });

               //finalizaAtendimento(ActualContactUser.updated_at)
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

         const [busca_pcarcela, busca_insc, busca_cnt, busca_tp, inscr_munic] = msg.selectedRowId.split(':')

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

         const pathPDF = `./store/boleto_tmrs/${inscr_munic}_${busca_pcarcela}.pdf`
         await page.goto(`http://nfe.pma.es.gov.br:8081/services/lancamento_diversos_boleto.php?parcela=${busca_pcarcela}&inscricao=${busca_insc}&agrupamento=HEE&tipo_inscricao=FE&data_venc=${busca_data}&codigo_cnt=${busca_cnt}&tp=${busca_tp}`);
         await page.pdf({ path: pathPDF, format: 'A4' });
         await browser.close();
         const media = await MessageMedia.fromFilePath(pathPDF);
         await client.sendMessage(msg.from, media);

      }
   }
}

module.exports = { tmrsService }