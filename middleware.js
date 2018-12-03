const AppframeClient = require('@olenbetong/appframe-client');
const isPromise = require('is-promise');
const proxy = require('express-http-proxy');

module.exports = async function createMiddleware(options) {
	const {
		hostname,
		password,
		protocol = 'https',
		proxyOptions = {},
		username,
	} = options;

	const client = new AppframeClient({ hostname, username, password });
	const { proxyReqOptDecorator, proxyReqPathResolver } = proxyOptions;

	proxyOptions.proxyReqOptDecorator = async function(proxyReqOpts, srcReq) {
		let nextOpts = proxyReqOpts;
		nextOpts.path = srcReq.baseUrl;

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

		return nextOpts;
	};

	if (!proxyReqPathResolver) {
		proxyOptions.proxyReqPathResolver = (req) => req.originalUrl;
	}

	const { success } = await client.login();

	if (success) {
		return proxy(`${protocol}://${hostname}`, proxyOptions);
	} else {
		throw new Error(success.error);
	}
};
