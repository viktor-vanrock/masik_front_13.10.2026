import { expect, it, vi } from 'vitest';
import { bindSidebarGesture } from './sidebarGesture';

it('opens from the edge, closes by dragging left, and leaves vertical scrolling alone', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const root = document.createElement('div');
  const side = document.createElement('aside'); side.className = 'cr-side'; root.append(side);
  Object.defineProperty(side, 'offsetWidth', { value: 300 });
  const setOpen = vi.fn((open: boolean) => root.classList.toggle('side-open', open));
  const release = bindSidebarGesture(root, side, setOpen);
  const touch = (type: string, x: number, y: number, target: HTMLElement = root) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, { touches: { value: [{ clientX: x, clientY: y }] }, changedTouches: { value: [{ clientX: x, clientY: y }] } });
    target.dispatchEvent(event); return event;
  };
  touch('touchstart', 10, 30); expect(touch('touchmove', 160, 35).defaultPrevented).toBe(true); touch('touchend', 160, 35);
  expect(setOpen).toHaveBeenLastCalledWith(true); expect(side.style.translate).toBe('');
  touch('touchstart', 230, 30, side); touch('touchmove', 100, 34, side); touch('touchend', 100, 34, side);
  expect(setOpen).toHaveBeenLastCalledWith(false);
  setOpen.mockClear(); touch('touchstart', 10, 30); expect(touch('touchmove', 20, 80).defaultPrevented).toBe(false); touch('touchend', 20, 80);
  expect(setOpen).not.toHaveBeenCalled();
  release(); touch('touchstart', 10, 30); touch('touchmove', 160, 35); touch('touchend', 160, 35);
  expect(setOpen).not.toHaveBeenCalled(); vi.unstubAllGlobals();
});
