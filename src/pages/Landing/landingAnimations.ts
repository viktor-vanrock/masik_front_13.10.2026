import { AnimationScope, clamp, fitCanvas, palette as C } from './animationScope';
import { makeOrb } from './orbRenderer';
import type { Orb } from './orbRenderer';
import { initializeOracle } from './oracle';

function initializeDust(scope: AnimationScope, orb: Orb) {
  const $ = <T extends Element = HTMLElement>(selector: string) => scope.get<T>(selector);
  /* pointer tilt for hero orb */
  const stage = scope.get('#orbStage');
  const heroEl = $('.hero');
  scope.on(heroEl, 'pointermove', (e) => {
    if (!orb) return;
    const r = stage.getBoundingClientRect();
    orb.st.tmx = clamp((e.clientX - (r.left + r.width / 2)) / r.width, -1, 1);
    orb.st.tmy = clamp(-(e.clientY - (r.top + r.height / 2)) / r.height, -1, 1);
  });
  scope.on(heroEl, 'pointerleave', () => { if (orb) { orb.st.tmx = 0; orb.st.tmy = 0; } });

  /* orbiting dust (2D, behind the orb) */
  (() => {
    const cv = $<HTMLCanvasElement>('#orbDust'), ctx = cv.getContext('2d');
    if (!ctx) return;
    const P = Array.from({ length: 70 }, () => ({ a: Math.random() * Math.PI * 2, r: .37 + Math.random() * .12, s: (.02 + Math.random() * .06) * (Math.random() < .5 ? -1 : 1), z: Math.random(), tilt: .25 + Math.random() * .25 }));
    scope.loop(cv, (t) => {
      const { w, h } = fitCanvas(cv, 2); ctx.clearRect(0, 0, w, h);
      const m = Math.min(w, h), cx = w / 2, cy = h / 2, e = orb ? orb.st.energy : 0;
      for (const p of P) {
        const a = p.a + t * p.s * (1 + e * 4);
        const x = cx + Math.cos(a) * p.r * m, y = cy + Math.sin(a) * p.r * m * p.tilt * 2.2 - (p.r - .37) * m * .4;
        const front = Math.sin(a) > 0;
        if (front && Math.hypot(x - cx, y - cy) < .335 * m) continue;
        ctx.globalAlpha = (.25 + .6 * p.z) * (.5 + e * .5);
        ctx.fillStyle = p.z > .8 ? `rgb(${C.hi})` : `rgb(${C.line})`;
        ctx.beginPath(); ctx.arc(x, y, (0.6 + p.z * 1.4) * (m / 600), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  })();


}

function initializeSections(scope: AnimationScope) {
  const RM = scope.reducedMotion;
  const $ = <T extends Element = HTMLElement>(selector: string) => scope.get<T>(selector);
  const $$ = (selector: string, root: Element = scope.root) => [...root.querySelectorAll<HTMLElement>(selector)];
  if (!RM && scope.canObserve) {
    $$('.rv').forEach(el => {
      if (el.getBoundingClientRect().top <= innerHeight) return;
      el.classList.add('rv-pre');
      scope.observe(el, (entry, observer) => {
        if (!entry.isIntersecting) return;
        el.classList.add('rv-in'); el.classList.remove('rv-pre'); observer.unobserve(el);
      }, { rootMargin: '0px 0px -8% 0px' });
    });
  }

  /* ═════════ MANIFESTO: scroll-lit words ═════════ */
  (() => {
    const el = $('#manifesto');
    const walk = (node: Node) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          (n.textContent ?? '').split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.append(part);
            else { const s = document.createElement('span'); s.className = 'w' + (node instanceof Element && node.classList.contains('accent') ? ' accent' : ''); s.textContent = part; frag.append(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    const ws = $$('.w', el);
    if (RM) { ws.forEach(w => w.classList.add('on')); return; }
    const upd = () => {
      const r = el.getBoundingClientRect();
      const k = clamp((innerHeight * .82 - r.top) / (r.height + innerHeight * .35), 0, 1);
      const n = Math.round(k * ws.length);
      ws.forEach((w, i) => w.classList.toggle('on', i < n));
    };
    scope.on(window, 'scroll', upd, { passive: true }); scope.on(window, 'resize', upd); upd();
  })();


  /* months-to-90% bars */
  (() => {
    const data: [string, number, number][] = [['MMLU', 2020, 18], ['GPQA Diamond', 2024, 6], ['LiveBench', 2026, 3]];
    const box = $('#bars');
    data.forEach(([n, y, m], i) => {
      const row = document.createElement('div'); row.className = 'brow' + (i === data.length - 1 ? ' hot' : '');
      row.innerHTML = `<div class="nm"><b>${n}</b><span>${y}</span></div><div class="btrack"><div class="bfill" style="--w:${m / 18 * 82}%;--o:${.35 + .5 * (m / 18)};--d:${i * .08}s"></div><span class="bv" style="--w:${m / 18 * 82}%;--d:${i * .08}s">${m} мес</span></div>`;
      box.appendChild(row);
    });
    if (RM || !scope.canObserve || box.getBoundingClientRect().top < innerHeight) { box.classList.remove('pre'); return; }
    scope.observe(box, (e, o) => { if (e.isIntersecting) { box.classList.remove('pre'); o.disconnect(); } }, { threshold: .35 });
  })();

  /* agentic growth: first public result → best, July 2026 */
  (() => {
    const DB: [string, string, number, number][] = [['SWE-bench', 'исправление реальных багов', 4, 95], ['OSWorld', 'работа за компьютером', 12, 85]];
    const dumb = $('#dumb'); if (!dumb) return;
    dumb.innerHTML = DB.map(([n, d, a, b], i) => `<div class="db-row"><div class="nm"><b>${n}</b><span>${d}</span></div><div class="db-track" role="img" aria-label="${n}: с ${a}% до ${b}%"><span class="db-bar" style="--a:${a}%;--b:${b}%;--d:${i * .08}s"></span><span class="db-start" style="--a:${a}%"></span></div><span class="v"><em>${a} →</em> ${b}%</span></div>`).join('');
    if (RM || !scope.canObserve) return;
    dumb.classList.add('pre');
    scope.observe(dumb, (e, o) => { if (e.isIntersecting) { scope.frame(() => dumb.classList.remove('pre')); o.disconnect(); } }, { threshold: .4 });
  })();


  /* ═════════ SCENARIO ART ═════════ */
  scope.all<HTMLCanvasElement>('canvas[data-art]').forEach(cv => {
    const ctx = cv.getContext('2d'), kind = cv.dataset.art;
    if (!ctx) return;
    // Создать: a wireframe crystal assembling itself
    const crystal = (() => {
      const V: [number, number, number][] = [[0, 1.25, 0], [0, -1.05, 0]]; const n = 6;
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; V.push([Math.cos(a) * .55, .35, Math.sin(a) * .55]); V.push([Math.cos(a) * .55, -.45, Math.sin(a) * .55]); }
      const E: [number, number][] = [];
      for (let i = 0; i < n; i++) { const u = 2 + i * 2, l = 3 + i * 2, un = 2 + ((i + 1) % n) * 2, ln = 3 + ((i + 1) % n) * 2; E.push([0, u], [u, un], [u, l], [l, ln], [l, 1]); }
      return { V, E };
    })();
    scope.loop(cv, (t) => {
      const { w, h, dpr } = fitCanvas(cv, 2); ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, m = Math.min(w, h);
      if (kind === 'create') {
        const ry = t * .45, rx = .35;
        const P = crystal.V.map(([x, y, z]) => { const X = x * Math.cos(ry) - z * Math.sin(ry); let Z = x * Math.sin(ry) + z * Math.cos(ry); const Y = y * Math.cos(rx) - Z * Math.sin(rx); Z = y * Math.sin(rx) + Z * Math.cos(rx); const s = m * .3 / (1 + Z * .25); return [cx + X * s, cy - Y * s, Z]; });
        const build = RM ? 1 : clamp((t % 10) / 4, 0, 1);
        const nE = Math.ceil(crystal.E.length * build);
        crystal.E.slice(0, nE).forEach(([a, b], i) => {
          const za = (P[a][2] + P[b][2]) / 2; ctx.strokeStyle = `rgba(${C.soft},${.35 + (za + 1) * .3})`; ctx.lineWidth = dpr * (i === nE - 1 && build < 1 ? 2 : 1);
          ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke();
        });
        P.forEach(([x, y, z]) => { ctx.fillStyle = `rgba(${C.hi},${.4 + (z + 1) * .3})`; ctx.beginPath(); ctx.arc(x, y, 2 * dpr, 0, 7); ctx.fill(); });
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, m * .35); rg.addColorStop(0, `rgba(${C.line},.22)`); rg.addColorStop(1, `rgba(${C.base},0)`); ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
      } else if (kind === 'boost') {
        for (let i = 0; i < 14; i++) {
          const k = i / 13, ph = t * .5 - k * 1.6;
          const s = m * (.08 + k * .34) * (1 + Math.sin(ph) * .04);
          const rot = Math.PI / 4 + Math.sin(ph) * .22 * (1 - k);
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
          ctx.strokeStyle = `rgba(${C.soft},${.85 - k * .6})`; ctx.lineWidth = dpr * (i === 0 ? 1.6 : 1);
          ctx.strokeRect(-s, -s, s * 2, s * 2); ctx.restore();
        }
        ctx.fillStyle = `rgb(${C.hi})`; ctx.shadowColor = C.glow; ctx.shadowBlur = 16 * dpr; ctx.beginPath(); ctx.arc(cx, cy, 3 * dpr, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      }
    });
  });

}

export function initializeLanding(root: HTMLElement): () => void {
  const scope = new AnimationScope(root);
  try {
    const orb = makeOrb(scope, scope.get<HTMLCanvasElement>('#orbGL'), { R: .335, baseEnergy: .12, seed: 3 });
    if (!orb) root.classList.add('no-gl');
    makeOrb(scope, scope.get<HTMLCanvasElement>('#ctaGL'), { R: .28, baseEnergy: .25, seed: 11, maxDpr: 2 });
    initializeDust(scope, orb);
    initializeOracle(scope, orb);
    initializeSections(scope);
    return scope.dispose;
  } catch (error) {
    scope.dispose();
    throw error;
  }
}
