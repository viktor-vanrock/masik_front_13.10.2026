import { AnimationScope, clamp, lerp } from './animationScope';
import type { Orb } from './orbRenderer';

export function initializeOracle(scope: AnimationScope, orb: Orb) {
  const RM = scope.reducedMotion;
  const $ = <T extends Element = HTMLElement>(selector: string) => scope.get<T>(selector);
  const $$ = (selector: string) => scope.all(selector);
  const stage = $('#orbStage');
  const NS = 'http://www.w3.org/2000/svg';
  const gauge = $<SVGSVGElement>('#gauge');
  const G0 = 135, GS = 270, CX = 200, CY = 200;
  const pol = (deg: number, rad: number): [number, number] => { const a = deg * Math.PI / 180; return [CX + Math.cos(a) * rad, CY + Math.sin(a) * rad]; };
  const mk = (tag: string, attrs: Record<string, string | number>, parent: Element = gauge) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, String(attrs[k])); parent.appendChild(e); return e; };
  mk('circle', { cx: CX, cy: CY, r: 198, class: 'orbit' });
  const comet = mk('g', { class: 'comet' });
  for (let k = 0; k < 10; k++) { const a0 = -k * 4.2, a1 = a0 - 4.6; const [x0, y0] = pol(a0, 198), [x1, y1] = pol(a1, 198); mk('path', { d: `M${x0} ${y0} A198 198 0 0 0 ${x1} ${y1}`, 'stroke-width': 3 - k * .26, opacity: 1 - k * .095 }, comet); }
  mk('circle', { cx: pol(0, 198)[0], cy: pol(0, 198)[1], r: 3.2, fill: '#fff' }, comet);
  const ticks: SVGElement[] = [];
  for (let i = 0; i <= 100; i++) {
    const deg = G0 + GS * i / 100, maj = i % 10 === 0, mid = i % 5 === 0;
    const [x1, y1] = pol(deg, 186), [x2, y2] = pol(deg, maj ? 174 : mid ? 179 : 182);
    ticks.push(mk('line', { x1, y1, x2, y2, class: 'tick' + (maj ? ' maj' : mid ? ' mid' : '') }));

  }
  const arcPath = (v: number, rad: number) => { const [sx, sy] = pol(G0, rad), [ex, ey] = pol(G0 + GS * v / 100, rad); return `M${sx} ${sy} A${rad} ${rad} 0 ${GS * v / 100 > 180 ? 1 : 0} 1 ${ex} ${ey}`; };
  mk('path', { d: arcPath(100, 192), class: 'track' });
  const prog = mk('path', { d: arcPath(0.01, 192), class: 'prog' });
  const needle = mk('circle', { r: 3, class: 'needle', cx: pol(G0, 192)[0], cy: pol(G0, 192)[1] });
  // crosshair marks at the sphere's edge
  [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => { const r1 = 140, r2 = 150; mk('line', { x1: CX + dx * r1, y1: CY + dy * r1, x2: CX + dx * r2, y2: CY + dy * r2, class: 'cross' }); });
  const readout = mk('text', { x: CX, y: 370, 'text-anchor': 'middle', class: 'readout' }); readout.textContent = '—';
  const readLbl = mk('text', { x: CX, y: 352, 'text-anchor': 'middle', class: 'readout-lbl' }); readLbl.textContent = 'УВЕРЕННОСТЬ, %';
  let gv = 0;
  function setGauge(v: number) {
    gv = v; const vv = clamp(v, .01, 100);
    prog.setAttribute('d', arcPath(vv, 192));
    const [nx, ny] = pol(G0 + GS * vv / 100, 192); needle.setAttribute('cx', String(nx)); needle.setAttribute('cy', String(ny));
    ticks.forEach((t, i) => t.classList.toggle('on', i <= v));
  }
  setGauge(0);
  // idle: the needle breathes a little
  let idleT = 0, gaugeMode: 'idle' | 'busy' | 'shake' = 'idle';
  if (!RM) scope.loop(stage, () => { if (gaugeMode === 'idle') { idleT += .016; setGauge(lerp(gv, 8 + Math.sin(idleT * .9) * 5 + Math.sin(idleT * 2.3) * 1.5, .08)); } });

  /* ═════════ ORACLE ═════════ */
  type Skill = 'logic' | 'lang' | 'code' | 'data' | 'agents' | 'finance';
  const P: Record<Skill, { name: string; items: [string, number][] }> = {
    logic: { name: 'Логика', items: [
      ['Модель решит задачу из пяти шагов и споткнётся на условии из одного слова.', 71],
      ['Цепочка рассуждений сойдётся. На седьмом шаге — случайно.', 64],
      ['Модель ответит уверенно. Уверенность не равна точности.', 82]] },
    lang: { name: 'Язык', items: [
      ['Модель поймёт пословицу, но не поймёт, зачем её сказали.', 68],
      ['Падежи будут на месте. Ирония потеряется по дороге.', 74],
      ['Идиома останется дословным переводом с английского.', 59]] },
    code: { name: 'Код', items: [
      ['Все тесты пройдут. Крайний случай — нет.', 77],
      ['Функция заработает с первого раза. На вашем примере.', 66],
      ['Решение будет элегантным и на одну итерацию медленнее нужного.', 58]] },
    data: { name: 'Данные', items: [
      ['Таблица будет прочитана целиком. Пропущенная строка — тоже.', 69],
      ['Среднее посчитано верно. С медианой придётся проверить.', 63],
      ['Модель найдёт закономерность там, где её нет.', 72]] },
    agents: { name: 'Агенты', items: [
      ['Агент дойдёт до цели. По пути откроет четыре лишние вкладки.', 61],
      ['Девять шагов из десяти будут безупречны. Десятый решит всё.', 57],
      ['Агент справится. Насколько быстро, решит харнесс.', 66]] },
    finance: { name: 'Финансы', items: [
      ['Сложный процент без ошибок. Простая дата с ошибкой.', 67],
      ['Отчёт будет убедительным. Цифры в нём лучше перепроверить.', 70],
      ['Модель верно посчитает налог. За прошлый год.', 62]] }
  };
  const oracle = $('#oracle'), btn = $<HTMLButtonElement>('#predictBtn'), lbl = $('#predictLbl'), proph = $('#prophecy'), ptext = $('#prophecyText'), ptag = $('#prophecyTag');
  let skill: Skill = 'logic';
  const idx = { logic: 0, lang: 0, code: 0, data: 0, agents: 0, finance: 0 };
  let busy = false;
  $$('.skill').forEach(b => scope.on(b, 'click', () => {
    const selected = b.dataset.skill;
    if (selected && selected in P) skill = selected as Skill;
    $$('.skill').forEach(x => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
    if (orb && !busy) { orb.st.tEnergy = .35; orb.kick(); scope.timeout(() => { if (!busy) orb.st.tEnergy = oracle.classList.contains('done') ? .3 : .12; }, 380); }
  }));
  scope.on($<HTMLElement>('.skills'), 'keydown', (e) => {
    const bs = $$('.skill'), i = bs.findIndex(b => b.getAttribute('aria-checked') === 'true');
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = bs[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : bs.length - 1)) % bs.length]; n.click(); n.focus(); }
  });

  function predict() {
    if (busy) return;
    busy = true; gaugeMode = 'busy';
    const wasDone = oracle.classList.contains('done');
    oracle.classList.remove('done'); oracle.classList.add('busy');
    if (wasDone) swapDock();
    proph.classList.remove('show', 'out');
    btn.disabled = true; lbl.textContent = 'Шар думает…';
    if (orb) { orb.st.tEnergy = 1; orb.st.tReveal = 0; orb.kick(); }
    const [text, conf] = P[skill].items[idx[skill]++ % P[skill].items.length];
    const dur = RM ? 50 : 2100, t0 = performance.now(), sweepFrom = gv; let settleFrom = gv;
    (function spin(now: number) {
      const k = clamp((now - t0) / dur, 0, 1);
      let v;
      if (k < .7) { const u = k / .7; v = lerp(sweepFrom, 50 + 34 * Math.sin(u * Math.PI * 2.2 - Math.PI / 2 + .6), (x => x * x * (3 - 2 * x))(Math.min(1, u * 2.5))); settleFrom = v; }
      else { const u = (k - .7) / .3, e = 1 - Math.pow(1 - u, 3); v = lerp(settleFrom, conf, e); }
      setGauge(v); readout.textContent = v.toFixed(1);
      if (k < 1) scope.frame(spin); else reveal(text, conf);
    })(t0);
  }
  function reveal(text: string, conf: number) {
    setGauge(conf); readout.textContent = conf.toFixed(1);
    if (orb) { orb.st.tEnergy = .3; orb.st.tReveal = 1; }
    ptag.textContent = P[skill].name + ' · предсказание';
    ptext.replaceChildren();
    text.split(' ').forEach((w, i) => { const s = document.createElement('span'); s.className = 'wd'; s.textContent = w; s.style.transitionDelay = (0.1 + i * 0.05) + 's'; ptext.append(s, ' '); });
    scope.frame(() => scope.frame(() => proph.classList.add('show')));
    oracle.classList.remove('busy'); oracle.classList.add('done'); swapDock();
    btn.disabled = false; lbl.textContent = 'Получить предсказание'; busy = false;
  }
  function swapDock() { oracle.classList.remove('swapped'); void oracle.offsetWidth; oracle.classList.add('swapped'); }
  function reset() {
    proph.classList.add('out');
    scope.timeout(() => proph.classList.remove('show', 'out'), 150);
    oracle.classList.remove('done'); swapDock();
    if (orb) { orb.st.tEnergy = .12; orb.st.tReveal = 0; }
    gaugeMode = 'idle'; readout.textContent = '—';
    scope.timeout(() => $('.skill[aria-checked="true"]').focus(), 50);
  }
  scope.on(btn, 'click', predict);
  scope.on($<HTMLElement>('#againBtn'), 'click', reset);

  /* ═════════ PLAY: comet scan, idle invitation, shake-to-ask ═════════ */
  (() => {
    const hint = $('#orbHint'), hit = $('#orbHit');
    const HINT_IDLE = 'коснитесь или встряхните';
    let shakeTarget = 8, hovering = false, dragging = false, lastUser = 0, cometA = 200;

    /* comet + tick scan */
    const comet = $('#gauge .comet');
    let scanned = new Set<number>();
    const scan = () => {
      comet.setAttribute('transform', `rotate(${cometA.toFixed(2)} 200 200)`);
      const head = ((cometA % 360) + 360) % 360, now = new Set<number>();
      ticks.forEach((_, i) => { const ang = (G0 + GS * i / 100) % 360; const d = (((head - ang) % 360) + 360) % 360; if (d < 16) now.add(i); });
      scanned.forEach(i => { if (!now.has(i)) ticks[i].classList.remove('scan'); });
      now.forEach(i => ticks[i].classList.add('scan'));
      scanned = now;
    };

    /* idle invitation: a soft shockwave every few seconds until someone plays */
    let nextCall = performance.now() + 3000;
    function invite(now: number) {
      if (RM || busy || dragging || hovering || oracle.classList.contains('done')) { nextCall = now + 3000; return; }
      if (now - lastUser < 6000 || now < nextCall) return;
      nextCall = now + 6000;
      if (orb) { orb.shock(); orb.st.tEnergy = .55; scope.timeout(() => { if (!busy && !hovering) orb.st.tEnergy = .12; }, 700); }
      hint.classList.remove('call'); void hint.offsetWidth; hint.classList.add('call');
    }

    /* hover wakes the orb */
    scope.on(stage, 'pointerenter', (e) => { if (e.pointerType !== 'mouse') return; hovering = true; if (orb && !busy) { orb.st.tEnergy = .3; orb.kick(); } if (!busy) hint.textContent = 'встряхните шар'; });
    scope.on(stage, 'pointerleave', (e) => { if (e.pointerType !== 'mouse') return; hovering = false; if (orb && !busy && !oracle.classList.contains('done')) orb.st.tEnergy = .12; hint.textContent = HINT; });

    /* drag to spin, shake to ask */
    let lx = 0, ly = 0, lt = 0, moved = 0, lastDir = 0, flips: number[] = [], suppressClick = false;
    let capturedPointer: number | null = null;
    scope.cleanup(() => {
      if (capturedPointer !== null && hit.hasPointerCapture(capturedPointer)) hit.releasePointerCapture(capturedPointer);
    });
    scope.on(hit, 'pointerdown', (e) => {
      dragging = true; lastUser = performance.now(); lx = e.clientX; ly = e.clientY; lt = performance.now(); moved = 0; lastDir = 0; flips = [];
      try { hit.setPointerCapture(e.pointerId); capturedPointer = e.pointerId; } catch { /* Optional device capability. */ }
      if (orb && !busy) { orb.st.tEnergy = .5; orb.kick(); }
    });
    scope.on(hit, 'pointermove', (e) => {
      if (!dragging) return;
      const now = performance.now(), dx = e.clientX - lx, dy = e.clientY - ly, dt = Math.max(8, now - lt);
      lx = e.clientX; ly = e.clientY; lt = now; moved += Math.abs(dx) + Math.abs(dy);
      if (orb) { orb.st.vsx = clamp(orb.st.vsx + dx * .03, -8, 8); orb.st.vsy = clamp(orb.st.vsy + dy * .02, -5, 5); orb.kick(); }
      if (busy) return;
      const dir = Math.abs(dx) > 2 ? Math.sign(dx) : 0;
      if (dir && lastDir && dir !== lastDir && Math.abs(dx) / dt > .12) flips.push(now);
      if (dir) lastDir = dir;
      flips = flips.filter(t => now - t < 1400);
      const level = Math.min(1, flips.length / 4);
      if (moved > 12) {
        gaugeMode = 'shake'; shakeTarget = 6 + level * 90;
        hint.textContent = level > 0 ? (level < 1 ? 'сильнее…' : 'шар услышал') : 'встряхните шар';
        if (orb) orb.st.tEnergy = .45 + .5 * level;
      }
      if (flips.length >= 4) {
        flips = []; dragging = false; suppressClick = true;
        if (oracle.classList.contains('done')) { reset(); scope.timeout(predict, 260); } else predict();
      }
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (moved > 10) suppressClick = true;
      if (!busy) { if (gaugeMode === 'shake') gaugeMode = 'idle'; if (orb) orb.st.tEnergy = oracle.classList.contains('done') ? .3 : (hovering ? .3 : .12); hint.textContent = hovering ? 'встряхните шар' : HINT; }
    };
    scope.on(hit, 'pointerup', end);
    scope.on(hit, 'pointercancel', end);

    /* ── long-press to spin (touch): page scroll stays intact until the hold engages ── */
    const ask = () => { lastUser = performance.now(); if (oracle.classList.contains('done')) { reset(); scope.timeout(predict, 260); } else predict(); };
    let hold: { x: number; y: number; lx: number; on: boolean; timer: number; raf: number } | null = null;
    const holdLoop = () => {
      if (!hold || !hold.on) return;
      if (orb) { orb.st.vsx = clamp(orb.st.vsx + .22, -8, 8); orb.st.tEnergy = busy ? 1 : .7; orb.kick(); }
      if (!busy) { gaugeMode = 'shake'; shakeTarget = Math.min(96, shakeTarget + .6); }
      hold.raf = scope.frame(holdLoop);
    };
    const holdStop = () => {
      if (!hold) return;
      scope.cancelTimeout(hold.timer); scope.cancelFrame(hold.raf);
      const was = hold.on; hold = null; stage.classList.remove('holding');
      if (was) { suppressClick = true; if (!busy) { gaugeMode = 'idle'; if (orb) orb.st.tEnergy = oracle.classList.contains('done') ? .3 : .12; hint.textContent = HINT; } }
    };
    scope.on(hit, 'touchstart', (e) => {
      if (e.touches.length !== 1) { holdStop(); return; }
      const t = e.touches[0];
      hold = { x: t.clientX, y: t.clientY, lx: t.clientX, on: false, timer: 0, raf: 0 };
      hold.timer = scope.timeout(() => { if (!hold) return; hold.on = true; shakeTarget = 6; stage.classList.add('holding'); hint.textContent = 'шар крутится'; try { navigator.vibrate?.(12); } catch { /* Optional device capability. */ } holdLoop(); }, 380);
    }, { passive: true });
    scope.on(hit, 'touchmove', (e) => {
      if (!hold) return;
      const t = e.touches[0];
      if (!hold.on) { if (Math.hypot(t.clientX - hold.x, t.clientY - hold.y) > 8) { scope.cancelTimeout(hold.timer); hold = null; } return; } // user is scrolling — let the page scroll
      e.preventDefault(); // hold engaged: finger steers the orb, page stays put
      const dx = t.clientX - hold.lx; hold.lx = t.clientX;
      if (orb) { orb.st.vsx = clamp(orb.st.vsx + dx * .05, -8, 8); orb.kick(); }
    }, { passive: false });
    scope.on(hit, 'touchend', holdStop);
    scope.on(hit, 'touchcancel', holdStop);
    scope.on(hit, 'contextmenu', (e) => e.preventDefault());

    /* ── shake the phone to ask (accelerometer) ── */
    const HINT_TOUCH = 'коснитесь или удерживайте', HINT_SHAKE = 'коснитесь или встряхните телефон';
    let HINT = matchMedia('(pointer: coarse)').matches ? HINT_TOUCH : HINT_IDLE, motionOn = false, peaks: number[] = [], lastShake = 0;
    let prev: { x: number; y: number; z: number } | null = null;
    hint.textContent = HINT;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity; if (!a || a.x == null || a.y == null || a.z == null) return;
      if (!motionOn) { motionOn = true; HINT = HINT_SHAKE; if (!busy && !dragging) hint.textContent = HINT; }
      if (prev) {
        const d = Math.abs(a.x - prev.x) + Math.abs(a.y - prev.y) + Math.abs(a.z - prev.z), now = performance.now();
        if (d > 24) { peaks.push(now); if (orb && !busy) { orb.st.vsx = clamp(orb.st.vsx + (a.x - prev.x) * .15, -8, 8); orb.st.tEnergy = .6; orb.kick(); } }
        peaks = peaks.filter((p) => now - p < 900);
        if (peaks.length >= 3 && now - lastShake > 2500 && !busy && !views_hidden()) { peaks = []; lastShake = now; try { navigator.vibrate?.([20, 40, 20]); } catch { /* Optional device capability. */ } ask(); }
      }
      prev = { x: a.x, y: a.y, z: a.z };
    };
    const views_hidden = () => !scope.root.isConnected || $('#top').hidden || document.hidden;
    const motion = typeof DeviceMotionEvent === 'undefined' ? null : DeviceMotionEvent as typeof DeviceMotionEvent & { requestPermission?: () => Promise<string> };
    const needsPerm = typeof motion?.requestPermission === 'function';
    if (typeof DeviceMotionEvent !== 'undefined' && !needsPerm) scope.on(window, 'devicemotion', onMotion);
    if (needsPerm) { // iOS: permission can only be asked from a tap
      const askPerm = () => { motion?.requestPermission?.().then((s) => { if (s === 'granted') scope.on(window, 'devicemotion', onMotion); }).catch(() => {}); };
      scope.on(hit, 'click', askPerm, { once: true });
    }
    scope.on(hit, 'click', () => {
      if (suppressClick) { suppressClick = false; return; }
      lastUser = performance.now();
      if (oracle.classList.contains('done')) { reset(); scope.timeout(predict, 260); } else predict();
    });

    /* one frame loop for the stage */
    let last = 0;
    scope.loop(stage, (t) => {
      const dt = Math.min(.05, t - last || .016); last = t;
      const e = orb ? orb.st.energy : 0;
      if (!RM) cometA += dt * (38 + e * 120);
      if (gaugeMode === 'shake') setGauge(lerp(gv, shakeTarget, 1 - Math.pow(.004, dt)));
      scan(); invite(performance.now());
    });
    scan();
  })();

}
