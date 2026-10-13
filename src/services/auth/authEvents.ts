/**
 * Шина auth-событий между HTTP-слоем и React (AuthContext).
 */

export const AUTH_EVENTS = {
  UNAUTHORIZED: "auth:unauthorized",
} as const;

const bus = new EventTarget();

export function emitUnauthorized(): void {
  bus.dispatchEvent(new Event(AUTH_EVENTS.UNAUTHORIZED));
}

export function onUnauthorized(handler: () => void): () => void {
  const listener = () => handler();
  bus.addEventListener(AUTH_EVENTS.UNAUTHORIZED, listener);
  return () => bus.removeEventListener(AUTH_EVENTS.UNAUTHORIZED, listener);
}
