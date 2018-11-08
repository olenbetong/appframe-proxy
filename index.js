const express = require('express');
const minimist = require('minimist');
const readline = require('readline-sync');
const { login, request } = require('./src/appframe');
const args = minimist(process.argv.slice(2));
const app = express();

function getOptions() {
	const options = {
		port: 8082
	};
	
	if (args.username || args.login || args.user) {
		options.username = args.username || args.login || args.user;
	} else {
		options.username = requestArg({
			title: 'What \'s your login?'
		});
	}
	
	if (args.password || args.pwd) {
		options.password = args.password || args.pwd;
	} else {
		options.password = requestArg({
			secret: true,
			title: 'What\'s your password?'
		});
	}
	
	if (args.domain || args.hostname) {
		options.domain = args.domain || args.hostname;
	} else {
		options.domain = requestArg({
			title: 'Which domain should we connect to?'
		});
	}
	
	if (args.port && Number.isInteger(Number(args.port))) {
		options.port = Number(args.port);
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

async function startServer() {
	const options = getOptions();

	let loginResult = await login(options.domain, options.username, options.password);
console.log(loginResult);
	if (loginResult) {
		app.all('/*', async function(req, res) {
			console.log(`Sending request to ${options.domain}${req.originalUrl}...`);
			const reqOptions = {
				body: req.body,
				method: req.method,
				resolveWithFullResponse: true,
				uri: `https://${options.domain}${req.originalUrl}`,
			};

			let result = await request(reqOptions);

			res.set({
				'Cache-Control': result.headers['cache-control'],
				'Content-Length': result.headers['content-length'],
				'Content-Type': result.headers['content-type']
			});

			res.status(result.statusCode).send(result.body);
		});

		app.listen(options.port, () => {
			console.log(`Appframe proxy listening on port ${options.port}`);
		});
	} else {
		console.error('Login failed :(');
	}
}

startServer();
