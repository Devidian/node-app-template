import { Socket } from 'socket.io';

export interface WebSocketManager {
	getUserSocketMap: () => Map<string, Socket>;
}
