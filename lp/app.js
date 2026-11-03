(() => {
  const { COURSES, RECORDS } = window.SITE_DATA;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const pad = (n) => String(n).padStart(2, '0');

  const crateEl = $('#crate');
  const stackEl = $('#stack');
  const dotsEl = $('#dots');
  const albumEl = $('#album');
  const playerEl = $('#player');

  const inkColor = (rec) => (rec.ink === 'light' ? '#ededed' : '#0a0a0a');
  const recVars = (rec) => `--g1:${rec.grad[0]};--g2:${rec.grad[1]};--ink:${inkColor(rec)}`;

  /* ───────────────────────── 카드 마크업 ───────────────────────── */
  function cardHTML(rec, i, { tag = 'a', front = false } = {}) {
    const light = rec.ink === 'light' ? '-light' : '';
    const attrs = tag === 'a'
      ? `href="#/${rec.id}" draggable="false" aria-label="${esc(rec.title)} 앨범 열기"${front ? '' : ' tabindex="-1"'}`
      : 'aria-hidden="true"';
    return `
      <div class="vinyl" aria-hidden="true">
        <div class="vinyl__disc"><div class="vinyl__label"><span>${esc(rec.short)}</span></div></div>
        <div class="vinyl__sheen"></div>
      </div>
      <${tag} class="card" data-ink="${rec.ink}" ${attrs}>
        <div class="card__ring card__ring--1"><img src="assets/ring-1${light}.svg" alt="" draggable="false"></div>
        <div class="card__ring card__ring--2"><img src="assets/ring-2${light}.svg" alt="" draggable="false"></div>
        <div class="card__gloss"></div>
        <p class="card__num">${pad(i + 1)}</p>
        <div class="card__chip">${esc(rec.card.chip)}</div>
        <p class="card__title">${esc(rec.card.title)}</p>
        <p class="card__sub">${esc(rec.card.sub)}</p>
        <div class="card__go"><img src="assets/arrow-button${light}.svg" alt="" draggable="false"></div>
        <div class="card__arrow"><span><img src="assets/arrow${light}.svg" alt="" draggable="false"></span></div>
        <div class="card__tint"></div>
      </${tag}>`;
  }

  /* ───────────────────────── 카드 셔플 스택 ─────────────────────────
     Figma 모션: 뒤 카드일수록 작게·위로·기울고·흐리고·어둡게.
     맨 앞 카드는 살짝 당겼다가(wind-up) 오른쪽으로 날아가고, 나머지는 스프링으로 한 칸씩 올라온다. */
  const DEPTHS = [
    { y: 0, s: 1, r: 0, b: 0, t: 0.01, o: 1 },
    { y: -72, s: 0.93, r: -1.6, b: 0, t: 0.12, o: 1 },
    { y: -132, s: 0.86, r: 2.2, b: 1.5, t: 0.24, o: 1 },
    { y: -188, s: 0.79, r: -2.4, b: 3, t: 0.36, o: 1 },
    { y: -240, s: 0.72, r: 2.8, b: 5, t: 0.5, o: 0.55 },
  ];
  const HIDDEN = { y: -284, s: 0.65, r: 0, b: 8, t: 0.6, o: 0 };
  const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const EASE_IN = 'cubic-bezier(0.5, 0, 1, 0.6)';
  const TRANSITION = `transform 0.76s ${SPRING}, filter 0.76s ${EASE_OUT}, opacity 0.76s ${EASE_OUT}`;

  let order = RECORDS.map((_, i) => i);
  let slots = [];
  let k = 1;
  let drag = null;
  let suppressClick = false;
  let lastStep = 0;

  const T = (x, y, r, s) => `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`;

  function applyDepth(slot, d, { instant = false, delay = 0 } = {}) {
    slot.style.transition = instant ? 'none' : TRANSITION;
    slot.style.transitionDelay = delay ? `${delay}ms` : '';
    slot.style.transform = T(0, d.y * k, d.r, d.s);
    slot.style.filter = d.b ? `blur(${(d.b * k).toFixed(2)}px)` : 'none';
    slot.style.opacity = d.o;
    slot.style.setProperty('--tint', d.t);
  }

  function layout(opts = {}) {
    order.forEach((ri, depth) => {
      const slot = slots[ri];
      if (slot.flying) return;
      slot.style.zIndex = 10 - depth;
      slot.classList.toggle('is-front', depth === 0);
      const a = $('a.card', slot);
      a.tabIndex = depth === 0 ? 0 : -1;
      slot.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
      applyDepth(slot, DEPTHS[depth] || HIDDEN, { ...opts, delay: opts.stagger ? (DEPTHS.length - depth) * 70 : 0 });
    });
    $$('.dot', dotsEl).forEach((d, i) => d.setAttribute('aria-selected', String(i === order[0])));
  }

  function measure() {
    k = stackEl.clientWidth / 720;
  }

  function buildStack() {
    stackEl.innerHTML = '';
    slots = RECORDS.map((rec, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.i = i;
      slot.setAttribute('style', recVars(rec));
      slot.setAttribute('role', 'group');
      slot.setAttribute('aria-roledescription', 'slide');
      slot.setAttribute('aria-label', `${i + 1} / ${RECORDS.length} · ${rec.title}`);
      slot.innerHTML = cardHTML(rec, i);
      stackEl.appendChild(slot);
      return slot;
    });
    dotsEl.innerHTML = RECORDS.map((rec, i) =>
      `<button class="dot" type="button" role="tab" data-i="${i}" aria-label="${esc(rec.title)}"></button>`).join('');

    measure();
    slots.forEach((s) => applyDepth(s, HIDDEN, { instant: true }));
    void stackEl.offsetWidth;
    layout({ stagger: !reduceMotion });
    setTimeout(() => slots.forEach((s) => (s.style.transitionDelay = '')), 900);
  }

  // 맨 앞 카드를 dir 방향(1 = 오른쪽)으로 던지고 다음 카드를 앞으로
  function next(dir = 1, from = null) {
    const ri = order.shift();
    order.push(ri);
    const slot = slots[ri];
    slot.flying = true;
    slot.classList.remove('is-front');
    slot.classList.add('is-flying');
    slot.style.transition = 'none';
    slot.style.zIndex = 30;

    const out = T(1040 * k * dir, 60 * k, -20 * dir, 0.98);
    const dur = reduceMotion ? 1 : 760;
    const frames = from
      ? [{ transform: from, easing: EASE_IN }, { transform: out }]
      : [
          { transform: T(0, 0, 0, 1), easing: EASE_OUT },
          { transform: T(-34 * k * dir, -28 * k, -3 * dir, 1.05), offset: 0.237, easing: EASE_IN },
          { transform: out },
        ];
    const fly = slot.animate(frames, { duration: from ? Math.min(dur, 480) : dur, fill: 'forwards' });
    slot.animate([{ opacity: 1 }, { opacity: 1, offset: 0.84 }, { opacity: 0 }], { duration: from ? Math.min(dur, 480) : dur, fill: 'forwards' });

    // 나머지 카드: wind-up이 끝날 즈음 한 칸씩 승격
    setTimeout(() => layout(), from || reduceMotion ? 0 : 140);

    fly.finished.then(() => {
      slot.flying = false;
      slot.classList.remove('is-flying');
      applyDepth(slot, HIDDEN, { instant: true });
      slot.getAnimations().forEach((a) => a.cancel());
      void slot.offsetWidth;
      layout();
    });
  }

  // 맨 뒤 카드를 왼쪽에서 다시 앞으로
  function prev() {
    const ri = order.pop();
    order.unshift(ri);
    const slot = slots[ri];
    slot.getAnimations().forEach((a) => a.cancel());
    slot.flying = false;
    slot.style.transition = 'none';
    slot.style.transform = T(-1040 * k, 60 * k, 20, 0.98);
    slot.style.opacity = 0;
    slot.style.filter = 'none';
    slot.style.zIndex = 20;
    void slot.offsetWidth;
    layout();
    slot.style.transition = `transform 0.7s ${EASE_OUT}, opacity 0.35s ${EASE_OUT}`;
  }

  function step(fn) {
    const now = performance.now();
    if (now - lastStep < 260) return;
    lastStep = now;
    fn();
  }

  // 특정 앨범을 맨 앞으로 (점·뒷카드 클릭)
  async function shuffleTo(ri) {
    const n = (order.indexOf(ri) + RECORDS.length) % RECORDS.length;
    if (n === 0) return;
    const back = RECORDS.length - n;
    const forward = n <= back;
    for (let i = 0; i < (forward ? n : back); i++) {
      forward ? next(1) : prev();
      lastStep = performance.now();
      await new Promise((r) => setTimeout(r, reduceMotion ? 0 : 220));
    }
  }

  function setFront(ri) {
    order = [...order.slice(order.indexOf(ri)), ...order.slice(0, order.indexOf(ri))];
    slots.forEach((s) => { s.flying = false; s.classList.remove('is-flying'); s.getAnimations().forEach((a) => a.cancel()); });
    layout({ instant: true });
  }

  /* 드래그 / 스와이프 */
  stackEl.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const slot = e.target.closest('.slot');
    if (!slot || !slot.classList.contains('is-front')) return;
    drag = { slot, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, t0: performance.now(), moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x0;
    drag.dy = e.clientY - drag.y0;
    if (!drag.moved) {
      if (Math.abs(drag.dx) < 8 || Math.abs(drag.dx) < Math.abs(drag.dy)) {
        if (Math.abs(drag.dy) > 12) drag = null; // 세로 스크롤 의도
        return;
      }
      drag.moved = true;
      drag.slot.setPointerCapture?.(drag.id);
      drag.slot.style.transition = 'none';
    }
    drag.slot.style.transform = T(drag.dx, drag.dy * 0.18, drag.dx * 0.045, 1.02);
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { slot, dx, dy, t0, moved } = drag;
    drag = null;
    if (!moved) return;
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
    const v = dx / Math.max(1, performance.now() - t0);
    if (Math.abs(dx) > 200 * k || Math.abs(v) > 0.55) {
      lastStep = performance.now();
      next(Math.sign(dx) || 1, T(dx, dy * 0.18, dx * 0.045, 1.02));
    } else {
      slot.style.transition = `transform 0.55s ${SPRING}`;
      slot.style.transform = T(0, 0, 0, 1);
    }
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  stackEl.addEventListener('click', (e) => {
    const slot = e.target.closest('.slot');
    if (!slot) return;
    if (suppressClick) { e.preventDefault(); return; }
    if (!slot.classList.contains('is-front')) {
      e.preventDefault();
      shuffleTo(Number(slot.dataset.i));
    }
  });

  let wheelAcc = 0;
  stackEl.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 60) {
      const d = Math.sign(wheelAcc);
      wheelAcc = 0;
      step(() => (d > 0 ? next(1) : prev()));
    }
  }, { passive: false });

  $('#next').addEventListener('click', () => step(() => next(1)));
  $('#prev').addEventListener('click', () => step(prev));
  dotsEl.addEventListener('click', (e) => {
    const d = e.target.closest('.dot');
    if (d) shuffleTo(Number(d.dataset.i));
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (!crateEl.hidden) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(() => next(1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(prev); }
    } else if (e.key === 'Escape') {
      if (!playerEl.hidden) closePlayer();
      else location.hash = '#/';
    }
  });

  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { measure(); layout({ instant: true }); }, 80);
  });

  /* ───────────────────────── 과목 정보 ───────────────────────── */
  const REC8 = ['GE', 'DS', '구 ICT창업', '구 ICT융합', '구 ACE', 'AI융합 ICT', 'AI융합 ACE', 'AI융합 전 트랙'];
  const REC3 = ['GE', 'AI융합', 'DS'];

  function course(entry) {
    const e = typeof entry === 'string' ? { c: entry } : entry;
    const c = COURSES[e.c];
    if (!c) { console.warn('Unknown course', e.c); return null; }
    const [ko, en, eng, cr, th, lab, yr, sem, rec, alt] = c;
    return { ...e, ko, en, eng, cr, th, lab, y: e.y ?? yr, s: e.s ?? sem, rec, code: alt || e.c };
  }

  const yearLabel = (y) => (y === '공통' ? '전 학년' : `${String(y).replace(',', '·')}학년`);
  const semLabel = (s) => (s === '계절' ? '계절학기' : `${String(s).replace(',', '·')}학기`);
  const when = (t) => `${yearLabel(t.y)} ${semLabel(t.s)}`;

  function recognized(rec) {
    if (!rec) return [];
    if (rec.startsWith('T:')) return rec.slice(2).split(',').map((l) => ({ l }));
    const labels = rec.length === 8 ? REC8 : REC3;
    return [...rec].map((ch, i) => (ch === '.' ? null : { l: labels[i], req: ch === '@', cond: ch === '△' })).filter(Boolean);
  }

  function badges(t) {
    const out = [];
    if (t.tag === 'req') out.push('<span class="badge badge--req">필수</span>');
    if (t.tag === 'cond') out.push('<span class="badge badge--cond">△ 트랙별 확인</span>');
    if (t.tag === 'other') out.push('<span class="badge">타학부</span>');
    if (t.eng === 1) out.push('<span class="badge badge--en">EN</span>');
    return out.join('');
  }

  /* ───────────────────────── 블록 렌더러 ───────────────────────── */
  let registry = [];

  const listItem = (it) => (typeof it === 'string'
    ? `<li>${md(it)}</li>`
    : `<li>${md(it.text)}${it.sub ? `<ul>${it.sub.map((s) => `<li>${md(s)}</li>`).join('')}</ul>` : ''}</li>`);

  function renderTracks(b) {
    const groups = b.groups.map((g, gi) => {
      const items = g.items.map(course).filter(Boolean);
      const total = items.reduce((a, t) => a + t.cr, 0);
      const rows = items.map((t, ti) => {
        const id = registry.push(t) - 1;
        return `
          <li class="track" tabindex="0" role="button" data-t="${id}" aria-label="${esc(t.ko)} 과목 정보 보기">
            <span class="track__n"><span class="num">${pad(ti + 1)}</span><span class="play" aria-hidden="true">▶</span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></span>
            <span class="track__name"><span class="track__ko">${esc(t.ko)}</span>${t.en && t.en !== t.ko ? `<span class="track__en">${esc(t.en)}</span>` : ''}</span>
            <span class="track__side">${badges(t)}<span class="track__when">${esc(when(t))}</span><span class="track__code">${esc(t.code)}</span></span>
            <span class="track__dur">${t.cr}:00</span>
          </li>`;
      }).join('');
      return `
        <div class="tl-group">
          <div class="tl-group__head">
            <span class="tl-group__name"><i>SIDE ${String.fromCharCode(65 + gi)}</i>${esc(g.name)}</span>
            <span class="tl-group__meta">${items.length} tracks · ${total}:00</span>
          </div>
          <ol class="tracks">${rows}</ol>
        </div>`;
    }).join('');
    return `<div class="tracklist">${b.title ? `<h3 class="tracklist__title">${esc(b.title)}</h3>` : ''}${groups}</div>`;
  }

  const SEMS = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

  function timelineGrid(lanes, phases) {
    const years = [1, 2, 3, 4].map((y, i) =>
      `<div class="tl-year" style="grid-column:${i * 2 + 1} / span 2">${y}학년${phases ? `<small>${esc(phases[i])}</small>` : ''}</div>`).join('');
    const sems = SEMS.map((s, i) => `<div class="tl-head-cell" style="grid-row:2;grid-column:${i + 1}">${s}</div>`).join('');
    const rows = lanes.map((lane) => `
      <div class="tl-row">
        <div class="tl-row__label">${esc(lane.name)}</div>
        <div class="tl-cells">${lane.items.map(([n, s, e, tag]) =>
          `<div class="tl-item${tag ? ` tl-item--${tag}` : ''}" style="grid-column:${s} / ${e + 1}">${esc(n)}</div>`).join('')}</div>
      </div>`).join('');
    return `
      <div class="tl-scroll"><div class="tl-grid">
        <div class="tl-row"><div class="tl-row__label"></div><div class="tl-cells tl-cells--head">${years}${sems}</div></div>
        ${rows}
      </div></div>`;
  }

  function renderTimeline(b) {
    const legend = `<div class="tl-legend"><span><i class="l-req"></i>필수</span><span><i></i>AI융합학부 개설</span><span><i class="l-other"></i>타학부 개설</span></div>`;
    if (!b.variants) return `<div class="timeline">${timelineGrid(b.lanes, b.phases)}${legend}</div>`;
    const id = `tl${registry.length}-${Math.random().toString(36).slice(2, 6)}`;
    timelineVariants[id] = b;
    return `
      <div class="timeline" data-tl="${id}">
        <div class="variant-switch" role="group" aria-label="이수 학점 선택">
          ${b.variants.map((v, i) => `<button type="button" data-v="${i}" aria-pressed="${i === 0}">${esc(v.name)}</button>`).join('')}
        </div>
        <div class="tl-body">${timelineGrid(b.variants[0].lanes)}</div>
        ${legend}
      </div>`;
  }
  const timelineVariants = {};

  function flowStep(st) {
    if (typeof st === 'string') return `<span class="flow__chip">${esc(st)}</span>`;
    const chips = st.items.map((x) => `<span class="flow__chip">${esc(x)}</span>`);
    const joiner = `<span class="flow__join">${esc(st.join)}</span>`;
    const inner = st.join ? chips.join(joiner) + (chips.length === 1 ? joiner : '') : chips.join('');
    return `<span class="flow__group${st.join ? ' flow__group--inline' : ''}">${inner}${st.caption ? `<span class="flow__cap">${esc(st.caption)}</span>` : ''}</span>`;
  }

  function renderDiscs(b, rec, discId) {
    const cur = b.discs.find((d) => d.id === discId) || b.discs[0];
    const tabs = b.discs.map((d, i) => `
      <button class="disc-tab" type="button" role="tab" data-disc="${d.id}" aria-selected="${d.id === cur.id}" style="--dc:${d.color}">
        <span class="disc-tab__disc"></span>
        <span><b>Disc ${i + 1} · ${esc(d.name)}</b><small>${esc(d.en)}</small></span>
      </button>`).join('');
    return `
      <div class="discs" data-rec="${rec.id}">
        <div class="discs__tabs" role="tablist" aria-label="트랙 선택">${tabs}</div>
        <div class="disc-panel" style="--dc:${cur.color}">${cur.blocks.map((x) => block(x, rec)).join('')}</div>
      </div>`;
  }

  function block(b, rec, ctx = {}) {
    switch (b.t) {
      case 'p': return `<p>${md(b.text)}</p>`;
      case 'h': return `<h3>${md(b.text)}</h3>`;
      case 'ul': return `<ul class="list">${b.items.map(listItem).join('')}</ul>`;
      case 'ol': return `<ol class="list list--ol">${b.items.map(listItem).join('')}</ol>`;
      case 'note': return `<div class="note${b.tone ? ` note--${b.tone}` : ''}"><div>${md(b.text)}</div></div>`;
      case 'facts': return `<dl class="facts">${b.items.map((f) => `<div><dt>${esc(f.k)}</dt><dd>${md(f.v)}</dd></div>`).join('')}</dl>`;
      case 'stats': return `<div class="stats">${b.items.map((s) => `<div class="stat"><div class="stat__v">${esc(s.v)}<span class="stat__u">${esc(s.u)}</span></div><div class="stat__k">${esc(s.k)}</div></div>`).join('')}</div>`;
      case 'credits': return `<dl class="credits">${b.items.map(([k2, v]) => `<div><dt>${esc(k2)}</dt><span class="leader"></span><dd>${md(v)}</dd></div>`).join('')}</dl>`;
      case 'table': return `<div class="table-wrap"><table><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'cards': return `<div class="cards${b.compact ? ' cards--compact' : ''}">${b.items.map((c) => {
        const target = c.href && RECORDS.find((r) => `#/${r.id}` === c.href);
        const tag = c.href ? 'a' : 'div';
        const style = target ? ` style="--cg1:${target.grad[0]};--cg2:${target.grad[1]}"` : '';
        return `<${tag} class="info-card"${c.href ? ` href="${c.href}"` : ''}${style}>
          ${c.href ? '<span class="info-card__go" aria-hidden="true">↗</span>' : ''}
          ${c.kicker ? `<div class="info-card__kicker">${esc(c.kicker)}</div>` : ''}
          ${c.title ? `<div class="info-card__title">${esc(c.title)}</div>` : ''}
          ${c.sub ? `<div class="info-card__sub">${esc(c.sub)}</div>` : ''}
          ${c.body ? `<p class="info-card__body">${md(c.body)}</p>` : ''}
          ${c.list ? `<ul class="list">${c.list.map(listItem).join('')}</ul>` : ''}
        </${tag}>`;
      }).join('')}</div>`;
      case 'tracks': return renderTracks(b);
      case 'timeline': return renderTimeline(b);
      case 'flow': return `<div class="flow">${b.rows.map((r) => `<div class="flow__row">${r.label ? `<span class="flow__label">${esc(r.label)}</span>` : ''}${r.steps.map(flowStep).join('<span class="flow__arrow" aria-label="다음">→</span>')}</div>`).join('')}</div>`;
      case 'discs': return renderDiscs(b, rec, ctx.disc);
      default: console.warn('Unknown block', b); return '';
    }
  }

  function eventsSection(rec) {
    const list = rec.events || [];
    const body = list.length
      ? `<div class="tracklist"><div class="tl-group"><div class="tl-group__head"><span class="tl-group__name"><i>SIDE B</i>학부 행사</span><span class="tl-group__meta">${list.length} tracks</span></div>
          <ol class="tracks">${list.map((ev, i) => `
            <li class="track"><span class="track__n"><span class="num">${pad(i + 1)}</span></span>
              <span class="track__name"><span class="track__ko">${esc(ev.title)}</span>${ev.desc ? `<span class="track__en">${esc(ev.desc)}</span>` : ''}</span>
              <span class="track__side">${ev.tag ? `<span class="badge">${esc(ev.tag)}</span>` : ''}${ev.place ? `<span class="track__when">${esc(ev.place)}</span>` : ''}</span>
              <span class="track__dur">${esc(ev.date || '')}</span></li>`).join('')}</ol></div></div>`
      : `<div class="empty"><div class="empty__disc" aria-hidden="true"></div><h3>Coming Soon</h3><p>학부 행사 소식이 준비되는 대로 이 B-Side에 트랙이 추가됩니다.</p></div>`;
    return [{ id: 'tracklist', side: 'A1', title: 'Tracklist', html: body }];
  }

  /* ───────────────────────── 앨범 상세 ───────────────────────── */
  let spy;

  function countTracks(rec) {
    const codes = new Set();
    const walk = (blocks) => blocks.forEach((b) => {
      if (b.t === 'tracks') b.groups.forEach((g) => g.items.forEach((x) => codes.add(typeof x === 'string' ? x : x.c)));
      if (b.t === 'discs') b.discs.forEach((d) => walk(d.blocks));
    });
    rec.sections.forEach((s) => walk(s.blocks));
    return codes.size;
  }

  function renderAlbum(ri, disc) {
    const rec = RECORDS[ri];
    registry = [];
    const sections = rec.sections.length ? rec.sections : eventsSection(rec);
    const nTracks = countTracks(rec);
    const firstTracks = sections.find((s) => s.blocks?.some((b) => b.t === 'tracks'));
    const seqSection = sections.find((s) => s.blocks?.some((b) => b.t === 'timeline'));
    const prevRec = RECORDS[(ri - 1 + RECORDS.length) % RECORDS.length];
    const nextRec = RECORDS[(ri + 1) % RECORDS.length];

    albumEl.setAttribute('style', recVars(rec));
    albumEl.innerHTML = `
      <div class="album__bar">
        <a class="pill" href="#/">← 앨범 목록</a>
        <span class="catalog">${esc(rec.catalog)} · 2026-2</span>
      </div>

      <header class="hero">
        <div class="hero__art is-loading">
          <div class="slot" style="${recVars(rec)}">${cardHTML(rec, ri, { tag: 'div' })}</div>
        </div>
        <div class="hero__info">
          <div class="hero__kicker">
            <span class="tag">${esc(rec.vol)}</span><span class="tag">${esc(rec.kind)}</span>${nTracks ? `<span class="tag">${nTracks} Tracks</span>` : ''}
          </div>
          <h1>${esc(rec.title)}</h1>
          <p class="hero__en">${esc(rec.en)}<span>${esc(rec.artist)}</span></p>
          <p class="hero__tagline">${md(rec.tagline)}</p>
          ${rec.stats.length ? block({ t: 'stats', items: rec.stats }, rec) : ''}
          <div class="hero__actions">
            ${firstTracks ? `<button class="pill pill--solid" type="button" data-play="${firstTracks.id}">▶ 트랙리스트 재생</button>` : ''}
            ${seqSection ? `<button class="pill" type="button" data-jump="${seqSection.id}">이수 체계 보기</button>` : ''}
          </div>
        </div>
      </header>

      ${sections.length > 1 ? `
      <nav class="album__nav" aria-label="앨범 구성">
        <ul>${sections.map((s) => `<li><a href="#/${rec.id}" data-jump="${s.id}"><b>${esc(s.side)}</b>${esc(s.title)}</a></li>`).join('')}</ul>
      </nav>` : ''}

      ${sections.map((s) => `
        <section class="side" id="sec-${s.id}">
          <div class="side__head">
            <span class="side__no">${esc(s.side)}</span>
            <h2>${esc(s.title)}</h2>
            ${s.lead ? `<p class="side__lead">${md(s.lead)}</p>` : ''}
          </div>
          ${s.html || s.blocks.map((b) => block(b, rec, { disc })).join('')}
        </section>`).join('')}

      <nav class="album__next" aria-label="다른 앨범">
        <a class="neighbor" href="#/${prevRec.id}" style="--ng1:${prevRec.grad[0]};--ng2:${prevRec.grad[1]}"><span class="neighbor__sw"></span><span><small>← 이전 앨범</small><b>${esc(prevRec.title)}</b></span></a>
        <a class="neighbor neighbor--next" href="#/${nextRec.id}" style="--ng1:${nextRec.grad[0]};--ng2:${nextRec.grad[1]}"><span class="neighbor__sw"></span><span><small>다음 앨범 →</small><b>${esc(nextRec.title)}</b></span></a>
      </nav>
      <p class="album__foot">2026-2 AI융합학부 요람 기준 · 본 지침은 변경될 수 있으니 수강 신청 시 반드시 HISNet에서 확인하세요.</p>`;

    requestAnimationFrame(() => requestAnimationFrame(() => $('.hero__art', albumEl)?.classList.remove('is-loading')));
    setupSpy();
  }

  function setupSpy() {
    spy?.disconnect();
    const links = $$('.album__nav a', albumEl);
    if (!links.length) return;
    spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id.replace('sec-', '');
        links.forEach((a) => a.classList.toggle('is-current', a.dataset.jump === id));
        links.find((a) => a.dataset.jump === id)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    $$('.side', albumEl).forEach((s) => spy.observe(s));
  }

  const jumpTo = (id) => $(`#sec-${id}`, albumEl)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });

  albumEl.addEventListener('click', (e) => {
    const j = e.target.closest('[data-jump]');
    if (j) { e.preventDefault(); jumpTo(j.dataset.jump); return; }

    const p = e.target.closest('[data-play]');
    if (p) {
      jumpTo(p.dataset.play);
      const first = $(`#sec-${p.dataset.play} .track`, albumEl);
      if (first) play(first);
      return;
    }

    const tab = e.target.closest('.disc-tab');
    if (tab) {
      const discs = tab.closest('.discs');
      const rec = RECORDS.find((r) => r.id === discs.dataset.rec);
      const b = rec.sections.flatMap((s) => s.blocks).find((x) => x.t === 'discs');
      discs.outerHTML = renderDiscs(b, rec, tab.dataset.disc);
      $(`.disc-tab[data-disc="${tab.dataset.disc}"]`, albumEl)?.focus({ preventScroll: true });
      history.replaceState(null, '', `#/${rec.id}/${tab.dataset.disc}`);
      return;
    }

    const v = e.target.closest('.variant-switch button');
    if (v) {
      const tl = v.closest('.timeline');
      const b = timelineVariants[tl.dataset.tl];
      $$('.variant-switch button', tl).forEach((x) => x.setAttribute('aria-pressed', String(x === v)));
      $('.tl-body', tl).innerHTML = timelineGrid(b.variants[Number(v.dataset.v)].lanes);
      return;
    }

    const tr = e.target.closest('.track[data-t]');
    if (tr) play(tr);
  });
  albumEl.addEventListener('keydown', (e) => {
    const tr = e.target.closest('.track[data-t]');
    if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); play(tr); }
  });

  /* ───────────────────────── 플레이어 ───────────────────────── */
  let playing = null;

  function play(tr) {
    if (playing === tr) { closePlayer(); return; }
    playing?.classList.remove('is-playing');
    playing = tr;
    tr.classList.add('is-playing');
    const t = registry[Number(tr.dataset.t)];
    const rec = recognized(t.rec);
    const hours = t.th != null ? `<span class="badge">이론 ${t.th} · 실습 ${t.lab}</span>` : '';
    const lang = t.eng === 1 ? '<span class="badge badge--en">영어강의</span>' : t.eng === 0 ? '<span class="badge">한국어 강의</span>' : '';
    const panel = tr.closest('.disc-panel');
    const dc = panel?.style.getPropertyValue('--dc');
    playerEl.setAttribute('style', panel ? `--g1:${dc};--g2:${dc}` : albumEl.getAttribute('style'));
    playerEl.innerHTML = `
      <div class="player__disc" aria-hidden="true"></div>
      <div>
        <div class="player__title">${esc(t.ko)}</div>
        ${t.en && t.en !== t.ko ? `<div class="player__en">${esc(t.en)}</div>` : ''}
        <div class="player__meta">
          <span class="badge">${esc(t.code)}</span><span class="badge">${t.cr}학점</span>${hours}<span class="badge">${esc(when(t))}</span>${lang}${badges({ tag: t.tag })}
        </div>
        ${rec.length ? `<div class="player__rec">인정 전공 ${rec.map((r) => `<span class="badge${r.cond ? ' badge--cond' : ''}">${esc(r.l)}${r.req ? ' · 전공필수' : ''}${r.cond ? ' △' : ''}</span>`).join('')}</div>` : ''}
        ${t.note ? `<div class="player__note">${esc(t.note)}</div>` : ''}
      </div>
      <button class="player__close" type="button" aria-label="닫기">✕</button>`;
    playerEl.hidden = false;
  }

  function closePlayer() {
    playing?.classList.remove('is-playing');
    playing = null;
    playerEl.hidden = true;
  }
  playerEl.addEventListener('click', (e) => { if (e.target.closest('.player__close')) closePlayer(); });

  /* ───────────────────────── 라우터 ───────────────────────── */
  let view = null;
  let currentAlbum = -1;

  function transition(fn, name) {
    if (!document.startViewTransition || reduceMotion || view === null) { fn(); return; }
    document.startViewTransition(fn).finished.finally(() => {
      $$('[style*="view-transition-name"]').forEach((el) => (el.style.viewTransitionName = ''));
    });
  }

  function route() {
    const m = location.hash.match(/^#\/([\w-]+)(?:\/([\w-]+))?/);
    const ri = m ? RECORDS.findIndex((r) => r.id === m[1]) : -1;
    closePlayer();

    if (ri >= 0) {
      const fromCrate = view === 'crate';
      if (fromCrate) slots[ri].style.viewTransitionName = 'sleeve';
      transition(() => {
        if (fromCrate) slots[ri].style.viewTransitionName = '';
        crateEl.hidden = true;
        albumEl.hidden = false;
        document.body.classList.add('is-album');
        renderAlbum(ri, m[2]);
        currentAlbum = ri;
        const heroSlot = $('.hero__art .slot', albumEl);
        if (fromCrate && heroSlot) { heroSlot.style.viewTransitionName = 'sleeve'; heroSlot.style.animation = 'none'; }
        window.scrollTo(0, 0);
        document.title = `${RECORDS[ri].title} · AI융합학부 Records`;
      });
      view = 'album';
    } else {
      const prevRi = view === 'album' ? currentAlbum : -1;
      const heroSlot = $('.hero__art .slot', albumEl);
      if (prevRi >= 0 && heroSlot) heroSlot.style.viewTransitionName = 'sleeve';
      transition(() => {
        if (heroSlot) heroSlot.style.viewTransitionName = '';
        albumEl.hidden = true;
        crateEl.hidden = false;
        document.body.classList.remove('is-album');
        measure();
        if (prevRi >= 0) {
          setFront(prevRi);
          slots[prevRi].style.viewTransitionName = 'sleeve';
        }
        window.scrollTo(0, 0);
        document.title = 'AI융합학부 Records';
      });
      view = 'crate';
    }
  }

  buildStack();
  window.addEventListener('hashchange', route);
  route();
})();
