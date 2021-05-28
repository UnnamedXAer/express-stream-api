import dotenv from 'dotenv';
const configOutput = dotenv.config({
	path:
		process.cwd() +
		'/' +
		(process.env.NODE_ENV ? '.' + process.env.NODE_ENV : '') +
		'.env'
});
if (configOutput.error) {
	console.warn('dotenv: ' + configOutput.error);
}