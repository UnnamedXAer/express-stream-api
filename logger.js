import ExpressPino from 'express-pino-logger';

const logger = ExpressPino({
	autoLogging: true
});

export default logger;
