import './loadEnv.js';
import express from 'express';
import fsBase, { promises as fs } from 'fs';
import logger, { expressLogger } from './logger/winston/logger.js';
import path from 'path';
import { Media } from './media.model.js';

const app = express();
app.use(expressLogger);
app.use(express.json());

app.get('/favicon.ico', (req, res) => {
	res.sendStatus(404);
});

app.get('/stream/:name', async (req, res) => {
	if (!req.headers.range) {
		return res.sendStatus(416);
	}

	logger.debug('range: ' + req.headers.range);
	let name = req.params.name;
	name = path.basename(name);
	const dir = path.join(process.env.STREAMS_DIR, name);

	let total;
	try {
		const stats = await fs.stat(dir);
		total = stats.size;
	} catch (err) {
		logger.warn(err);
		if (err.code === 'ENOENT') {
			return res.sendStatus(404);
		}
		return res.sendStatus(500);
	}

	const positions = req.headers.range.replace('bytes=', '').split('-');
	const start = parseInt(positions[0], 10);
	let end = parseInt(positions[1], 10);

	if (isNaN(end) || end < 1 || end - start > 1024 * 1024) {
		end = start + 1024 * 1024;
	}

	if (end > total - 1) {
		end = total - 1;
	}

	const chunkSize = end - start + 1;

	let stream;
	try {
		stream = fsBase.createReadStream(dir, {
			autoClose: true,
			start: start,
			end: end
		});
	} catch (err) {
		logger.warn(err);
		return res.sendStatus(500);
	}

	const contentRange = 'bytes ' + start + '-' + end + '/' + total;
	logger.silly('contentRange: %s, chunk size: %d', contentRange, chunkSize);
	res.writeHead(206, {
		'Content-Range': contentRange,
		'Accept-Ranges': 'bytes',
		'Content-Length': chunkSize,
		'Content-Type': 'video/mp4'
	});

	stream.on('error', (err) => {
		logger.warn('error - err: ' + err);
	});
	stream.on('open', (n) => {
		stream.pipe(res);
	});
});

app.get('/available-media', async (req, res) => {
	logger.debug('im here');

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
		fs.stat(path.join(process.env.STREAMS_DIR, m.name + '.' + m.ext))
	);

	const mediaInfo = await Promise.allSettled(mediaPromises);

	const output = [];
	mediaInfo.forEach((res, idx) => {
		if (res.status === 'rejected') {
			logger.warn(res.reason);
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
app.use(/^[/]$/, express.static('public', { cacheControl: false }));

app.use('*', async (req, res) => {
	res.header('requested_url', req.baseUrl);
	res.status(301);
	res.redirect('/');
	// res.status(404).send("nothing here")
});

app.use((err, req, res, next) => {
	if (err) {
		logger.warn(err.toString());
	}
	if (res.statusCode < 400) {
		res.status(500);
	}

	res.send(err ? err : '_internal server error');
});

const server = app.listen(3000, () => {
	logger.info('Server up and running at http://localhost:3000');
});

process.on('exit', (code) => {
	logger.info('exiting with code: ' + code);
});
