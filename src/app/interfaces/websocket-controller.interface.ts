import { Socket } from 'socket.io';
import { WebSocketManager } from './websocket-manager.interface';

export interface WebSocketController {
	init: (manager: WebSocketManager) => void;
	registerUserClientSocket: (socket: Socket) => void;
	registerServerClientSocket?: (socket: Socket) => void;
}
