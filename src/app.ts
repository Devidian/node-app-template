'use strict';
import cluster, { Worker } from 'cluster';
import { Environment, EnvVars, Logger, Loglevel } from './utils/without-mongo';
const logger = new Logger('app');

process.title = cluster.isPrimary ? 'Master' : `Worker${cluster.worker.id}`;
logger.info(`Starting process`);
logger.info(`Loglevel <${Loglevel[Environment.getNumber(EnvVars.APP_LOG_LEVEL)]}>`);
logger.debug(`Log to database <${Environment.getBoolean(EnvVars.APP_LOG_DB)}>`);
logger.debug(`Log to websocket <${Environment.getBoolean(EnvVars.APP_LOG_WS)}>`);

if (cluster.isPrimary) {
	let c: Worker = null;
	function createWorker(code?: number, signal?: string) {
		if (c) {
			logger.error(`Worker <${c.id}> exited with code: <${code}> and signal <${signal}>`);
			c.removeAllListeners();
			c.destroy();
		}
		c = cluster.fork();
		c.addListener('exit', createWorker);
	}
	createWorker();
} else {
	import('./app-worker')
		.then(({ initWorker }) => {
			return initWorker();
		})
		.catch((e) => {
			logger.error(e.message);
		});
}
