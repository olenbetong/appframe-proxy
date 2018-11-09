const dotenv = require('dotenv');
const AppframeClient = require('./appframe');

dotenv.load();

const {
	APPFRAME_LOGIN: username,
	APPFRAME_PWD: password,
	APPFRAME_HOSTNAME: hostname
} = process.env;

test('failed login error message makes sense', async () => {
	const client = new AppframeClient({
		hostname,
		password: 'asdlkfje',
		username: 'asldkfjø',
	});
	const result = await client.login();
	await client.logout();

	expect(result).toEqual({ error: 'Login failed. Please check your credentials.', success: false });
});

test('login returns success', async () => {
	const client = new AppframeClient({
		hostname,
		password,
		username,
	});
	const result = await client.login();
	await client.logout();

	expect(result).toEqual({ success: true });
});

test('can get authenticated stuff after login', async () => {
	const client = new AppframeClient({
		hostname,
		password,
		username,
	});
	
	await client.login();

	const reqOptions = {
		method: 'GET',
		resolveWithFullResponse: true,
		uri: client.getUrl('/api/elements/1.0/projects', 'ProjectID=P16-1157'),
	};

	const result = await client.request(reqOptions);
	await client.logout();

	expect(result.statusCode).toBe(200);

	const body = JSON.parse(result.body);
	expect(body instanceof Array).toBe(true);
	expect(body.length).toBe(1);
	expect(body[0].ProjectId).toBe('P16-1157');
});