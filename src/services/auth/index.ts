/**
 * Импортируйте отсюда, а не из конкретных файлов.
 */
export {
  AUTH_EVENTS,
  emitUnauthorized,
  onUnauthorized,
} from './authEvents';

export {
  broadcastAuthSessionChanged,
  subscribeAuthSessionChange,
  broadcastAbortPendingLogout,
  subscribeAbortPendingLogout,
} from './authChannel';

export {
  CONV_SESSION_KEY,
  CONV_STATUS_KEY,
  CONV_OWNER_KEY,
  CONV_NAMES_KEY,
  clearAuthScopedStorage,
} from './authStorage';

export {
  markLocalLogout,
  clearLocalLogout,
  hasLocalLogoutBarrier,
  rotateAuthSessionRevision,
  readAuthSessionRevision,
} from './localSessionBoundary';
