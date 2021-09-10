import { createProxyMiddleware } from "http-proxy-middleware";
import https from "node:https";

function login(hostname, username, password) {
  return new Promise((resolve, reject) => {
    let data = `username=${encodeURIComponent(
      username,
    )}&password=${encodeURIComponent(password)}&remember=false`;
    let options = {
      hostname,
      port: 443,
      path: "/login",
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": data.length,
      },
    };

    console.log("Authenticating...");

    let request = https.request(options, (response) => {
      if (response.statusCode < 400) {
        let cookies = response.headers["set-cookie"];
        let cookieObj = {};
        for (let cookie of cookies) {
          let [keyValue] = cookie.split(";");
          let [key, value] = keyValue.split("=");

          if (["AppframeWebSession", "AppframeWebAuth"].includes(key)) {
            cookieObj[key] = value;
          }
        }

        console.log("Authentication successfull.");

        resolve(cookieObj);
      } else {
        reject(
          Error(
            `Authentication failed: ${response.statusCode} ${response.statusMessage}`,
          ),
        );
      }
    });

    request.write(data);
    request.end();
  });
}

export default async function createMiddleware(options) {
  const {
    autoLogin = true,
    hostname,
    password,
    protocol = "https",
    username,
  } = options;
  let authCookies = null;

  async function addAuthCookies(proxyReq) {
    proxyReq.socket.pause();
    if (authCookies === null) {
      authCookies = await login(hostname, username, password);
    } else if (authCookies instanceof Promise) {
      authCookies = await authCookies;
    }

    let cookies = [];
    cookies.push(`AppframeWebAuth=${authCookies["AppframeWebAuth"]}`);
    cookies.push(`AppframeWebSession=${authCookies["AppframeWebSession"]}`);
    proxyReq.setHeader("cookie", cookies.join(";"));
    proxyReq.socket.resume();
  }

  const proxyOptions = {
    target: `${protocol}://${hostname}`,
    changeOrigin: true,
    ws: false,
    onProxyReq: addAuthCookies,
    onProxyRes: (proxyRes) => {
      if (proxyRes.statusCode === 401) {
        authCookies = null;
        authCookies = login(hostname, username, password);
      }
    },
    pathRewrite: {},
    router: {},
  };

  const proxy = createProxyMiddleware(proxyOptions);
  proxy.login = async () => {
    authCookies = await login(hostname, username, password);
    return authCookies;
  };

  if (autoLogin) {
    authCookies = await login(hostname, username, password);
  }

  return proxy;
}
