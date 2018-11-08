const rp = require('request-promise-native');
let jar = rp.jar();
const cheerio = require('cheerio');
const querystring = require('querystring');

const loginFailedStr = 'Login failed. Please check your credentials.';
let loginData = {};

function getErrorFromBody(body) {
	const $ = cheerio.load(body);

	return $('#details pre').text();
}

async function request(options, isRetry = false) {
	const reqOptions = {
		...options,
		jar
	};
	try {
		const res = await rp(reqOptions);
		
		if (res.statusCode === 401) {
			if (!isRetry) {
				const loginRes = await login(loginData.domain, loginData.username, loginData.password);

				if (loginRes.success) {
					return await request(options, true);
				} else {
					throw new Error('Session expired. Login attempt failed.');
				}
			} else {
				throw new Error('Session expired. Failed to re-run request after new login.');
			}
		}

		return res;
	} catch (err) {
		const errorMessage = err.message.indexOf('DOCTYPE') >= 0
			? getErrorFromBody(err.error)
			: err.error;

		console.error(errorMessage);

		return {
			error: errorMessage,
			success: false
		};
	}
}

async function logout(domain) {
	const reqOptions = {
		jar,
		method: 'GET',
		url: `https://${domain}/logout`
	};

	try {
		console.log('Logging out...');

		const res = await rp(reqOptions);

		if (res.statusCode === 200) {
			console.log('Logged out.');

			return true;
		}

		console.warn(`Logout failed: ${res.statusCode} ${res.statusMessage}`);

		return false;
	} catch (err) {
		console.error(err.message);

		return false;
	}
}

async function login(domain, username, password) {
	jar = rp.jar();
	loginData = {
		domain,
		password,
		remember: false,
		username
	};

	const body = querystring.stringify({
		username,
		password,
		remember: false,
	});

	const reqOptions = {
		body,
		headers: {
			'Content-Length': body.length,
			'Content-Type': 'application/x-www-form-urlencoded',
			'Origin': 'https://synergi.olenbetong.no',
			'Referer': 'https://synergi.olenbetong.no/login',
		},
		method: 'POST',
		resolveWithFullResponse: true,
		url: `https://${domain}/login`,
	};

	try {
		console.log('Authenticating...');

		const res = await rp(reqOptions);

		if (res.statusCode === 200 && !res.body.includes(loginFailedStr)) {
			console.log('Authentication successful.');

			return {
				success: true
			};
		} else if (res.body.includes(loginFailedStr)) {
			console.warn(loginFailedStr);

			return {
				error: loginFailedStr,
				success: false
			};
		} else {
			console.warn(loginFailedStr);
			return {
				error: `Login failed (${res.statusCode}: ${res.statusMessage})`,
				success: false
			};
		}
	} catch (err) {
		console.error(err);

		return {
			error: err,
			success: false
		};
	}
}

module.exports = {
	login,
	logout,
	request
};
