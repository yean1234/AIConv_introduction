# AI융합학부 Records

한동대학교 AI융합학부 전공 소개 페이지. 전공마다 LP 앨범 한 장이 할당되어, 카드처럼 넘기며 고르고 눌러서 앨범 상세(전공 커리큘럼)를 봅니다.

- 빌드 없음 — `index.html`을 브라우저로 열면 됩니다. (GitHub Pages 등 정적 호스팅 그대로 가능)
- 디자인: Figma "Riff 28 Card Shuffle" (카드 스택 모션·토큰·에셋은 `assets/`)
- 내용: `2026-2_12_AICnv.pdf` 요람 기준

## 파일

| 파일 | 역할 |
| --- | --- |
| `data.js` | 과목 DB(`COURSES`)와 앨범별 내용(`RECORDS`) — 내용 수정은 여기서만 |
| `app.js` | 카드 셔플, 라우팅(`#/ge`, `#/ai/ict` …), 앨범 상세 렌더링 |
| `styles.css` | 스타일 |

## 학부 행사 추가

`data.js`의 `events` 레코드에 항목을 넣으면 B-Side 앨범의 트랙리스트로 표시됩니다.

```js
events: [
  { date: '2027.03.02', title: '전공 설명회', place: '뉴턴홀', desc: '세 전공 주임교수님 소개', tag: '설명회' },
],
```
