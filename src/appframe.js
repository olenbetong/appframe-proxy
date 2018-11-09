const rp = require('request-promise-native');
const cheerio = require('cheerio');
const querystring = require('querystring');

const loginFailedStr = 'Login failed. Please check your credentials.';

class AppframeClient {
	constructor(props) {
		this.props = {
			protocol: 'https:',
			...props
		};

		this.jar = null;
	}

	createPostFormRequest(pathname, data) {
		const body = querystring.stringify(data);

		return {
			body,
			headers: {
				'Content-Length': body.length,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			jar: this.jar,
			method: 'POST',
			resolveWithFullResponse: true,
			url: this.getUrl(pathname)
		};
	}

	getUrl(pathname, query) {
		const url = new URL(`${this.props.protocol}//${this.props.hostname}`);
		url.pathname = pathname;

		if (query) url.search = query;

		return url;
	}

	async login() {
		if (this.jar) {
			await this.logout();
		}

		this.jar = rp.jar();
	
		const { password, username } = this.props;

		const body = {
			username,
			password,
			remember: false,
		};

		const options = this.createPostFormRequest('/login', body);
	
		try {
			console.log('Authenticating...');
	
			const res = await rp(options);
	
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

	async logout() {
		const reqOptions = {
			jar: this.jar,
			method: 'POST',
			url: this.getUrl('logout'),
		};
	
		try {
			console.log('Logging out...');
	
			const res = await rp(reqOptions);
	
			this.jar = null;

			if (res.statusCode === 200) {
				console.log('Logged out.');
	
				return true;
			}
	
			console.warn(`Logout failed: ${res.statusCode} ${res.statusMessage}`);
	
			return false;
		} catch (err) {
			this.jar = null;

			if (err.statusCode === 303) {
				console.log('Logged out');

				return true;
			}

			console.error(err.message);
	
			return false;
		}
	}

	getErrorFromBody(body) {
		const $ = cheerio.load(body);
	
		return $('#details pre').text();
	}

	async request(options, isRetry = false) {
		const reqOptions = {
			...options,
			jar: this.jar
		};

		try {
			const res = await rp(reqOptions);
	
			return res;
		} catch (err) {
			let errorMessage = err.message;

			if (err.statusCode === 401) {
				if (!isRetry) {
					const loginRes = await this.login();
	
					if (loginRes.success) {
						return await this.request(options, true);
					} else {
						errorMessage = '401 - Session expired. Login attempt failed.';
					}
				} else {
					errorMessage = '401 - Session expired. Failed to re-run request after new login.';
				}
			} else if (err.error.toLowerCase().indexOf('doctype') >= 0) {
				errorMessage = this.getErrorFromBody(err.error);
			} else if (err.statusCode) {
				errorMessage = `${err.statusCode} - ${err.error}`;
			}
	
			console.error(errorMessage);
	
			return {
				error: errorMessage,
				success: false
			};
		}
	}
}

module.exports = AppframeClient;
