import { io, type Socket } from 'socket.io-client';
import { BACKEND_PATHS } from '@/api/endpoints';

// Empty in dev means same-origin; Vite proxies /api/socket.io (including WS)
// to DEV_PROXY_TARGET. In production this can be set to the backend origin.
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
