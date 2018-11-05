const dotenv = require('dotenv');
const { login } = require('./appframe');

dotenv.load();

const {
	APPFRAME_LOGIN: user,
	APPFRAME_PWD: password,
	APPFRAME_HOSTNAME: hostname
} = process.env;

test('failed login error message makes sense', async () => {
	const result = await login(hostname, 'asldkfjø', 'asdlkfje');

	expect(result).toEqual({ error: 'Login failed. Please check your credentials.', success: false });
});

test('login returns success', async () => {
	const result = await login(hostname, user, password);

	expect(result).toEqual({ success: true });
});