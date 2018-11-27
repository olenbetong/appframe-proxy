# Appframe Web Proxy 

A simple proxy server that keeps a user logged in to an AppframeWeb website, and proxies requests to that website. Useful if you are developing applications locally and need to access code modules/data on an AppframeWeb website. You can either use the command line to start a standalone express server that proxies everything, or use the middleware in an existing express application.

## Installation

Install as a development dependency:

```
npm install --save-dev @olenbetong/appframe-proxy
```

## Usage

### Command line

To start the proxy, run the `appframe-proxy` command. You will be prompted for any required option that wasn't passed as an argument to the command.

```
appframe-proxy --username myuser --password mypassword --hostname example.com
```

### CommonJS

You can import the server with CommonJS.

```js
const proxy = require('@olenbetong/appframe-proxy');
proxy.startServer({
	hostname: 'example.com',
	password: 'Password1',
	port: 8087,
	username: 'myuser',
});
```

### Middleware

The createMiddleware is an async function, and resolves with the proxy middleware when a session has been created successfully.

```js
const app = require('express')();
const createMiddleware = require('@olenbetong/appframe-proxy/middleware');

async function startServer() {
	const proxy = await createMiddleware({
		hostname: 'example.com',
		password: 'Password1',
		username: 'myuser'
	});
	
	app.use('/api', proxy);

	app.listen(...);
}
```

### In webpack-dev-server

```js
const createMiddleware = require('@olenbetong/appframe-proxy/middleware');

async function getConfig() {
	const proxy = createMiddleware({
		hostname: 'example.com',
		password: 'Password1',
		username: 'myuser'
	});

	return { // webpack config object
		...
		devServer: {
			before: function(app) {
				// add any paths that should be passed to the Appframe website here
				app.use('/api/*', proxy);
				app.use('/file/*', proxy);
				app.use('/static/*', proxy);
			}
		}
		...
	}
}

module.exports = getConfig;
```

### Options

 * **username** - User that will be used to log in to the AppframeWeb website
 * **password** - Password for the user
 * **hostname** - Hostname the proxy will send requests to
 * **port** (optional) - Port where the proxy will listen to requests (default 8082)

## Changelog

### [1.1.0] - 2018-11-16

#### Added

 * Middleware now available to use in existing express applications (e.g. webpack-dev-server)

#### Fixed

 * Image requests should now work properly

### [1.0.4] - 2018-11-16

 * Changed repository to GitHub
 * Changed formatting of changes section

### [1.0.3] - 2018-11-03

 * Fixed wrong binary name

### [1.0.2] - 2018-11-09

 * Moved AppframeClient class to separate package `@olenbetong/appframe-client`

### [1.0.1] - 2018-11-09

 * Fixed provided options ignored when using CommonJS