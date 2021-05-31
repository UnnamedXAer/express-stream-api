import winston from 'winston';
import path from 'path';
import expressWinston from 'express-winston';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const { format, transports } = winston;
const logger = winston.createLogger({
	level: process.env.LOGGER_LEVEL || 'debug',
	transports: [
		new transports.File({
			// level: 'info',
			filename: 'logs.log',
			handleExceptions: false,
			dirname: path.join(__dirname, './../../logs'),
			maxsize: 5 * 1024,
			maxFiles: 10
		}),
		new transports.File({
			level: 'error',
			filename: 'errors.log',
			handleExceptions: false,
			dirname: path.join(__dirname, './../../logs/errors'),
			maxsize: 5 * 1024,
			maxFiles: 10
		})
	],
	defaultMeta: '[app]'
});

if (process.env.NODE_ENV !== 'production') {
	logger.add(
		new winston.transports.Console({
			format: format.combine(
				format.timestamp({
					format: 'YYYY-MM-DD HH:mm:ss'
				}),
				format.errors({ stack: true }),
				format.splat(),
				format.json({ space: 2 }),
				format.ms(),
				format.label({ label: '[http]' }),
				format.colorize(),
				format.printf((info) => {
					return (
						`${info.label} ${info.timestamp} (${info.ms}) ${info.level}: ${info.message}` +
						(info.stack ? '\nStack: ' + info.stack : '')
					);
				})
			),
			meta: true, // optional: control whether you want to log the meta data about the request (default to true)
			// msg: 'HTTP {{req.method}} {{req.url}} -> {{res.statusCode}}, resTime: {{res.responseTime}}ms',
			expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
			colorize: true,
			statusLevels: {},
			level: 'debug'
		})
	);
}

export const expressLogger = expressWinston.logger({
	winstonInstance: logger
});

logger.info('logger level: %s', logger.level);
logger.info('Environment:  %s', process.env.NODE_ENV);

export default logger;
