'use strict';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import express, { Errback, Express, NextFunction, Request, Response } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { first } from 'rxjs/operators';
import { Server as IoServer, Server, Socket } from 'socket.io';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { AppAPIController } from './app/controllers/app-api.controller';
import { AppWebsocketController } from './app/controllers/app-websocket.controller';
import { mongoClient } from './utils';
import { AppInfo, Environment, EnvVars, Logger } from './utils/without-mongo';
import passport = require('passport');
import exsession = require('express-session');
import cookieParser = require('cookie-parser');
const logger = new Logger('app');

function bootstrapAPI(app: Express) {
	new AppAPIController(app);
}

function bootstrapWebSocket(ioServer: Server) {
	new AppWebsocketController(ioServer, []);
}

// https://github.com/nkzawa/socket.io-bundle/blob/master/lib/session.js
function persist(fn: Function, req: Request) {
	return function () {
		// @ts-ignore
		var self: any = this;
		if (!req.session) return fn.apply(self, arguments);

		var args = arguments;

		req.session.resetMaxAge();
		req.session.save(function (err) {
			if (err) logger.error(err.stack);
			fn.apply(self, args);
		});
	};
}

export async function initWorker() {
	const clientPromise = mongoClient.pipe(first((f) => !!f)).toPromise();
	const swaggerDefinition = {
		openapi: '3.0.0',
		info: {
			// .API informations (required)
			title: 'App API', // Title (required)
			version: (await AppInfo.version()) || '1.0.0', // Version (required)
			description: 'App REST API', // Description (optional)
		},
		// host: `localhost:${PORT}`, // Host (optional)
		// basePath: '/', // Base path (optional)
	};

	// Options for the swagger docs
	const options = {
		// Import swaggerDefinitions
		swaggerDefinition,
		// Path to the API docs
		// Note that this path is relative to the current directory from which the Node.js is ran, not the application itself.
		apis: [AppInfo.cwd() + '/assets/sw_*.yaml'],
	};

	const swaggerSpec = swaggerJsdoc(options);

	// CORS.options
	const origin = function (origin: string, callback: Function) {
		// db.loadOrigins is an example call to load
		// a list of origins from a backing database
		callback(null, [origin]);
	};

	const xpr = express();
	const server: HttpServer = createServer(xpr);
	const ioServer: IoServer = require('socket.io')(server, {
		cors: {
			origin,
			methods: ['GET', 'POST'],
			credentials: true,
		},
	});
	xpr.disable('x-powered-by');

	const sessionOptions: exsession.SessionOptions = {
		secret: Environment.getString(EnvVars.APP_SALT, 'd3f4ul7 5ecre7'),
		saveUninitialized: true, // don't create session until something stored
		resave: true, //don't save session if unmodified
		store: MongoStore.create({
			clientPromise: clientPromise,
			dbName: Environment.getString(EnvVars.DB_NAME),
		}),
		cookie: {
			path: '/',
			domain: Environment.getString(EnvVars.APP_COOKIE_DOMAIN),
			maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
		},
	};

	// xpr.use(express.static('public'));
	xpr.use(
		cors({
			origin,
			credentials: true,
		}),
	);
	// xpr.options('*', cors());
	xpr.use(cookieParser(Environment.getString(EnvVars.APP_SALT, 'd3f4ul7 5ecre7')));
	xpr.use(express.json());
	xpr.use(exsession(sessionOptions));
	xpr.use(passport.initialize());
	xpr.use(passport.session());
	xpr.use((err: Errback, req: Request, res: Response, next: NextFunction) => {
		logger.error('Express error', err);
		res.status(500).end();
	});
	xpr.use('/api-docs', swaggerUi.serve);
	xpr.get('/api-docs', swaggerUi.setup(swaggerSpec));

	xpr.get('/_ah/health', (req, res, next) => {
		res.status(200).end();
	});

	xpr.get('/_ah/warmup', (req, res, next) => {
		res.status(200).end();
	});

	// Socket Server
	const wrap = (middleware: any) => (socket: Socket, next: any) => middleware(socket.request, {}, next);
	ioServer.use(wrap(cookieParser(Environment.getString(EnvVars.APP_SALT, 'd3f4ul7 5ecre7'))));
	// ioServer.use(wrap(exsession(sessionOptions)));
	ioServer.use((socket: any, next) => {
		var req = socket.request;
		var res = req.res;

		req.originalUrl = req.originalUrl || req.url;

		// proxy `onconnect` to commit the session.
		persist(socket.onconnect, req);

		return exsession(sessionOptions)(req, res, next as NextFunction);
	});
	ioServer.use(wrap(passport.initialize()));
	ioServer.use(wrap(passport.session()));

	const host = Environment.getString('HOST', '0.0.0.0');
	let port = Environment.getNumber('PORT', 8090);

	server.on('error', (e) => {
		logger.error('app.initWorker', e?.message, `trying ${++port}`);
		if (e.message.includes('EADDRINUSE')) {
			server.listen(port);
		}
	});

	await mongoClient.pipe(first((f) => !!f)).toPromise();

	bootstrapAPI(xpr);
	bootstrapWebSocket(ioServer);

	server.listen(port, host);
	logger.info(`App Backend started. Version: ${await AppInfo.version()}`);
	logger.info(`Server ready and listening on <${host}:${port}>`);
}
