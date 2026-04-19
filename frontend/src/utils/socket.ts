import { io, Socket } from 'socket.io-client';
import config from '../config';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  if (!socket) {
    socket = io(config.API_BASE_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });
  }
  return socket;
}
