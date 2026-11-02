// Gesture thresholds and drag animation match the supplied HTML prototype.
export function bindSidebarGesture(root: HTMLElement, side: HTMLElement, setOpen: (open: boolean) => void) {
  let startX: number | null = null, startY = 0, dragging = false, width = 0;
  const reset = () => { side.style.transition = ''; side.style.translate = ''; startX = null; dragging = false; };
  const start = (event: TouchEvent) => {
    if (!matchMedia('(max-width: 760px)').matches || event.touches.length !== 1) return;
    const touch = event.touches[0], open = root.classList.contains('side-open');
    if ((!open && touch.clientX > 24) || (open && !(event.target instanceof Element && event.target.closest('.cr-side, .cr-scrim')))) return;
    startX = touch.clientX; startY = touch.clientY; dragging = false; width = side.offsetWidth;
  };
  const move = (event: TouchEvent) => {
    if (startX === null) return;
    const touch = event.touches[0];
    if (!touch) return;
    const dx = touch.clientX - startX, dy = touch.clientY - startY;
    if (!dragging) {
      if (Math.abs(dx) < 8 || Math.abs(dy) > Math.abs(dx)) { if (Math.abs(dy) > 12) startX = null; return; }
      dragging = true; side.style.transition = 'none';
    }
    side.style.translate = `${root.classList.contains('side-open') ? Math.min(0, dx) : Math.min(0, dx - width)}px 0`;
    event.preventDefault();
  };
  const end = (event: TouchEvent) => {
    if (startX === null) { reset(); return; }
    const dx = (event.changedTouches[0]?.clientX ?? startX) - startX;
    if (dragging) setOpen(root.classList.contains('side-open') ? dx > -width / 3 : dx > width / 3);
    reset();
  };
  root.addEventListener('touchstart', start, { passive: true });
  root.addEventListener('touchmove', move, { passive: false });
  root.addEventListener('touchend', end);
  root.addEventListener('touchcancel', reset);
  return () => {
    root.removeEventListener('touchstart', start); root.removeEventListener('touchmove', move);
    root.removeEventListener('touchend', end); root.removeEventListener('touchcancel', reset); reset();
  };
}
