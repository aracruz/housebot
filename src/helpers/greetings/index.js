const getGreetings = () => {
    var greetings = ['Boa madrugada 🌌', 'Bom dia 🌇,', 'Boa tarde 🌆,', 'Boa noite 🌃'];
    let h = new Date().getHours();
    return greetings[(h / 6) >> 0];
}

const getRegards = (nomeContato) => {
    const first_part = [`${getGreetings()}`, 'Olá', 'Oi', 'Ei']
    const second_part = ['tudo bem?', 'como vai você?', 'tudo certo?', 'como vão as coisas?']

    const message = {
        first: first_part[Math.floor(Math.random() * first_part.length)],
        second: second_part[Math.floor(Math.random() * second_part.length)]
    }

    return `${message.first} ${nomeContato}, ${message.second}`
}

const startMessage = (empresa, nomeAtendente) => {
    const optionMessage = [
        `Seja bem-vindo a *${empresa}*! Meu nome é *${nomeAtendente}*, irei fazer o seu atendimento.`,
        `Seja muito Bem-vindo a *${empresa}*! Me chamo *${nomeAtendente}* e vou realizar o seu atendimento.`,
        `Você está falando com o *${nomeAtendente}* da *${empresa}*.` //Em que posso ajudar?
    ]

    return optionMessage[Math.floor(Math.random() * optionMessage.length)]
}

function setGreeting(nomeContato, empresa, nomeAtendente) {
    return `${getRegards(nomeContato)} ${startMessage(empresa, nomeAtendente)}`
}

module.exports = {
    getGreetings,
    getRegards,
    startMessage,
    setGreeting
}