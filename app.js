(() => {
  const { COURSES, RECORDS } = window.SITE_DATA;
  const { CHARS, VILLAGES } = window.VILLAGE_DATA;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const plain = (s) => String(s ?? '').replace(/\*\*/g, '').replace(/[.。]\s*$/, '');

  const gateEl = $('#gate');
  const mapEl = $('#map');
  const albumEl = $('#album');
  const playerEl = $('#player');

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 저장 못 해도 게이트가 한 번 더 보일 뿐 */ } },
  };

  /* ───────────────────────── 아이콘 (손그림 느낌 SVG) ───────────────────────── */
  const ICON_PATHS = {
    sign: '<path d="M12 21v-9"/><path d="M5 5h14l-2 3.5 2 3.5H5z"/>',
    stall: '<path d="M3 9l2-5h14l2 5"/><path d="M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M5 12v8h14v-8"/>',
    path: '<path d="M4 20c3.5 0 3.5-4 7-4s3.5 4 7 4" stroke-dasharray="2.5 3"/><path d="M6 10c3.5 0 3.5-4 7-4s3.5 4 7 4" stroke-dasharray="2.5 3"/>',
    check: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 13l2.5 2.5 4.5-5"/>',
    stage: '<path d="M9 17V6l10-2v11"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
    workshop: '<path d="M4 20l8.5-8.5"/><path d="M12 4.5l6 6-3 3-6-6z"/>',
    mailbox: '<path d="M4 11a4 4 0 0 1 8 0v8H4z"/><path d="M12 11h8v8h-8"/><path d="M8 19v2.5"/><path d="M15 11V4h3"/>',
    post: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3.5 8l8.5 6 8.5-6"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12C12 8 9 6 5 6c0 4 3 6 7 6z"/><path d="M12 10c0-3 2-5 6-5 0 3-2 5-6 5z"/>',
    badge: '<circle cx="12" cy="9" r="5"/><path d="M9 13.5L7.5 21l4.5-2.5 4.5 2.5-1.5-7.5"/>',
    signpost: '<path d="M12 3v18"/><path d="M12 5h7l2 2.5-2 2.5h-7"/><path d="M12 12H5l-2 2.5L5 17h7"/>',
    house: '<path d="M4 11l8-7 8 7"/><path d="M6 9v11h12V9"/><path d="M10 20v-5h4v5"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    board: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M7 16l-1 5"/><path d="M17 16l1 5"/><path d="M8 8h8"/><path d="M8 12h5"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
    leaf: '<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z"/><path d="M5 19l8-8"/>',
    close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    next: '<path d="M6 9l6 6 6-6"/>',
    arrowL: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
    arrowR: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  };
  const icon = (name, size = 22) =>
    `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ICON_PATHS.sign}</svg>`;

  const SECTION_ICON = {
    notes: 'sign', tracklist: 'stall', structure: 'signpost', discs: 'signpost', common: 'sprout', bizcommon: 'signpost',
    sequence: 'path', credits: 'check', capstone: 'stage', projects: 'workshop', md: 'badge', others: 'mailbox', contact: 'post',
  };

  // data.js에 남은 LP 시절 섹션 제목 → 장소 아래 작은 글씨로 보일 이름
  const ORIG_TITLE = { 'Liner Notes': '전공 소개', Tracklist: '인정 과목', '트랙 선택 · Discs': '트랙 선택' };

  const village = (rec) => VILLAGES[rec.id] || { name: rec.title, char: null, theme: 'plaza', greet: [], places: {} };
  const place = (rec, s) => {
    const p = village(rec).places[s.id];
    const [name, ic] = Array.isArray(p) ? p : [p || s.title, null];
    return { name, icon: ic || SECTION_ICON[s.id] || 'sign' };
  };
  const charImg = (char, cls, alt = '') => (char
    ? `<img class="${cls}" src="assets/chars/${char}.png" alt="${esc(alt)}" draggable="false">`
    : `<span class="${cls} ${cls}--board" aria-hidden="true">${icon('board', 64)}</span>`);

  /* ───────────────────────── 대화창 ───────────────────────── */
  const DIALOG_HTML = `
    <span class="dialog__name"></span>
    <span class="dialog__text" aria-hidden="true"></span>
    <span class="sr-only" aria-live="polite"></span>
    <button class="dialog__next" type="button" aria-label="다음 대사">${icon('next', 18)}</button>`;

  function mountDialog(el, script, { onLine } = {}) {
    el.innerHTML = DIALOG_HTML;
    const nameEl = $('.dialog__name', el);
    const textEl = $('.dialog__text', el);
    const srEl = $('.sr-only', el);
    const nextEl = $('.dialog__next', el);
    let i = 0;
    let timer = 0;

    const finish = () => {
      clearInterval(timer);
      textEl.textContent = script[i].text;
      el.classList.remove('is-typing');
    };
    const show = (n) => {
      i = n;
      const line = script[i];
      el.dataset.theme = line.theme;
      nameEl.textContent = line.who;
      srEl.textContent = `${line.who}: ${line.text}`;
      nextEl.setAttribute('aria-label', i < script.length - 1 ? '다음 대사' : '처음 대사 다시 보기');
      el.classList.toggle('is-last', i === script.length - 1);
      onLine?.(line, i);
      if (reduceMotion) { finish(); return; }
      let k = 0;
      textEl.textContent = '';
      el.classList.add('is-typing');
      clearInterval(timer);
      timer = setInterval(() => {
        textEl.textContent = line.text.slice(0, ++k);
        if (k >= line.text.length) finish();
      }, 28);
    };
    el.onclick = () => (el.classList.contains('is-typing') ? finish() : show((i + 1) % script.length));
    show(0);
    return { stop: () => clearInterval(timer) };
  }

  const greetScript = (rec) => village(rec).greet.map((g) => ({ ...g, text: g.text.replace('{tagline}', plain(rec.tagline)) }));

  /* ───────────────────────── 입장 게이트 ───────────────────────── */
  const GATE_KEY = 'aic-village-gate';
  const GATE_SCRIPT = [
    { ...CHARS.hachiware, who: CHARS.hachiware.name, char: 'hachiware', text: '어서 와, 손님! 여기는 AI융합학부 마을이야.' },
    { ...CHARS.usagi, who: CHARS.usagi.name, char: 'usagi', text: '우라! 마을이 세 개나 있어! 하나씩 놀러 와~' },
    { ...CHARS.chiikawa, who: CHARS.chiikawa.name, char: 'chiikawa', text: '……! (치이카와가 방문증을 건네준다)' },
  ];
  let gateDialog = null;

  function openGate() {
    $('#gate-friends').innerHTML = ['hachiware', 'chiikawa', 'usagi']
      .map((c) => `<img class="friend" data-char="${c}" src="assets/chars/${c}.png" alt="" draggable="false">`).join('');
    gateDialog = mountDialog($('#gate-dialog'), GATE_SCRIPT, {
      onLine: (line) => $$('.friend', gateEl).forEach((f) => f.classList.toggle('is-talking', f.dataset.char === line.char)),
    });
    gateEl.hidden = false;
    mapEl.inert = true;
    document.body.classList.add('is-gate');
    $('#gate-enter').focus({ preventScroll: true });
  }
  function closeGate() {
    if (gateEl.hidden) return;
    gateDialog?.stop();
    store.set(GATE_KEY, '1');
    gateEl.hidden = true;
    mapEl.inert = false;
    document.body.classList.remove('is-gate');
    $('.map__title').focus({ preventScroll: true });
  }
  $('#gate-enter').addEventListener('click', closeGate);
  $('#gate-again').addEventListener('click', openGate);

  /* ───────────────────────── 섬 지도 ───────────────────────── */
  const ISLAND_SVG = `
    <svg class="island__art" viewBox="0 0 1000 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="waves" width="80" height="40" patternUnits="userSpaceOnUse">
          <path d="M8 22c8-7 16-7 24 0s16 7 24 0" fill="none" stroke="#B9DCEA" stroke-width="3" stroke-linecap="round"/>
        </pattern>
      </defs>
      <rect width="1000" height="640" fill="var(--water)"/>
      <rect width="1000" height="640" fill="url(#waves)"/>
      <path d="M118 112C230 30 770 22 884 104c86 70 92 360 6 440-96 86-660 92-770 8C30 482 28 182 118 112z" fill="var(--path)" stroke="var(--ink)" stroke-width="4"/>
      <path d="M146 136C252 66 748 60 856 128c70 60 76 330 2 398-86 76-626 82-724 8C58 466 60 196 146 136z" fill="var(--grass)"/>
      <!-- 마을 구역 -->
      <ellipse cx="215" cy="215" rx="150" ry="104" fill="var(--hachi-tint)"/>
      <ellipse cx="790" cy="215" rx="150" ry="104" fill="var(--usagi)"/>
      <ellipse cx="500" cy="480" rx="190" ry="92" fill="var(--chii-tint)"/>
      <!-- 강 + 다리 -->
      <path d="M392 64c-30 90 34 140-6 230-36 82-120 120-150 300" fill="none" stroke="var(--water)" stroke-width="30" stroke-linecap="round"/>
      <path d="M392 64c-30 90 34 140-6 230-36 82-120 120-150 300" fill="none" stroke="#B9DCEA" stroke-width="4" stroke-dasharray="10 14" stroke-linecap="round"/>
      <!-- 길 -->
      <g fill="none" stroke="var(--path)" stroke-width="16" stroke-linecap="round">
        <path d="M480 300C420 270 330 240 250 230"/>
        <path d="M520 300c60-30 150-60 240-70"/>
        <path d="M500 330c0 50 0 90 0 120"/>
      </g>
      <rect x="352" y="246" width="54" height="26" rx="6" fill="#E9C99A" stroke="var(--ink)" stroke-width="3" transform="rotate(-14 379 259)"/>
      <!-- 중앙 광장 -->
      <ellipse cx="500" cy="310" rx="118" ry="62" fill="var(--path)" stroke="var(--ink)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
      <!-- 나무 -->
      <g stroke="var(--ink)" stroke-width="3">
        <g transform="translate(640 120)"><rect x="-4" y="10" width="8" height="18" fill="#B98A5E"/><circle r="22" fill="var(--grass-deep)"/></g>
        <g transform="translate(690 150)"><rect x="-4" y="8" width="8" height="16" fill="#B98A5E"/><circle r="17" fill="var(--grass-deep)"/></g>
        <g transform="translate(330 470)"><rect x="-4" y="10" width="8" height="18" fill="#B98A5E"/><circle r="20" fill="var(--grass-deep)"/></g>
        <g transform="translate(700 470)"><rect x="-4" y="10" width="8" height="18" fill="#B98A5E"/><circle r="22" fill="var(--grass-deep)"/></g>
        <g transform="translate(170 420)"><rect x="-4" y="8" width="8" height="16" fill="#B98A5E"/><circle r="16" fill="var(--grass-deep)"/></g>
        <g transform="translate(860 380)"><rect x="-4" y="8" width="8" height="16" fill="#B98A5E"/><circle r="18" fill="var(--grass-deep)"/></g>
      </g>
      <!-- 풀 (치이카와 풀밭) -->
      <g fill="none" stroke="var(--chii-ink)" stroke-width="3" stroke-linecap="round">
        <path d="M400 520l4-12 4 12M420 528l3-9 3 9"/><path d="M580 522l4-12 4 12M600 530l3-9 3 9"/><path d="M460 548l3-9 3 9M540 552l3-9 3 9"/>
      </g>
      <!-- 꽃 -->
      <g fill="var(--blush)" stroke="var(--ink)" stroke-width="2">
        <circle cx="270" cy="330" r="7"/><circle cx="740" cy="330" r="7"/><circle cx="610" cy="400" r="6"/><circle cx="390" cy="390" r="6"/>
      </g>
    </svg>`;

  const PIN_NOTE = { school: '학부 소개', events: '행사 소식' };
  const pinNote = (rec) => PIN_NOTE[rec.id] || `${rec.card.title} 전공`;

  function buildMap() {
    const pins = RECORDS.map((rec) => {
      const v = village(rec);
      if (!v.pin) return '';
      return `
        <a class="pin${v.char ? '' : ' pin--board'}" href="#/${rec.id}" data-rec="${rec.id}" data-theme="${v.theme}"
           style="left:${v.pin[0]}%;top:${v.pin[1]}%" aria-label="${esc(v.name)} — ${esc(rec.title)}">
          ${charImg(v.char, 'pin__char')}
          <span class="pin__label" aria-hidden="true"><b>${esc(v.name)}</b><small>${esc(pinNote(rec))}</small></span>
        </a>`;
    }).join('');
    $('#island').innerHTML = ISLAND_SVG + pins;

    $('#village-list').innerHTML = `<ul>${RECORDS.map((rec) => {
      const v = village(rec);
      return `
        <li><a class="vcard" href="#/${rec.id}" data-theme="${v.theme}">
          <span class="vcard__art">${charImg(v.char, 'vcard__char')}</span>
          <span class="vcard__body"><b>${esc(v.name)}</b><small>${esc(rec.title)} · ${esc(rec.en)}</small></span>
          ${icon('arrowR', 20)}
        </a></li>`;
    }).join('')}</ul>`;
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return;
    if (e.key !== 'Escape') return;
    if (!gateEl.hidden) closeGate();
    else if (!playerEl.hidden) closePlayer();
    else if (!albumEl.hidden) location.hash = '#/';
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
    const groups = b.groups.map((g) => {
      const items = g.items.map(course).filter(Boolean);
      const total = items.reduce((a, t) => a + t.cr, 0);
      const rows = items.map((t) => {
        const id = registry.push(t) - 1;
        return `
          <li class="track" tabindex="0" role="button" data-t="${id}" aria-label="${esc(t.ko)} 과목 카드 보기">
            <span class="track__icon" aria-hidden="true">${icon('leaf', 18)}</span>
            <span class="track__name"><span class="track__ko">${esc(t.ko)}</span>${t.en && t.en !== t.ko ? `<span class="track__en">${esc(t.en)}</span>` : ''}</span>
            <span class="track__side">${badges(t)}<span class="track__when">${esc(when(t))}</span><span class="track__code">${esc(t.code)}</span></span>
            <span class="track__dur">${t.cr}학점</span>
          </li>`;
      }).join('');
      return `
        <div class="tl-group">
          <div class="tl-group__head">
            <span class="tl-group__name">${esc(g.name)}</span>
            <span class="tl-group__meta">${items.length}과목 · ${total}학점</span>
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

  // 우사기 마을: 다섯 갈래 길 이정표
  function renderDiscs(b, rec, discId) {
    const cur = b.discs.find((d) => d.id === discId) || b.discs[0];
    const tabs = b.discs.map((d, i) => `
      <button class="disc-tab" type="button" role="tab" data-disc="${d.id}" aria-selected="${d.id === cur.id}" style="--dc:${d.color}">
        <span class="disc-tab__dot" aria-hidden="true"></span>
        <span><b>길 ${i + 1} · ${esc(d.name)}</b><small>${esc(d.en)}</small></span>
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
        const tv = target && village(target);
        const tag = c.href ? 'a' : 'div';
        return `<${tag} class="info-card${tv ? ' info-card--village' : ''}"${c.href ? ` href="${c.href}"` : ''}${tv ? ` data-theme="${tv.theme}"` : ''}>
          ${tv?.char ? `<img class="info-card__char" src="assets/chars/${tv.char}.png" alt="" draggable="false">` : ''}
          ${tv ? `<span class="info-card__go">${esc(tv.name)} ${icon('arrowR', 16)}</span>` : ''}
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
      ? `<div class="tracklist"><div class="tl-group"><div class="tl-group__head"><span class="tl-group__name">학부 행사</span><span class="tl-group__meta">${list.length}개</span></div>
          <ol class="tracks">${list.map((ev) => `
            <li class="track track--event"><span class="track__icon" aria-hidden="true">${icon('board', 18)}</span>
              <span class="track__name"><span class="track__ko">${esc(ev.title)}</span>${ev.desc ? `<span class="track__en">${esc(ev.desc)}</span>` : ''}</span>
              <span class="track__side">${ev.tag ? `<span class="badge">${esc(ev.tag)}</span>` : ''}${ev.place ? `<span class="track__when">${esc(ev.place)}</span>` : ''}</span>
              <span class="track__dur">${esc(ev.date || '')}</span></li>`).join('')}</ol></div></div>`
      : `<div class="empty"><div class="empty__note" aria-hidden="true"><i></i></div><h3>아직 붙은 공지가 없어요</h3><p>학부 행사 소식이 준비되는 대로 이 게시판에 붙을 거예요.</p></div>`;
    return [{ id: 'tracklist', side: 'A1', title: '학부 행사', html: body }];
  }

  /* ───────────────────────── 마을 페이지 ───────────────────────── */
  let spy;
  let villageDialog = null;

  function countTracks(rec) {
    const codes = new Set();
    const walk = (blocks) => blocks.forEach((b) => {
      if (b.t === 'tracks') b.groups.forEach((g) => g.items.forEach((x) => codes.add(typeof x === 'string' ? x : x.c)));
      if (b.t === 'discs') b.discs.forEach((d) => walk(d.blocks));
    });
    rec.sections.forEach((s) => walk(s.blocks));
    return codes.size;
  }

  const floorOf = (rec, s) => village(rec).floors?.[s.side[0]];

  function renderAlbum(ri, disc) {
    const rec = RECORDS[ri];
    const v = village(rec);
    registry = [];
    villageDialog?.stop();
    const sections = rec.sections.length ? rec.sections : eventsSection(rec);
    const nTracks = countTracks(rec);
    const firstTracks = sections.find((s) => s.blocks?.some((b) => b.t === 'tracks'));
    const seqSection = sections.find((s) => s.blocks?.some((b) => b.t === 'timeline'));
    const prevRec = RECORDS[(ri - 1 + RECORDS.length) % RECORDS.length];
    const nextRec = RECORDS[(ri + 1) % RECORDS.length];
    const neighbor = (r, dir) => {
      const nv = village(r);
      return `<a class="neighbor${dir > 0 ? ' neighbor--next' : ''}" href="#/${r.id}" data-theme="${nv.theme}">
        <span class="neighbor__art">${charImg(nv.char, 'neighbor__char')}</span>
        <span><small>${dir > 0 ? '옆 마을로 →' : '← 옆 마을로'}</small><b>${esc(nv.name)}</b><small>${esc(r.title)}</small></span></a>`;
    };

    albumEl.dataset.theme = v.theme;
    albumEl.innerHTML = `
      <div class="album__bar">
        <a class="btn" href="#/">${icon('map', 18)}섬 지도</a>
        <span class="catalog">${esc(rec.title)} · 2026-2 요람</span>
      </div>

      <header class="hero">
        <div class="hero__art">
          <div class="hero__ground" aria-hidden="true"></div>
          ${charImg(v.char, 'hero__char', v.char && v.char !== 'trio' ? `인사하는 ${CHARS[v.char].name}` : '')}
        </div>
        <div class="hero__info">
          <div class="hero__kicker">
            <span class="tag">${esc(v.kind || rec.kind)}</span>${nTracks ? `<span class="tag">과목 ${nTracks}개</span>` : ''}
          </div>
          <h1>${esc(v.name)}</h1>
          <p class="hero__en">${esc(rec.title)} · ${esc(rec.en)}</p>
          ${v.greet.length ? '<div class="dialog" id="village-dialog"></div>' : `<p class="hero__tagline">${md(rec.tagline)}</p>`}
          ${rec.stats.length ? block({ t: 'stats', items: rec.stats }, rec) : ''}
          <div class="hero__actions">
            ${firstTracks ? `<button class="btn btn--solid" type="button" data-play="${firstTracks.id}">${icon('leaf', 18)}과목 둘러보기</button>` : ''}
            ${seqSection ? `<button class="btn" type="button" data-jump="${seqSection.id}">${icon('path', 18)}${esc(place(rec, seqSection).name)}</button>` : ''}
          </div>
        </div>
      </header>

      ${sections.length > 1 ? `
      <nav class="album__nav" aria-label="마을 안내도">
        <a class="album__map" href="#/" aria-label="섬 지도로 돌아가기">${icon('map', 18)}</a>
        <ul>${sections.map((s) => `<li><a href="#/${rec.id}" data-jump="${s.id}">${icon(place(rec, s).icon, 16)}${esc(place(rec, s).name)}</a></li>`).join('')}</ul>
      </nav>` : ''}

      ${sections.map((s) => {
        const p = place(rec, s);
        const floor = floorOf(rec, s);
        const orig = ORIG_TITLE[s.title] || s.title;
        const lead = v.leads?.[s.id] || s.lead;
        return `
        <section class="side" id="sec-${s.id}" aria-labelledby="h-${s.id}">
          <div class="side__head">
            <span class="side__icon" aria-hidden="true">${icon(p.icon, 26)}</span>
            <div>
              ${floor ? `<span class="side__floor">${esc(floor)}</span>` : ''}
              <h2 id="h-${s.id}">${esc(p.name)}</h2>
              ${p.name !== orig ? `<p class="side__orig">${esc(orig)}</p>` : ''}
            </div>
            ${lead ? `<p class="side__lead">${md(lead)}</p>` : ''}
          </div>
          ${s.html || s.blocks.map((b) => block(b, rec, { disc })).join('')}
        </section>`;
      }).join('')}

      <nav class="album__next" aria-label="옆 마을">${neighbor(prevRec, -1)}${neighbor(nextRec, 1)}</nav>
      <p class="album__foot">2026-2 AI융합학부 요람 기준 · 본 지침은 변경될 수 있으니 수강 신청 시 반드시 HISNet에서 확인하세요.</p>
      <p class="site-note">${esc($('#site-note').textContent)}</p>`;

    const dlg = $('#village-dialog', albumEl);
    if (dlg) villageDialog = mountDialog(dlg, greetScript(rec));
    setupSpy();
    if (!reduceMotion) revealSides();
  }

  // 장소 카드: 스크롤로 들어올 때 차례로 등장
  let revealer;
  function revealSides() {
    revealer?.disconnect();
    revealer = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      revealer.unobserve(en.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    $$('.side', albumEl).forEach((s) => { s.classList.add('will-reveal'); revealer.observe(s); });
  }

  function setupSpy() {
    spy?.disconnect();
    const links = $$('.album__nav li a', albumEl);
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

  /* ───────────────────────── 아이템 카드 (과목 상세) ───────────────────────── */
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
    playerEl.dataset.theme = albumEl.dataset.theme;
    playerEl.style.cssText = panel ? `--v-fill:${panel.style.getPropertyValue('--dc')}` : '';
    playerEl.innerHTML = `
      <div class="player__icon" aria-hidden="true">${icon('leaf', 26)}</div>
      <div>
        <div class="player__kicker">과목 카드를 확인했다!</div>
        <div class="player__title">${esc(t.ko)}</div>
        ${t.en && t.en !== t.ko ? `<div class="player__en">${esc(t.en)}</div>` : ''}
        <div class="player__meta">
          <span class="badge">${esc(t.code)}</span><span class="badge">${t.cr}학점</span>${hours}<span class="badge">${esc(when(t))}</span>${lang}${badges({ tag: t.tag })}
        </div>
        ${rec.length ? `<div class="player__rec">인정 전공 ${rec.map((r) => `<span class="badge${r.cond ? ' badge--cond' : ''}">${esc(r.l)}${r.req ? ' · 전공필수' : ''}${r.cond ? ' △' : ''}</span>`).join('')}</div>` : ''}
        ${t.note ? `<div class="player__note">${esc(t.note)}</div>` : ''}
      </div>
      <button class="player__close" type="button" aria-label="닫기">${icon('close', 18)}</button>`;
    playerEl.hidden = false;
  }

  function closePlayer() {
    playing?.classList.remove('is-playing');
    playing = null;
    playerEl.hidden = true;
  }
  playerEl.addEventListener('click', (e) => { if (e.target.closest('.player__close')) closePlayer(); });

  /* ───────────────────────── 라우터 ─────────────────────────
     지도 핀의 캐릭터 ↔ 마을 히어로 캐릭터를 View Transition으로 이어 줌 */
  let view = null;
  let currentAlbum = -1;

  function transition(fn) {
    if (!document.startViewTransition || reduceMotion || view === null) { fn(); return; }
    document.startViewTransition(fn).finished.finally(() => {
      $$('[style*="view-transition-name"]').forEach((el) => (el.style.viewTransitionName = ''));
    });
  }
  const pinChar = (ri) => $(`.pin[data-rec="${RECORDS[ri].id}"] .pin__char`, mapEl);

  function route() {
    // #/lp, #/lp/ge → 레코드판 버전(lp/)의 같은 페이지로
    const lp = location.hash.match(/^#\/lp(\/.*)?$/);
    if (lp) { location.replace(`lp/#${lp[1] || '/'}`); return; }

    const m = location.hash.match(/^#\/([\w-]+)(?:\/([\w-]+))?/);
    const ri = m ? RECORDS.findIndex((r) => r.id === m[1]) : -1;
    closePlayer();

    if (ri >= 0) {
      closeGate();
      const fromMap = view === 'map';
      const pc = fromMap && pinChar(ri);
      if (pc) pc.style.viewTransitionName = 'villager';
      transition(() => {
        if (pc) pc.style.viewTransitionName = '';
        mapEl.hidden = true;
        albumEl.hidden = false;
        document.body.classList.add('is-album');
        renderAlbum(ri, m[2]);
        currentAlbum = ri;
        const hc = $('.hero__char', albumEl);
        if (pc && hc) hc.style.viewTransitionName = 'villager';
        window.scrollTo(0, 0);
        document.title = `${village(RECORDS[ri]).name} · AI융합학부 마을`;
      });
      view = 'album';
    } else {
      const prevRi = view === 'album' ? currentAlbum : -1;
      const hc = $('.hero__char', albumEl);
      if (prevRi >= 0 && hc) hc.style.viewTransitionName = 'villager';
      transition(() => {
        if (hc) hc.style.viewTransitionName = '';
        villageDialog?.stop();
        albumEl.hidden = true;
        mapEl.hidden = false;
        document.body.classList.remove('is-album');
        const pc = prevRi >= 0 && pinChar(prevRi);
        if (pc) pc.style.viewTransitionName = 'villager';
        window.scrollTo(0, 0);
        document.title = 'AI융합학부 마을';
      });
      if (view === null && !store.get(GATE_KEY)) openGate();
      view = 'map';
    }
  }

  buildMap();
  window.addEventListener('hashchange', route);
  route();
})();
