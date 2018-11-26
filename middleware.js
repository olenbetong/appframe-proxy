const AppframeClient = require('@olenbetong/appframe-client');
const isPromise = require('is-promise');
const proxy = require('express-http-proxy');

module.exports = async function createMiddleware(options) {
	const {
		hostname,
		login,
		password,
		protocol = 'https',
		proxyOptions = {}
	} = options;

	const client = new AppframeClient({ hostname, login, password });
	const { success } = await client.login();
	const { proxyReqOptDecorator } = proxyOptions;

	proxyOptions.proxyReqOptDecorator = async function(proxyReqOpts, srcReq) {
		let nextOpts = proxyReqOpts;

		if (typeof proxyReqOptDecorator === 'function') {
			nextOpts = proxyReqOptDecorator(proxyReqOpts, srcReq);
			if (isPromise(nextOpts)) {
				nextOpts = await nextOpts;
			}
		}

		nextOpts.headers['X-Requested-With', 'XMLHttpRequest'];

		let sessionCookies = client.jar.getCookies(`${protocol}://${hostname}`);
		let currentCookies = nextOpts.headers['Cookie'];
		let cookies = currentCookies ? currentCookies.split(/;\s*/) : [];

		for (let cookie of sessionCookies) {
			if (['AppframeWebAuth', 'AppframeWebSession'].includes(cookie.key)) {
				cookies.push(`${cookie.key}=${cookie.value}`);
			}
		}

		if (cookies.length >= 2) {
			nextOpts.headers['Cookie'] = cookies.join(';');
		}
		console.log(cookies);
		return nextOpts;
	};

	if (success) {
		return proxy(`${protocol}://${hostname}`, proxyOptions);
	} else {
		throw new Error(success.error);
	}
};
