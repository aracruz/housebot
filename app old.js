require('./src/database');

const moment = require('moment');

const {
  Client,
  LocalAuth,
  List,
  MessageMedia,
  Buttons
} = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');

const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const ContactController = require('./src/controllers/ContactUserController');
const {
  validaCpfCnpj,
  houseMessage,
  setGreeting,
} = require('./src/helpers');

const { inflate } = require('zlib');
const { iptuService } = require('./src/components/iptuService')
const { tmrsService } = require('./src/components/tmrsService')
const { cnegaService } = require('./src/components/cnegaService')
const { bciService } = require('./src/components/bciService')
const { AttService } = require('./src/components/AttService')





















//configurações Gerais
const empresa = 'Casa do Cidadão de Aracruz';
const nomeAtendente = 'Barbara';
const servicesListWhats = {
  title: 'Serviços',
  rows: [
    {
      title: 'Certidão Negativa',
      id: 'cnega_service'
    },
    {
      title: 'Segunda via do IPTU',
      id: 'iptu_service'
    },
    {
      title: 'Segunda via da TMRS',
      id: 'tmrs_service'
    },
    {
      title: 'Dívida Ativa',
      id: 'divida_ativa_service'
    },
    {
      title: 'Carne ISS Mensal',
      id: 'iss_mensal_service'
    },
    {
      title: 'ISS Fixo 2003',
      id: 'iss_fixo_service'
    },
    {
      title: 'Taxa de Publicidade 2003',
      id: 'taxa_public_service'
    },
    {
      title: 'Boletim de Cadastro Imobiliário - BCI',
      id: 'bci_service'
    },

    {
      title: 'Falar com um atendente',
      description: 'Ver lista completa dos serviços e atendimentos.',
      id: 'att_services_list',
    }
  ],
};













































function delay(t, v) {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, v), t)
  });
}

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(fileUpload({
  debug: true
}));
app.use("/", express.static(__dirname + "/"))

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'housebot'
  }),
  puppeteer: {
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
  }
});

client.initialize();

io.on('connection', function (socket) {
  socket.emit('message', '© BOT-ZDG - Iniciado');
  socket.emit('qr', './icon.svg');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', '© BOT-ZDG QRCode recebido, aponte a câmera  seu celular!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', '© BOT-ZDG Dispositivo pronto!');
    socket.emit('message', '© BOT-ZDG Dispositivo pronto!');
    socket.emit('qr', './check.svg')
    console.log('© BOT-ZDG Dispositivo pronto');
  });

  client.on('authenticated', () => {
    socket.emit('authenticated', '© BOT-ZDG Autenticado!');
    socket.emit('message', '© BOT-ZDG Autenticado!');
    console.log('© BOT-ZDG Autenticado');
  });

  client.on('auth_failure', function () {
    socket.emit('message', '© BOT-ZDG Falha na autenticação, reiniciando...');
    console.error('© BOT-ZDG Falha na autenticação');
  });

  client.on('change_state', state => {
    console.log('© BOT-ZDG Status de conexão: ', state);
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', '© BOT-ZDG Cliente desconectado!');
    console.log('© BOT-ZDG Cliente desconectado', reason);
    client.initialize();
  });
});

client.on('message', async msg => {
  console.log('MESSAGE RECEIVED', msg);

  const contactNumber = msg.id.remote.split('@')[0];
  const nomeContato = msg._data.notifyName;
  const user = msg.from.replace(/\D/g, '');
  const chat = await msg.getChat();

  const contactUser = await ContactController.show({
    phone_number: contactNumber,
  });
  const finalizaAtendimento = (lastUpdate) => {
    delay(1000).then(async function () {
      const Minutes = moment.duration(moment(new Date()).diff(moment(lastUpdate))).asMinutes();
      if (Minutes > 1) {
        const ActualContactUser = await ContactController.show({
          phone_number: contactNumber,
        });
        if (+ActualContactUser.actual_level !== 0) {
          client.sendMessage(msg.from, houseMessage(`Estou finalizado seu atendimento, porém, estou aqui caso precise de um novo serviço. Agradecemos pelo seu contato e nos colocamos sempre à disposição para melhor lhe atender! 😉`),);
          await ContactController.update({
            phone_number: contactNumber,
            actual_level: 0,
          });
        } else {
          finalizaAtendimento(ActualContactUser.updated_at)
        }
      }
    });
  }

  if (msg.type.toLowerCase() == "e2e_notification") return null;

  if (msg.body === "" && msg.type.toLowerCase() == "call_log") {
    delay(1000).then(async function () {
      const chat = await msg.getChat();
      chat.sendStateTyping();
    });
    delay(4000).then(async function () {
      client.sendMessage(msg.from, "Chamada de audio e video estão desativadas para este whatsapp");
    });
  }

  if (msg.body === "") return null;

  if (msg.selectedButtonId === 'end_service' || msg.body.toLowerCase().includes('sair') || msg.body.toLowerCase().includes('fim')) {
    await ContactController.update({
      phone_number: contactNumber,
      actual_level: 0,
      service: 'no_service',
      bot_action: 'no_action'

    });

    delay(500).then(async function () {
      const chat = await msg.getChat();
      chat.sendStateTyping();
    });
    delay(1000).then(async function () {
      client.sendMessage(msg.from, houseMessage('Agradecemos pelo seu contato e nos colocamos sempre a disposição para melhor lhe atender! 😉'));
    });

    return false;
  }

  if (msg.selectedRowId === 'iptu_service' || +msg.body === 1 || contactUser.service === 'iptu_service') {
    iptuService(contactUser, msg, contactNumber, nomeAtendente, client, chat)
  }

  else if (msg.selectedRowId === 'tmrs_service' || +msg.body === 2 || contactUser.service === 'tmrs_service') {
    tmrsService(contactUser, msg, contactNumber, nomeAtendente, client, chat)
  }

  else if (msg.selectedRowId === 'cnega_service' || +msg.body === 3 || contactUser.service === 'cnega_service') {
    cnegaService(contactUser, msg, contactNumber, nomeAtendente, client, chat)
  }

  else if (msg.selectedRowId === 'bci_service' || +msg.body === 4 || contactUser.service === 'bci_service') {
    bciService(contactUser, msg, contactNumber, nomeAtendente, client, chat)
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  //Liste de atendimentos 
  else if (msg.selectedRowId === 'att_services_list' || contactUser.service === 'att_services_list') {
  //else if (msg.selectedRowId === 'list_service' || +msg.body === 99 || contactUser.service === 'list_service') {
    const chat = await msg.getChat();
    AttService(contactUser, msg, contactNumber, nomeAtendente, client, chat)



    //' attServicesList



    /*const msgButtonId = msg.selectedButtonId || '';

    if ((+contactUser.actual_level === 99 && contactUser.service === 'service_finished')) {
      await ContactController.update({
        phone_number: contactNumber,
        actual_level: 0,
      });

      if (msg.selectedButtonId === 'reset_service' || msg.body.toLowerCase === 'voltar' || +msg.body === 0) {
        delay(3000).then(async function () {
          await client.sendMessage(msg.from, houseMessage('Correto, vou lhe apresentar as opções de serviço novamente'));
          delay(1000).then(async function () {
            const list = new List('Abaixo uma lista com nossa serviços, estão me conta como posso ajudar!', 'Serviços', [sectorsList])
            await client.sendMessage(msg.from, list);
          });
        });

        return false;
      }

      if (msgButtonId.includes('callTo') || +msg.body === 100) {

        if (contactUser.contact_action === 'consultation_stci') {
          const numberToCall = '5527997576375' + "@c.us";

          await client.sendMessage(
            numberToCall,
            houseMessage(`Um contribuinte deseja falar diretamente com o setor de cadastro imobiliário:\nNome:${nomeContato} \nTelefone:${contactNumber} `));


          delay(3000).then(async function () {
            await client.sendMessage(
              msg.from,
              houseMessage(`Avisei aos atendentes do setor de cadastro imobiliário que você deseja falar com eles, em instantes um atendente do setor entrar com contato com você usando esse mesmo via de comunicação ou pelo número (27) 3270-7951.`));
          });
        }
        return false;
      }
    }

    delay(2000).then(async function () {
      await chat.sendStateTyping();
    });

    delay(4000).then(async function () {
      const media = await MessageMedia.fromFilePath('./src/assets/images/barbara.jpg');
      await client.sendMessage(msg.from, media, {
        caption: setGreeting(nomeContato, empresa, nomeAtendente)
      });

      delay(1000).then(async function () {
        const list = new List('Abaixo há uma lista de serviços, estão me conta como posso ajudar!', 'Serviços', [servicesList])
        await client.sendMessage(msg.from, list);
      });
    });*/
  }









































  /*  Opçãoes Geral */
  else {
    
    const chat = await msg.getChat();
    const msgButtonId = msg.selectedButtonId || '';

    if ((+contactUser.actual_level === 99 && contactUser.service === 'service_finished')) {
      await ContactController.update({
        phone_number: contactNumber,
        actual_level: 0,
      });

      if (msg.selectedButtonId === 'reset_service' || msg.body.toLowerCase === 'voltar' || +msg.body === 0) {
        delay(3000).then(async function () {
          await client.sendMessage(msg.from, houseMessage('Correto, vou lhe apresentar as opções de serviço novamente'));
          delay(1000).then(async function () {
            const list = new List('Abaixo uma lista com nossa serviços, estão me conta como posso ajudar!', 'Serviços', [servicesListWhats])
            await client.sendMessage(msg.from, list);
          });
        });

        return false;
      }

      if (msgButtonId.includes('callTo') || +msg.body === 100) {

        if (contactUser.contact_action === 'consultation_stci') {
          const numberToCall = '5527997576375' + "@c.us";

          await client.sendMessage(
            numberToCall,
            houseMessage(`Um contribuinte deseja falar diretamente com o setor de cadastro imobiliário:\nNome:${nomeContato} \nTelefone:${contactNumber} `));


          delay(3000).then(async function () {
            await client.sendMessage(
              msg.from,
              houseMessage(`Avisei aos atendentes do setor de cadastro imobiliário que você deseja falar com eles, em instantes um atendente do setor entrar com contato com você usando esse mesmo via de comunicação ou pelo número (27) 3270-7951.`));
          });
        }
        return false;
      }
    }

    delay(2000).then(async function () {
      await chat.sendStateTyping();

      delay(4000).then(async function () {
        const media = await MessageMedia.fromFilePath('./src/assets/images/barbara.jpg');
        await client.sendMessage(msg.from, media, {
          caption: setGreeting(nomeContato, empresa, nomeAtendente)
        });

        delay(1000).then(async function () {
          const list = new List('Abaixo há uma lista de serviços, estão me conta como posso ajudar!', 'Serviços', [servicesListWhats])
          await client.sendMessage(msg.from, list);


          await client.sendMessage(msg.from, media, list);
        });
      });
    });
  }
});


server.listen(port, function () {
  console.log('App running on *: ' + port);
});

//🙋