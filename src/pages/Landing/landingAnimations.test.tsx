import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingContent } from './LandingContent';
import { initializeLanding } from './landingAnimations';
import { AnimationScope } from './animationScope';
import { makeOrb } from './orbRenderer';

const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;
const disconnect = vi.fn();
const observers: { target: Element | null; notify: (visible: boolean) => void }[] = [];
function notifyVisibility(target: Element, visible: boolean) {
  observers.filter(observer => observer.target === target).forEach(observer => observer.notify(visible));
}
const gl = {
  createShader: vi.fn(() => ({})), shaderSource: vi.fn(), compileShader: vi.fn(), getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(() => ({})), attachShader: vi.fn(), linkProgram: vi.fn(), getProgramParameter: vi.fn(() => true),
  useProgram: vi.fn(), createBuffer: vi.fn(() => ({})), bindBuffer: vi.fn(), bufferData: vi.fn(),
  getAttribLocation: vi.fn(() => 0), enableVertexAttribArray: vi.fn(), vertexAttribPointer: vi.fn(),
  getUniformLocation: vi.fn(() => ({})), viewport: vi.fn(), uniform2f: vi.fn(), uniform1f: vi.fn(),
  clearColor: vi.fn(), clear: vi.fn(), drawArrays: vi.fn(), deleteShader: vi.fn(), deleteBuffer: vi.fn(), deleteProgram: vi.fn(),
};
let now = 0;
function advanceFrame(milliseconds: number) {
  now += milliseconds;
  const scheduled = [...frames.values()];
  frames.clear();
  scheduled.forEach(callback => callback(now));
}

beforeEach(() => {
  vi.useFakeTimers();
  frames.clear(); observers.length = 0; frameId = 0; now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = ++frameId; frames.set(id, callback); return id;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('IntersectionObserver', class {
    target: Element | null = null;
    callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; observers.push(this); }
    disconnect = disconnect;
    unobserve() {}
    observe(target: Element) { this.target = target; }
    notify(visible: boolean) {
      this.callback([{ target: this.target, isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((context: string) =>
    context === 'webgl' ? gl as unknown as WebGLRenderingContext : null);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function renderLanding() {
  const { container } = render(<MemoryRouter><LandingContent /></MemoryRouter>);
  return container.querySelector<HTMLElement>('.bf-home')!;
}

describe('landing animation lifecycle', () => {
  it('restores React DOM and cancels every pending resource before mounting again', () => {
    const root = renderLanding();
    const original = root.innerHTML;
    const manifesto = root.querySelector('#manifesto')!;
    const originalText = manifesto.firstChild;
    for (let mount = 0; mount < 2; mount++) {
      const dispose = initializeLanding(root);
      expect(root.querySelectorAll('#gauge .tick')).toHaveLength(101);
      expect(root.querySelectorAll('#bars .brow')).toHaveLength(3);
      expect(root.querySelectorAll('#dumb .db-row')).toHaveLength(2);
      root.querySelector<HTMLButtonElement>('#predictBtn')!.click();
      advanceFrame(1000);
      expect(root.querySelector('#oracle')).toHaveClass('busy');
      dispose(); dispose();
      expect(frames.size).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
      expect(root.innerHTML).toBe(original);
      expect(root.querySelector('#manifesto')).toBe(manifesto);
      expect(manifesto.firstChild).toBe(originalText);
      root.querySelector<HTMLButtonElement>('#predictBtn')!.click();
      expect(frames.size).toBe(0);
    }
    expect(gl.deleteShader).toHaveBeenCalledTimes(8);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(4);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(4);
    expect(disconnect).toHaveBeenCalled();
  });

  it('shows successive predictions after 2100 ms and supports keyboard skill selection', () => {
    const root = renderLanding();
    const dispose = initializeLanding(root);
    const predict = root.querySelector<HTMLButtonElement>('#predictBtn')!;
    predict.click();
    advanceFrame(2099);
    expect(root.querySelector('#oracle')).toHaveClass('busy');
    advanceFrame(1);
    expect(root.querySelector('#oracle')).toHaveClass('done');
    expect(root.querySelector('#prophecyText')).toHaveTextContent('Модель решит задачу из пяти шагов');
    expect(root.querySelector('#gauge .readout')).toHaveTextContent('71.0');
    root.querySelector<HTMLButtonElement>('#againBtn')!.click();
    root.querySelector('.skills')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(root.querySelector('#sk-lang')).toHaveAttribute('aria-checked', 'true');
    predict.click();
    advanceFrame(2100);
    expect(root.querySelector('#prophecyTag')).toHaveTextContent('Язык · предсказание');
    expect(root.querySelector('#prophecyText')).toHaveTextContent('Модель поймёт пословицу');
    dispose();
  });

  it('finishes reduced-motion predictions after 50 ms and keeps scroll text visible', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)', media: query, onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));
    const root = renderLanding();
    const dispose = initializeLanding(root);
    expect(root.querySelector('#manifesto .w:not(.on)')).toBeNull();
    root.querySelector<HTMLButtonElement>('#predictBtn')!.click();
    advanceFrame(50);
    expect(root.querySelector('#oracle')).toHaveClass('done');
    expect(root.querySelector('#gauge .readout')).toHaveTextContent('71.0');
    dispose();
    expect(frames.size).toBe(0);
  });

  it('keeps reduced-motion energy nonnegative on the first observed frame after its initial draw', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const root = renderLanding();
    const scope = new AnimationScope(root);
    const canvas = scope.get<HTMLCanvasElement>('#orbGL');
    const orb = makeOrb(scope, canvas, { R: .335, baseEnergy: .12, seed: 3 })!;
    expect(orb.st.energy).toBeGreaterThan(0);
    notifyVisibility(canvas, true);
    advanceFrame(16);
    expect(orb.st.energy).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(orb.st.time)).toBe(true);
    scope.dispose();
  });

  it('runs idle gauge frames only while its stage and document are visible', () => {
    const root = renderLanding();
    const dispose = initializeLanding(root);
    const stage = root.querySelector('#orbStage')!;
    const needle = root.querySelector('#gauge .needle')!;
    const position = () => needle.getAttribute('cx');
    const initial = position();
    notifyVisibility(stage, true);
    advanceFrame(16);
    expect(position()).not.toBe(initial);
    const visible = position();
    notifyVisibility(stage, false);
    advanceFrame(16);
    expect(position()).toBe(visible);
    expect(frames.size).toBe(0);
    notifyVisibility(stage, true);
    advanceFrame(16);
    expect(position()).not.toBe(visible);
    const resumed = position();
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    advanceFrame(16);
    expect(position()).toBe(resumed);
    expect(frames.size).toBe(0);
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    advanceFrame(16);
    expect(position()).not.toBe(resumed);
    dispose();
  });

  it('keeps WebGL fallback scoped and restores it on cleanup', () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    const root = renderLanding();
    const dispose = initializeLanding(root);
    expect(root).toHaveClass('no-gl');
    expect(document.documentElement).not.toHaveClass('no-gl');
    dispose();
    expect(root).not.toHaveClass('no-gl');
  });
});
