import { io, type Socket } from 'socket.io-client';
import { BACKEND_PATHS } from '@/api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

// Chat socket. Аутентификация — HttpOnly cookie; токен клиент не передаёт.
export function createChatSocket(): Socket {
  return io(SOCKET_URL, {
    path: BACKEND_PATHS.socket.path,
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: false,
  });
}
