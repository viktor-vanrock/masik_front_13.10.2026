export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const palette = {
  ink: '175,184,255', faint: '172,179,207', hi: '234,238,253', line: '133,148,226',
  soft: '178,190,243', base: '88,101,201', glow: '#afb8ff',
};

export class AnimationScope {
  readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  readonly canObserve = typeof IntersectionObserver !== 'undefined';
  private active = true;
  private frames = new Set<number>();
  private timers = new Set<number>();
  private cleanups: (() => void)[] = [];
  private restore: () => void;

  readonly root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
    // Keep React's original nodes so StrictMode can mount the same DOM again.
    const elements = [root, ...root.querySelectorAll('*')];
    const snapshots = elements.map(element => ({
      element, children: [...element.childNodes],
      attributes: [...element.attributes].map(({ name, value }) => [name, value] as const),
      texts: [...element.childNodes].filter((node): node is Text => node.nodeType === 3)
        .map(node => [node, node.data] as const),
    }));
    this.restore = () => {
      snapshots.reverse().forEach(({ element, children, attributes, texts }) => {
        for (const attr of [...element.attributes]) element.removeAttribute(attr.name);
        for (const [name, value] of attributes) element.setAttribute(name, value);
        if (children.length !== element.childNodes.length || children.some((child, i) => element.childNodes[i] !== child)) {
          element.replaceChildren(...children);
        }
        for (const [node, data] of texts) node.data = data;
      });
    };
  }

  get<T extends Element = HTMLElement>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing landing element: ${selector}`);
    return element;
  }

  all<T extends Element = HTMLElement>(selector: string): T[] {
    return [...this.root.querySelectorAll<T>(selector)];
  }

  cleanup(callback: () => void) { this.cleanups.push(callback); }

  on<K extends keyof WindowEventMap>(target: Window, key: K, listener: (event: WindowEventMap[K]) => void, options?: AddEventListenerOptions): void;
  on<K extends keyof DocumentEventMap>(target: Document, key: K, listener: (event: DocumentEventMap[K]) => void, options?: AddEventListenerOptions): void;
  on<K extends keyof HTMLElementEventMap>(target: HTMLElement, key: K, listener: (event: HTMLElementEventMap[K]) => void, options?: AddEventListenerOptions): void;
  on(target: EventTarget, key: string, listener: (event: never) => void, options?: AddEventListenerOptions) {
    if (!this.active) return;
    const callback = listener as EventListener;
    target.addEventListener(key, callback, options);
    this.cleanup(() => target.removeEventListener(key, callback, options));
  }

  frame(callback: FrameRequestCallback): number {
    if (!this.active) return 0;
    const id = requestAnimationFrame(now => {
      this.frames.delete(id);
      if (this.active) callback(now);
    });
    this.frames.add(id);
    return id;
  }

  cancelFrame(id: number) { cancelAnimationFrame(id); this.frames.delete(id); }

  timeout(callback: () => void, delay: number): number {
    if (!this.active) return 0;
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      if (this.active) callback();
    }, delay);
    this.timers.add(id);
    return id;
  }

  cancelTimeout(id: number) { clearTimeout(id); this.timers.delete(id); }

  observe(element: Element, callback: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void, options?: IntersectionObserverInit) {
    if (!this.canObserve || !this.active) return;
    const observer = new IntersectionObserver(entries => {
      if (this.active) entries.forEach(entry => callback(entry, observer));
    }, options);
    observer.observe(element);
    this.cleanup(() => observer.disconnect());
  }

  loop(element: Element, callback: (seconds: number) => void) {
    let visible = !this.canObserve, frame = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      callback((now - startTime) / 1000);
      if (!this.reducedMotion) frame = this.frame(tick);
    };
    const kick = () => { if (!frame) frame = this.frame(tick); };
    this.observe(element, entry => { visible = entry.isIntersecting; if (visible) kick(); }, { rootMargin: '120px' });
    this.on(document, 'visibilitychange', () => { if (!document.hidden && visible) kick(); });
    this.on(window, 'resize', kick);
    if (visible) kick();
    return { kick };
  }

  dispose = () => {
    if (!this.active) return;
    this.active = false;
    this.frames.forEach(id => cancelAnimationFrame(id));
    this.timers.forEach(id => clearTimeout(id));
    this.cleanups.reverse().forEach(callback => callback());
    this.frames.clear(); this.timers.clear();
    this.restore();
  };
}

export function fitCanvas(canvas: HTMLCanvasElement, maxDpr = 2) {
  const dpr = Math.min(devicePixelRatio || 1, maxDpr);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width * dpr)), h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  return { w, h, dpr };
}
