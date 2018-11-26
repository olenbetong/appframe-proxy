const express = require('express');
const minimist = require('minimist');
const readline = require('readline-sync');
const args = minimist(process.argv.slice(2));
const app = express();
const proxyFactory = require('./middleware');

function getOptions(provided = {}) {
	const options = {
		port: 8082,
		...provided,
	};
	
	if (!options.username) {
		if (args.username || args.login || args.user) {
			options.username = args.username || args.login || args.user;
		} else {
			options.username = requestArg({
				title: 'What \'s your login?'
			});
		}
	}
	
	if (!options.password) {
		if (args.password || args.pwd) {
			options.password = args.password || args.pwd;
		} else {
			options.password = requestArg({
				secret: true,
				title: 'What\'s your password?'
			});
		}
	}
	
	if (!options.hostname) {
		if (args.domain || args.hostname || args.host) {
			options.hostname = args.domain || args.hostname || args.host;
		} else {
			options.hostname = requestArg({
				title: 'Which domain should we connect to?'
			});
		}
	}
	
	if (!provided.port) {
		if (args.port && Number.isInteger(Number(args.port))) {
			options.port = Number(args.port);
		}
	}

	return options;
}

function requestArg(options) {
	const {
		defaultAnswer = null,
		secret = false,
		title,
	} = options;

	let question = title;

	if (defaultAnswer) {
		question += ` (${defaultAnswer})`;
	}

	let answer = defaultAnswer;

	while (!answer) {
		answer = readline.question(question + ' '), {
			hideEchoBack: secret
		};

		if (!answer && defaultAnswer) {
			answer = defaultAnswer;
		}
	}
	
	return answer;
}

async function startServer(props) {
	const options = getOptions(props);
	const proxy = await proxyFactory(options);
	app.use('/*', proxy);

	app.listen(options.port, () => {
		console.log(`Appframe proxy listening on port ${options.port}`);
	});
}

module.exports = {
	startServer
};
