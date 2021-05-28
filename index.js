import './loadEnv.js';
import express from 'express';
import fsBase, { promises as fs } from 'fs';
import logger from './logger.js';
import path from 'path';
import { Media } from './media.model.js';

const app = express();
app.use(logger);
app.use(express.json());

app.get('/stream/:name', async (req, res) => {
	let name = req.params.name;
	name = path.basename(name);

	const dir = path.join(process.env.STREAMS_DIR, name);
	const stream = fsBase.createReadStream(dir, {});

	stream.pipe(res);
});

app.get('/available-media', async (req, res) => {
	const mediaBaseDir = process.env.STREAMS_DIR;
	const dirs = await fs.readdir(mediaBaseDir);
	const videoExtensions = ['mp4', 'avi'];
	/** @type Media[] */
	const media = [];
	dirs.forEach((dir) => {
		const parsedPath = path.parse(dir);
		const ext = parsedPath.ext.slice(1);
		if (videoExtensions.includes(ext)) {
			media.push(new Media(parsedPath.name, ext));
		}
	});

	const mediaPromises = media.map((m) =>
		fs.stat(path.join(process.env.STREAMS_DIR, m.name + m.ext))
	);

	const mediaInfo = await Promise.allSettled(mediaPromises);

	const output = [];
	mediaInfo.forEach((res, idx) => {
		if (res.status === 'rejected') {
			req.log.warn(res.reason);
			return;
		}
		const m = media[idx];
		m.createTime = res.value.ctime;
		m.size = res.value.size;
		output.push(m);
	});

	res.send(output);
});

// /
app.use(/^[/]$/, async (req, res) => {
	res.send('stream api');
});

app.use('*', async (req, res) => {
	res.header('requested_url', req.baseUrl);
	res.status(301);
	res.redirect('/');
	// res.status(404).send("nothing here")
});

app.use((err, req, res, next) => {
	if (err) {
		console.warn(err);
	}
	if (res.statusCode < 400) {
		res.status(500);
	}

	res.send(err ? err : '_internal server error');
});

const server = app.listen(3000, () => {
	console.log('Server up and running at http://localhost:3000');
});

process.on('exit', (code) => {
	console.log('exiting with code: ' + code);
});
