/*
 * 먼작귀 마을 — 화면 라벨·대사 설정 (내용은 data.js, 이 파일은 디자인용 이름표만)
 *
 * VILLAGES[레코드 id]
 *   name   : 지도·상단에 보이는 마을 이름
 *   char   : assets/chars/<char>.png  (없으면 null → 게시판 그림)
 *   theme  : styles.css의 [data-theme] 값 (hachi · usagi · chii · plaza)
 *   pin    : 섬 지도 위 위치 [x%, y%]
 *   greet  : 마을 입구 대사. { who, theme, text }  — text의 {tagline}은 data.js의 tagline으로 바뀜
 *   places : 섹션 id → 장소 이름  또는  [장소 이름, 아이콘]
 *   kind   : (선택) 히어로 태그 — data.js의 kind 대신 표시
 *   leads  : (선택) 섹션 id → 안내 문구 — data.js의 lead 대신 표시
 */

const CHARS = {
  hachiware: { name: '하치와레', theme: 'hachi' },
  usagi: { name: '우사기', theme: 'usagi' },
  chiikawa: { name: '치이카와', theme: 'chii' },
};

const say = (char, text) => ({ who: CHARS[char].name, theme: CHARS[char].theme, char, text });

const VILLAGES = {
  school: {
    name: '마을 안내소',
    char: 'trio',
    theme: 'plaza',
    pin: [41, 47],
    floors: { A: '1층 · 학부 이야기', B: '2층 · 수강 규칙 창구' },
    leads: { majors: '세 마을, 세 개의 전공. 마을을 눌러 바로 놀러 가 보세요.' },
    greet: [
      say('hachiware', '여기는 마을 안내소야! 우리 학부가 어떤 곳인지 먼저 알려줄게.'),
      say('usagi', '야하~! 여긴 {tagline}'),
      say('chiikawa', '……! (치이카와가 2층 창구를 가리킨다. 수강 규칙은 저기서 확인!)'),
    ],
    places: {
      vision: ['마을의 약속', 'house'],
      goals: ['배움 목표', 'sprout'],
      talent: ['기다리는 손님', 'heart'],
      traits: ['마을의 자랑', 'sign'],
      majors: ['세 마을 안내도', 'signpost'],
      prereq: ['먼저 들을 과목', 'path'],
      preapproval: ['사전 허가 창구', 'check'],
      projects: ['프로젝트 작업실', 'workshop'],
      credits: ['학점 인정 창구', 'check'],
      intern: ['현장 실습 창구', 'post'],
      legacy: ['옛 마을 기록', 'mailbox'],
      changes: ['변경 공지', 'board'],
    },
  },

  ge: {
    name: '하치와레 언덕',
    char: 'hachiware',
    theme: 'hachi',
    pin: [21, 33],
    greet: [
      say('hachiware', '어서 와, 손님! 나는 하치와레야. 여긴 아이디어를 사업으로 키우는 언덕이야.'),
      say('hachiware', '우리 언덕의 목표는 "{tagline}"이야.'),
      say('hachiware', '마지막엔 버스킹 무대(캡스톤)에 서게 될 거야. 어떻게든 될 거야!'),
    ],
    places: {
      notes: '하치와레의 인사',
      tracklist: ['아이디어 장터', 'stall'],
      sequence: '성장 산책로',
      credits: '졸업 체크리스트',
      capstone: '버스킹 무대',
      projects: '작업실',
      others: '이웃 마을 우편함',
      contact: '문의 우체통',
    },
  },

  ai: {
    name: '우사기 갈림길',
    char: 'usagi',
    theme: 'usagi',
    pin: [79, 33],
    kind: '다섯 갈래 융합 전공',
    leads: { discs: '가고 싶은 길(트랙)을 골라 보세요.' },
    greet: [
      say('usagi', '우라! 손님이다! 여기는 우사기 갈림길이야~'),
      say('usagi', '목표는 "{tagline}"! 그래서 길이 다섯 갈래야.'),
      say('usagi', 'ICT · ACE · 생명 · 경영 · 경제… 야하! 마음에 드는 길로 가 봐!'),
    ],
    places: {
      notes: '우사기의 인사',
      structure: '갈림길 이정표',
      discs: '다섯 갈래 길',
      common: ['공용 텃밭', 'sprout'],
      bizcommon: '세 갈래 공동 규칙',
      capstone: '축제 무대',
      others: '이웃 마을 우편함',
      contact: '문의 우체통',
    },
  },

  ds: {
    name: '치이카와 풀밭',
    char: 'chiikawa',
    theme: 'chii',
    pin: [50, 76],
    greet: [
      say('chiikawa', '……! (치이카와가 수줍게 손을 흔든다)'),
      say('chiikawa', '(풀을 뽑듯 데이터를 하나하나 다듬는 마을이에요. 목표는 "{tagline}"!)'),
      say('chiikawa', '(졸업 요건은 저쪽 검정 시험장에 있어요. 차근차근 하면 할 수 있어!)'),
    ],
    places: {
      notes: '치이카와의 인사',
      tracklist: ['데이터 텃밭', 'sprout'],
      sequence: '성장 산책로',
      credits: '검정 시험장',
      md: '배지 진열장',
      capstone: '공동 작업장',
      others: '이웃 마을 우편함',
      contact: '문의 우체통',
    },
  },

  events: {
    name: '광장 게시판',
    char: null,
    theme: 'plaza',
    pin: [60, 49],
    greet: [
      say('hachiware', '광장 게시판이야! 학부 행사 소식이 여기 붙어.'),
      say('chiikawa', '(아직 비어 있으면… 조금만 기다려 주세요!)'),
    ],
    places: { tracklist: ['광장 게시판', 'board'] },
  },
};

window.VILLAGE_DATA = { CHARS, VILLAGES };
