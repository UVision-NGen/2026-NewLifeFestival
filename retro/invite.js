/*!
 * 2026 새생명축제 초대장 공통 스크립트
 * 9개 컨셉 폴더에 같은 사본이 들어 있습니다.
 * 행사 정보를 바꿀 때는 모든 폴더의 invite.js와 event.ics를 함께 바꿔 주세요.
 */
(() => {
  'use strict';

  const EVENT = {
    title: '2026 의정부비전교회 청년부 새생명축제',
    name: '새생명축제',
    church: '의정부비전교회',
    address: '의정부시 용민로122번길 50',
    addressFull: '경기도 의정부시 용민로122번길 50',
    when: '2026년 10월 25일 주일 오후 1시 50분',
    start: new Date('2026-10-25T13:50:00+09:00'),
    contacts: [
      { name: '박성진', role: '강도사', tel: '010-5501-4328' },
      { name: '이일규', role: '장로', tel: '010-5746-1735' },
    ],
  };

  // 참석 신청·기도 제목을 모아 받을 주소(예: Google Apps Script 웹앱 URL).
  // 비워 두면 첫 번째 문의처(박성진 강도사)에게 보낼 문자 창을 엽니다.
  const RSVP_ENDPOINT = '';

  const place = encodeURIComponent(EVENT.church);
  const LINKS = {
    naver: `https://map.naver.com/p/search/${place}`,
    kakao: `https://map.kakao.com/link/search/${place}`,
    gcal: 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + `&text=${encodeURIComponent(EVENT.title)}`
      + '&dates=20261025T045000Z/20261025T065000Z'
      + `&location=${encodeURIComponent(`${EVENT.church} (${EVENT.addressFull})`)}`
      + `&details=${encodeURIComponent(EVENT.contacts.map((c) => `문의 ${c.name} ${c.role} ${c.tel}`).join('\n'))}`
      + '&ctz=Asia/Seoul',
  };

  const UA = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  const isApple = isIOS || /Macintosh/.test(UA);
  const isMobile = isIOS || /Android/.test(UA);
  const inKakao = /KAKAOTALK/i.test(UA);

  const ready = (fn) => (document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true })
    : fn());

  // 이름을 붙여 보낸 링크(?to=이름)라면 그 이름. 화면에는 textContent로만 넣습니다.
  // 주소창에 한글이 보이지 않도록 메인 페이지는 이름을 두 번 % 인코딩해 보내므로 한 번 더 풀어 줍니다.
  const decodeName = (v) => { try { return decodeURIComponent(v); } catch { return v; } };
  const guest = decodeName(new URLSearchParams(location.search).get('to') || '')
    .replace(/[<>&"'`]/g, '').trim().slice(0, 12);

  function dday(now = new Date()) {
    const day = (d) => Math.floor((d.getTime() + 9 * 3600e3) / 86400e3);
    return day(EVENT.start) - day(now);
  }
  function ddayLabel() {
    const d = dday();
    if (d > 0) return `D-${d}`;
    return d === 0 ? 'D-DAY' : `D+${-d}`;
  }

  /* ---------- 공통 스타일(토스트, 약도) ---------- */
  const css = document.createElement('style');
  css.textContent = `
.nlf-toast{position:fixed;left:50%;bottom:calc(28px + env(safe-area-inset-bottom));z-index:9999;max-width:min(88vw,380px);padding:12px 18px;border-radius:var(--toast-radius,999px);background:var(--toast-bg,rgba(24,22,20,.9));color:var(--toast-fg,#fff);font-size:14px;line-height:1.45;text-align:center;white-space:pre-line;opacity:0;transform:translate(-50%,14px);transition:opacity .25s,transform .25s;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.18)}
.nlf-toast.is-on{opacity:1;transform:translate(-50%,0)}
.nlf-map{display:block;width:100%;height:auto;font-family:inherit}
.nlf-map .m-bg{fill:var(--m-bg,#f4f1ea)}
.nlf-map .m-public{fill:var(--m-public,#e2e6ec)}
.nlf-map .m-park{fill:var(--m-park,#d6e7c5)}
.nlf-map .m-apt{fill:var(--m-block,#ebe2d1)}
.nlf-map .m-case,.nlf-map .m-road{fill:none;stroke-linecap:round;stroke-linejoin:round}
.nlf-map .m-case{stroke:var(--m-road-edge,#dcd6cb)}
.nlf-map .m-road{stroke:var(--m-road,#fff)}
.nlf-map .m-major.m-case{stroke-width:46}.nlf-map .m-major.m-road{stroke-width:38}
.nlf-map .m-minor.m-case{stroke-width:22}.nlf-map .m-minor.m-road{stroke-width:15}
.nlf-map .m-target{fill:var(--m-target,rgba(226,87,76,.22));stroke:var(--m-accent,#e2574c);stroke-width:3}
.nlf-map text{fill:var(--m-text-sub,#857e73);font-size:28px;letter-spacing:-.5px;paint-order:stroke;stroke:var(--m-halo,var(--m-bg,#f4f1ea));stroke-width:8px;stroke-linejoin:round}
.nlf-map .m-strong{fill:var(--m-text,#3d3731);font-size:34px;font-weight:700}
.nlf-map .m-park-label{fill:var(--m-park-text,#5f7f4a)}
.nlf-map .m-roadname{font-size:26px;fill:var(--m-text-sub,#857e73)}
.nlf-map .m-route{fill:none;stroke:var(--m-route,var(--m-accent,#e2574c));stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 15;animation:nlfm-walk 1s linear infinite}
.nlf-map .m-halo{fill:var(--m-accent,#e2574c);transform-box:fill-box;transform-origin:center;animation:nlfm-pulse 2.4s ease-out infinite}
.nlf-map .m-pin{fill:var(--m-accent,#e2574c);stroke:var(--m-pin-edge,transparent);stroke-width:3}
.nlf-map .m-pin-dot{fill:var(--m-accent-ink,#fff)}
.nlf-map .m-callout{fill:var(--m-accent,#e2574c)}
.nlf-map text.m-callout-text{fill:var(--m-accent-ink,#fff);font-size:31px;font-weight:700;stroke:none}
.nlf-map .m-bus{fill:var(--m-bus,#3f7de0)}
.nlf-map .m-bus-glyph{fill:var(--m-bus-ink,#fff)}
.nlf-map .m-north circle{fill:var(--m-bg,#f4f1ea);stroke:var(--m-text-sub,#857e73);stroke-width:2}
.nlf-map .m-north path{fill:var(--m-text,#3d3731)}
.nlf-map .m-north text{font-size:20px;font-weight:700;fill:var(--m-text,#3d3731);stroke:none}
@keyframes nlfm-walk{to{stroke-dashoffset:-16}}
@keyframes nlfm-pulse{0%{transform:scale(.35);opacity:.5}100%{transform:scale(1.7);opacity:0}}
@media (prefers-reduced-motion:reduce){.nlf-map .m-route,.nlf-map .m-halo{animation:none}}`;
  document.head.appendChild(css);

  /* ---------- 토스트 / 복사 / 공유 ---------- */
  let toastEl;
  let toastTimer;
  function toast(msg, ms = 2600) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'nlf-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), ms);
  }

  async function copy(text, msg = '복사했어요') {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* 복사를 지원하지 않는 브라우저 */ }
      ta.remove();
    }
    toast(msg);
  }

  // 공유할 때는 ?to= 이름을 떼고 보냅니다.
  const pageUrl = () => location.origin + location.pathname;

  async function share(text) {
    const data = {
      title: document.title,
      text: text || `${EVENT.when}, ${EVENT.church}에서 열리는 ${EVENT.name}에 초대합니다.`,
      url: pageUrl(),
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    copy(data.url, '초대장 링크를 복사했어요');
  }

  function openExternal(url) {
    if (inKakao) location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
    else window.open(url, '_blank', 'noopener');
  }

  // 아이폰·맥은 기본 캘린더(.ics), 그 외에는 구글 캘린더로 추가합니다.
  function addCalendar() {
    if (isApple) {
      const ics = new URL('event.ics', location.href).href;
      if (inKakao) openExternal(ics);
      else location.href = ics;
    } else {
      openExternal(LINKS.gcal);
    }
  }

  /* ---------- 참석 신청 / 기도 제목 보내기 ---------- */
  async function rsvp(kind, fields) {
    const filled = fields.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '');
    const body = [`[${EVENT.name} ${kind}]`, ...filled.map(([k, v]) => `${k}: ${v}`)].join('\n');
    if (RSVP_ENDPOINT) {
      try {
        await fetch(RSVP_ENDPOINT, {
          method: 'POST',
          mode: 'no-cors',
          body: new URLSearchParams({ kind, page: location.pathname, body, ...Object.fromEntries(filled) }),
        });
        toast('잘 전달되었어요. 고마워요!');
        return 'sent';
      } catch {
        /* 실패하면 아래 문자로 대신 보냅니다 */
      }
    }
    const to = EVENT.contacts[0].tel.replace(/-/g, '');
    if (isMobile) {
      location.href = `sms:${to}${isIOS ? '&' : '?'}body=${encodeURIComponent(body)}`;
      return 'sms';
    }
    await copy(body, `보낼 내용을 복사했어요.\n${EVENT.contacts[0].tel}로 문자 보내 주세요.`);
    return 'copied';
  }

  /* ---------- 배경음악 ---------- */
  function music(src, { volume = 0.65, auto = true } = {}) {
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = volume;
    let muted = false;
    let resume = false;

    const sync = () => document.querySelectorAll('[data-nlf="bgm"]').forEach((b) => {
      const on = !audio.paused;
      b.classList.toggle('is-playing', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? '배경음악 끄기' : '배경음악 켜기');
    });
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);

    const api = {
      audio,
      play() {
        muted = false;
        return audio.play().catch(() => {});
      },
      pause() {
        muted = true;
        audio.pause();
      },
      toggle() {
        if (audio.paused) api.play();
        else api.pause();
      },
    };

    // 브라우저가 자동재생을 막기 때문에, 화면을 처음 누르는 순간 음악을 시작합니다.
    if (auto) {
      const evs = ['click', 'touchend', 'keydown'];
      const off = () => evs.forEach((t) => document.removeEventListener(t, kick, true));
      function kick(e) {
        if (muted || !audio.paused) return off();
        if (e.target.closest && e.target.closest('[data-nlf="bgm"],[data-nlf-quiet]')) return undefined;
        return audio.play().then(off, () => {});
      }
      evs.forEach((t) => document.addEventListener(t, kick, true));
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        resume = !audio.paused;
        audio.pause();
      } else if (resume && !muted) {
        audio.play().catch(() => {});
      }
    });

    ready(sync);
    NLF.bgm = api;
    return api;
  }

  /* ---------- 약도 (실제 지도를 단순화해 그린 SVG) ---------- */
  function mapSVG(marker) {
    const pin = marker === 'star'
      ? '<path class="m-pin" d="M668,494 C675,528 682,535 716,542 C682,549 675,556 668,590 C661,556 654,549 620,542 C654,535 661,528 668,494 Z"/>'
      : '<path class="m-pin" d="M668,568 C656,550 636,534 636,507 A32,32 0 1 1 700,507 C700,534 680,550 668,568 Z"/><circle class="m-pin-dot" cx="668" cy="507" r="12"/>';
    const road = (id, cls) => `<use href="#${id}" class="m-case ${cls}"/>`;
    const fill = (id, cls) => `<use href="#${id}" class="m-road ${cls}"/>`;
    const minor = ['nlfm-w', 'nlfm-n', 'nlfm-e', 'nlfm-d2'];
    const major = ['nlfm-c', 'nlfm-d', 'nlfm-a'];
    return `<svg class="nlf-map" viewBox="440 120 760 760" role="img" aria-label="의정부비전교회 주변 약도">
<defs>
<path id="nlfm-a" d="M400,135 L760,195 C880,222 990,246 1062,300 C1108,336 1138,378 1160,424 L1240,600"/>
<path id="nlfm-d" d="M965,488 L830,603 L738,691 L650,782 L610,880 L590,930"/>
<path id="nlfm-d2" d="M965,488 C995,465 1020,457 1060,452 L1166,438"/>
<path id="nlfm-c" d="M400,505 C445,494 505,494 545,507 C572,518 590,545 606,568 L650,625 C676,656 700,675 738,691 L1117,930"/>
<path id="nlfm-w" d="M606,568 L630,500 L655,428"/>
<path id="nlfm-n" d="M440,412 L655,428 L825,442 L1010,458"/>
<path id="nlfm-e" d="M724,686 L760,540 L825,442"/>
</defs>
<rect class="m-bg" x="440" y="120" width="760" height="760"/>
<path class="m-public" d="M1018,100 L1240,100 L1240,302 L1146,330 L1078,262 Z"/>
<path class="m-public" d="M782,240 L976,272 L996,432 L842,426 L800,412 Z"/>
<path class="m-park" d="M832,472 L886,466 L934,486 L814,584 L788,556 Z"/>
<path class="m-park" d="M915,700 L1010,640 L1150,650 L1240,676 L1240,930 L1160,930 L1060,852 L935,775 Z"/>
<path class="m-apt" d="M400,540 C450,528 505,526 545,540 C570,552 588,575 606,600 L650,652 C664,668 676,690 688,708 L628,778 L590,872 L572,930 L400,930 Z"/>
${minor.map((id) => road(id, 'm-minor')).join('')}${major.map((id) => road(id, 'm-major')).join('')}
${minor.map((id) => fill(id, 'm-minor')).join('')}${major.map((id) => fill(id, 'm-major')).join('')}
<path class="m-target" d="M636,498 L708,512 L700,600 L676,612 L640,560 Z"/>
<path class="m-route" d="M800,660 L744,704 L692,664 L684,614"/>
<text x="1112" y="206" text-anchor="middle">민락중학교</text>
<text x="905" y="168" text-anchor="middle">민락동우체국</text>
<text class="m-strong" x="895" y="352" text-anchor="middle">KT</text>
<text x="520" y="384" text-anchor="middle">세븐일레븐</text>
<text x="528" y="484" text-anchor="middle">시온성교회</text>
<text class="m-park-label" x="866" y="530" text-anchor="middle">승지문화공원</text>
<text class="m-park-label" x="1070" y="764" text-anchor="middle">오목문화근린공원</text>
<text x="548" y="716" text-anchor="middle">민락e편한세상</text>
<text class="m-roadname" transform="translate(1160,436) rotate(65)" dy="9" text-anchor="middle">용현로</text>
<g transform="translate(818,670)"><rect class="m-bus" x="-18" y="-18" width="36" height="36" rx="9"/><path class="m-bus-glyph" d="M-10,-11 h20 a3,3 0 0 1 3,3 v15 h-26 v-15 a3,3 0 0 1 3,-3 Z M-8,-7 v6 h16 v-6 Z M-11,8 h5 v4 h-5 Z M6,8 h5 v4 h-5 Z"/></g>
<text x="844" y="681">버스정류장</text>
<g class="m-north" transform="translate(484,166)"><circle r="30"/><path d="M0,-20 L10,8 L0,2 L-10,8 Z"/><text y="24" text-anchor="middle" dy="-2">N</text></g>
<circle class="m-halo" cx="668" cy="560" r="44"/>
${pin}
<rect class="m-callout" x="536" y="396" width="264" height="56" rx="28"/>
<path class="m-callout" d="M656,450 L668,466 L680,450 Z"/>
<text class="m-callout-text" x="668" y="435" text-anchor="middle">의정부비전교회</text>
</svg>`;
  }

  /* ---------- 스크롤 등장 ---------- */
  function reveal(root = document) {
    const els = root.querySelectorAll('[data-reveal]:not(.is-in)');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- data-nlf 버튼 연결 ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-nlf]');
    if (!t) return;
    const act = t.dataset.nlf;
    if (act === 'bgm') { if (NLF.bgm) NLF.bgm.toggle(); }
    else if (act === 'calendar') addCalendar();
    else if (act === 'share') share();
    else if (act === 'copy-address') copy(EVENT.addressFull, '주소를 복사했어요');
    else return;
    e.preventDefault();
  });

  ready(() => {
    document.querySelectorAll('[data-nlf-link]').forEach((a) => {
      a.href = LINKS[a.dataset.nlfLink];
      a.target = '_blank';
      a.rel = 'noopener';
    });
    document.querySelectorAll('[data-nlf-map]').forEach((el) => { el.innerHTML = mapSVG(el.dataset.nlfMap); });
    document.querySelectorAll('[data-nlf-dday]').forEach((el) => { el.textContent = ddayLabel(); });
    reveal();
  });

  const NLF = {
    EVENT, LINKS, guest, isIOS, isMobile, inKakao,
    ready, dday, ddayLabel, toast, copy, share, addCalendar, rsvp, music, reveal, mapSVG,
    bgm: null,
  };
  window.NLF = NLF;
})();
