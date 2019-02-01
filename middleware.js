const AppframeClient = require("@olenbetong/appframe-client");
const isPromise = require("is-promise");
const proxy = require("express-http-proxy");

module.exports = async function createMiddleware(options) {
  const {
    autoLogin = true,
    hostname,
    password,
    protocol = "https",
    proxyOptions = {},
    username
  } = options;

  const client = new AppframeClient({ hostname, username, password });
  const { proxyReqOptDecorator, proxyReqPathResolver } = proxyOptions;

  proxyOptions.proxyReqOptDecorator = async function(proxyReqOpts, srcReq) {
    let nextOpts = proxyReqOpts;
    nextOpts.path = srcReq.baseUrl;

    if (typeof proxyReqOptDecorator === "function") {
      nextOpts = proxyReqOptDecorator(proxyReqOpts, srcReq);
      if (isPromise(nextOpts)) {
        nextOpts = await nextOpts;
      }
    }

    nextOpts.headers[("X-Requested-With", "XMLHttpRequest")];

    const sessionCookies = client.getSessionCookies();
    const currentCookies = nextOpts.headers["Cookie"];
    const cookies = currentCookies ? currentCookies.split(/;\s*/) : [];

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    if (sessionCookies.AppframeWebAuth.creation < oneHourAgo) {
      await client.login();
    }

    ["AppframeWebAuth", "AppframeWebSession"].forEach(key => {
      cookies.push(`${key}=${sessionCookies[key].value}`);
    });

    if (cookies.length >= 2) {
      nextOpts.headers["Cookie"] = cookies.join(";");
    }

    return nextOpts;
  };

  if (!proxyReqPathResolver) {
    proxyOptions.proxyReqPathResolver = req => req.originalUrl;
  }

  async function login() {
    const { success } = await client.login();

    if (success) {
      return proxy(`${protocol}://${hostname}`, proxyOptions);
    } else {
      throw new Error(success.error);
    }
  }

  if (autoLogin) {
    return await login();
  }

  return login;
};
