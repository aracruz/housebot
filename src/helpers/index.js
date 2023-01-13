const {
	getGreetings,
	getRegards,
	startMessage,
	setGreeting
} = require('./greetings');

const {
	houseMessage
} = require('./houseMessage');

const {
	getByCpfOrCnpj
} = require('../components/iptuService/iptuSearch');

const {
	validaCpf,
	validaCnpj,
	validaCpfCnpj
} = require('./validity');



function waitFor(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve.bind(null, v), time)
	});
}

function delay(t, v) {
	return new Promise(function (resolve) {
		setTimeout(resolve.bind(null, v), t)
	});
}

function encodeDocEL(doc, code = 69) {
	return ((doc.replace(/[^0-9]/g, '').split('')).map(index => String.fromCharCode(+index + code))).reverse().join('');
}

module.exports = {
	getGreetings,
	getRegards,
	startMessage,
	setGreeting,
	houseMessage,
	getByCpfOrCnpj,
	validaCpf,
	validaCnpj,
	validaCpfCnpj,
	waitFor,
	delay,
	encodeDocEL
};