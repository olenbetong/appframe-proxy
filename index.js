const express = require('express');
const minimist = require('minimist');
const readline = require('readline-sync');
const AppframeClient = require('./src/appframe');
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
	
	if (args.domain || args.hostname || args.host) {
		options.hostname = args.domain || args.hostname || args.host;
	} else {
		options.hostname = requestArg({
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
	const client = new AppframeClient(options);
	const loginResult = await client.login();

	if (loginResult) {
		app.all('/*', async function(req, res) {
			const [path, query] = req.originalUrl.split('?');
			const uri = client.getUrl(path, query);

			console.log(`Sending request to ${uri}...`);

			const reqOptions = {
				body: req.body,
				method: req.method,
				resolveWithFullResponse: true,
				uri,
			};

			let result = await client.request(reqOptions);

			for (let header in result.headers) {
				res.set({ [header]: result.headers[header] });
			}

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
