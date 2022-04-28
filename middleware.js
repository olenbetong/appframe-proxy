import expressProxy from "express-http-proxy";
import https from "node:https";

const lastLogin = new Map();

function login(hostname, username, password) {
  return new Promise((resolve, reject) => {
    if (lastLogin.has(hostname)) {
      let { timestamp, authCookies } = lastLogin.get(hostname);
      if (Date.now() - timestamp < 1000 * 60 * 15) {
        resolve(authCookies);
        return;
      } else {
        console.log("Automatic retuthentication after 15 minutes");
        lastLogin.delete(hostname);
      }
    }

    let data = `username=${encodeURIComponent(
      username,
    )}&password=${encodeURIComponent(
      password,
    )}&remember=true&RequireTwoFactor=0`;
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

        lastLogin.set(hostname, {
          timestamp: Date.now(),
          authCookies: cookieObj,
        });

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

  const proxy = expressProxy(`${protocol}://${hostname}`, {
    proxyReqOptDecorator: async function (proxyReqOpts) {
      if (!proxyReqOpts.path.startsWith("/login")) {
        let authCookies = await login(hostname, username, password);
        let cookies = [];
        cookies.push(`AppframeWebAuth=${authCookies["AppframeWebAuth"]}`);
        cookies.push(`AppframeWebSession=${authCookies["AppframeWebSession"]}`);
        proxyReqOpts.headers["cookie"] = cookies.join(";");
        return proxyReqOpts;
      }
    },
    proxyReqPathResolver: function (req) {
      return req.originalUrl;
    },
  });

  proxy.login = async () => {
    return await login(hostname, username, password);
  };

  if (autoLogin) {
    await login(hostname, username, password);
  }

  return proxy;
}
