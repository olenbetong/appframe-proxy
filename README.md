# Appframe Web Proxy 

A simple proxy server that keeps a user logged in to an AppframeWeb website, and proxies requests to that website. Useful if you are developing applications locally and need to access code modules/data on an AppframeWeb website.

## Installation

Install globally:

```
npm install -g @olenbetong/appframe-proxy
appframe-proxy --username myuser --password mypassword --hostname example.com
```

or install as a development dependency:

```
npm install --save-dev @olenbetong/appframe-proxy
npx appframe-proxy --username myuser --password mypassword --hostname example.com
```

## Running

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
})
```

### Options

 * **username** - User that will be used to log in to the AppframeWeb website
 * **password** - Password for the user
 * **hostname** - Hostname the proxy will send requests to
 * **port** (optional) - Port where the proxy will listen to requests (default 8082)

## Changes

### 2018-11-09 - 1.01

 * Fixed provided options ignored when using CommonJS