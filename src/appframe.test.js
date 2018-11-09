const dotenv = require('dotenv');
const AppframeClient = require('./appframe');

dotenv.load();

const {
	APPFRAME_LOGIN: username,
	APPFRAME_PWD: password,
	APPFRAME_HOSTNAME: hostname
} = process.env;

const client = new AppframeClient({
	hostname,
	password,
	username,
});

const failedClient = new AppframeClient({
	hostname,
	password: 'asdlkfje',
	username: 'asldkfjø',
});

test('failed login error message makes sense', async () => {
	const result = await failedClient.login();
	
	expect(result).toEqual({ error: 'Login failed. Please check your credentials.', success: false });
	
	const reqOptions = {
		method: 'GET',
		resolveWithFullResponse: true,
		uri: client.getUrl('/api/elements/1.0/projects', 'ProjectID=P16-1157'),
	};
	
	const reqResult = await failedClient.request(reqOptions);
	
	expect(reqResult).toEqual({
		error: '401 - Session expired. Login attempt failed.',
		success: false
	});

	await failedClient.logout();
});

test('login returns success', async () => {
	const result = await client.login();
	const result2 = await client.login();

	expect(result).toEqual({ success: true });
	expect(result2).toEqual({ success: true });
});

test('logout returns true', async () => {
	const result = await client.logout();

	expect(result).toBe(true);
});

test('can get authenticated stuff after login', async () => {
	const reqOptions = {
		method: 'GET',
		resolveWithFullResponse: true,
		uri: client.getUrl('/api/elements/1.0/projects', 'ProjectID=P16-1157'),
	};

	const result = await client.request(reqOptions);

	expect(result.statusCode).toBe(200);

	const body = JSON.parse(result.body);
	expect(body instanceof Array).toBe(true);
	expect(body.length).toBe(1);
	expect(body[0].ProjectId).toBe('P16-1157');
});

test('error messages parsed properly', async () => {
	const reqOptions = {
		method: 'GET',
		resolveWithFullResponse: true,
		uri: client.getUrl('/api/elements/1.0/projects?ProjectID=P16-1157'), // setting search string in pathname results in potentially dangerous request
	};

	const result = await client.request(reqOptions);

	expect(result).toEqual({
		error: '400 - A potentially dangerous Request.Path value was detected from the client (?).',
		success: false,
	});
});

test('server errors handled', async () => {
	const reqOptions = {
		method: 'GET',
		resolveWithFullResponse: true,
		uri: client.getUrl('article-that-should-never-ever-exist-' + Math.random().toString(32).slice(2))
	};

	const result = await client.request(reqOptions);

	expect(result).toEqual({
		error: '404 - Not Found',
		success: false
	});
});

afterAll(async () => {
	await client.logout();
});