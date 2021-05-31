import ExpressPino from 'express-pino-logger';
import Pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const logger = Pino({
	prettyPrint: isProd
		? false
		: {
				colorize: true,
				crlf: true,
				translateTime: true
		  }
});

const appLogger = ExpressPino({
	logger: logger,
	autoLogging: true
});

export default appLogger;
