const proxy = require('./');
require('dotenv').config();

proxy.startServer({
	hostname: process.env.APPFRAME_HOSTNAME,
	password: process.env.APPFRAME_PWD,
	username: process.env.APPFRAME_LOGIN,
});
