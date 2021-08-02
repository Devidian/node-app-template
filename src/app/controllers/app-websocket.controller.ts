import { UserAccountEntity, userAccountService } from '@/user-account';
import { ExtendedLogger, MongoDB } from '@/utils';
import { MongoClient } from 'mongodb';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Server, Socket } from 'socket.io';
import { WebSocketEvents } from '../enums/WebSocketEvents';
import { WebSocketController, WebSocketManager } from '../interfaces';

export class AppWebsocketController implements WebSocketManager {
	private userSocketMap: Map<string, Socket> = new Map<string, Socket>();

	private logger = new ExtendedLogger(AppWebsocketController.name);

	@MongoDB
	private $dbConnection: Observable<MongoClient>;

	get ioServer() {
		return this.io;
	}

	constructor(private io: Server, private wsController: WebSocketController[]) {
		this.init().catch((err) => {
			this.logger.exception(`Error while starting ${AppWebsocketController.name}: ${err}`);
		});
	}

	public getUserSocketMap(): Map<string, Socket> {
		return this.userSocketMap;
	}

	public async init(): Promise<void> {
		await this.$dbConnection.pipe(first((f) => !!f)).toPromise();
		this.logger.debug('Starting WebSocket Server');
		const ioServer = this.ioServer;

		// if someone connects through the web-frontend
		ioServer.of('/web').on('connection', (socket: Socket) => {
			socket.data = socket.data || {
				user: null,
			};
			this.logger.debug(`[WS:/web] connected: ${socket.id} =>`, socket.data.user?.name);

			socket.on('disconnect', () => {
				const user: UserAccountEntity = socket.data.user;
				this.userSocketMap.delete(user?.id);
				this.logger.debug(`[WS:/web] disconnected: ${socket.id} =>`, user?.name);
			});
			this.setupWebSocketClient(socket);
			for (const controller of this.wsController) {
				controller.registerUserClientSocket(socket);
			}
		});

		// use this for server to server connections
		ioServer.of('/node').on('connection', (socket: Socket) => {
			socket.data = socket.data || {
				user: null,
			};
			this.logger.debug(`[WS/node] connected: ${socket.id} =>`, socket.conn.remoteAddress);

			for (const controller of this.wsController) {
				controller.registerServerClientSocket ? controller.registerServerClientSocket(socket) : null;
			}
		});

		for (const controller of this.wsController) {
			controller.init(this);
		}
	}

	private setupWebSocketClient(socket: Socket): void {
		socket.on(WebSocketEvents.USER_TEST, (message) => {
			this.logger.debug('setupWebSocketClient', 'test request', message);
			socket.emit(WebSocketEvents.USER_TEST, message);
		});
		socket.on(WebSocketEvents.USER_AUTH, async (data: { token: string; id: string }) => {
			const user = (socket.data.user = await userAccountService.findById(data.id));
			if (!user) return;

			socket.emit(WebSocketEvents.USER_WELCOME, user.toPlain(['owner']));
			this.userSocketMap.set(user.id, socket);
		});
	}
}
