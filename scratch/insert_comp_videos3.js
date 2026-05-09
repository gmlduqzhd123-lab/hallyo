const fs = require('fs');

const data = `
| 번호 | 대회           | 종목·구분     | 영상 제목                                          | Full 링크 주소                                                                                 | 추천 이유                             |
| -: | ------------ | --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------- |
|  1 | 제106회 전국체육대회 | 개인혼영 200m | 경영 개인혼영 200m 황선우 한국신기록 제106회 전국체육대회            | [https://www.youtube.com/watch?v=cIc5HFbsFx8](https://www.youtube.com/watch?v=cIc5HFbsFx8) | 개인혼영 4영법 전환과 후반 집중력을 보기 좋음.       |
|  2 | 제106회 전국체육대회 | 자유형 400m  | 경영 자유형 400m 한다경 한국신기록 제106회 전국체육대회             | [https://www.youtube.com/watch?v=Ys6VFInGhYM](https://www.youtube.com/watch?v=Ys6VFInGhYM) | 중장거리 자유형 페이스 운영과 후반 스퍼트 참고용.      |
|  3 | 제106회 전국체육대회 | 계영 400m   | 경영 계영 400m 한국신기록 제106회 전국체육대회                  | [https://www.youtube.com/watch?v=rg80DL7xo6g](https://www.youtube.com/watch?v=rg80DL7xo6g) | 계영 인계와 팀 레이스 흐름을 분석하기 좋음.         |
|  4 | 제106회 전국체육대회 | 자유형 200m  | 황선우, 쑨양도 넘었다!!! 아시아신기록 작성 대기록 순간 FULL중계        | [https://www.youtube.com/watch?v=XlmQvVlMKJw](https://www.youtube.com/watch?v=XlmQvVlMKJw) | 자유형 200m 레이스 운영과 세계급 페이스를 볼 수 있음. |
|  5 | 제106회 전국체육대회 | 계영 800m   | 국가대표 드림팀이 해냈구나! 대회 신기록 우승                      | [https://www.youtube.com/watch?v=tpddRzCBRFY](https://www.youtube.com/watch?v=tpddRzCBRFY) | 단체전에서 영자별 역할과 마지막 주자 스퍼트를 보기 좋음.  |
|  6 | 제105회 전국체육대회 | 자유형 50m   | #전국체전 #수영 고등부∙일반부 자유형 50m 결승                   | [https://www.youtube.com/watch?v=IOCtl7JG-WA](https://www.youtube.com/watch?v=IOCtl7JG-WA) | 단거리 스타트, 반응속도, 터치 집중력 참고용.        |
|  7 | 제105회 전국체육대회 | 자유형 200m  | #전국체전 #수영 고등부∙일반부 자유형 200m 결승                  | [https://www.youtube.com/watch?v=1VPZhXbcegE](https://www.youtube.com/watch?v=1VPZhXbcegE) | 자유형 200m 전반·후반 페이스 비교에 좋음.        |
|  8 | 제105회 전국체육대회 | 평영 100m   | #전국체전 #수영 고등부∙일반부 평영 100m 결승                   | [https://www.youtube.com/watch?v=wcj4NY6kxfM](https://www.youtube.com/watch?v=wcj4NY6kxfM) | 평영 킥 리듬과 턴 후 글라이드 분석에 좋음.         |
|  9 | 제105회 전국체육대회 | 평영 200m   | #전국체전 #수영 고등부∙일반부 평영 200m 결승                   | [https://www.youtube.com/watch?v=D8MylQgFr0Q](https://www.youtube.com/watch?v=D8MylQgFr0Q) | 평영 200m 체력 배분과 후반 템포 유지 참고용.      |
| 10 | 제105회 전국체육대회 | 배영 200m   | 이은지, 한국신기록 우승 #전국체전 #수영 고등부∙일반부 배영 200m 결승     | [https://www.youtube.com/watch?v=MKGCKUs613Y](https://www.youtube.com/watch?v=MKGCKUs613Y) | 배영 자세 유지와 턴 후 수면 위 전환을 보기 좋음.     |
| 11 | 제105회 전국체육대회 | 접영 50m    | #전국체전 #수영 일반부 접영 50m 결승                        | [https://www.youtube.com/watch?v=LfDxxEgi8gQ](https://www.youtube.com/watch?v=LfDxxEgi8gQ) | 접영 단거리 돌핀킥과 양손 터치 집중력 참고용.        |
| 12 | 제105회 전국체육대회 | 접영 200m   | #전국체전 #수영 일반부 접영 200m 결승                       | [https://www.youtube.com/watch?v=D2bsusFOTtQ](https://www.youtube.com/watch?v=D2bsusFOTtQ) | 접영 200m 리듬 유지와 체력 운영을 보기 좋음.      |
| 13 | 제105회 전국체육대회 | 계영 400m   | #전국체전 #수영 고등부∙일반부 계영 400m 결승                   | [https://www.youtube.com/watch?v=eGLqz05Js3M](https://www.youtube.com/watch?v=eGLqz05Js3M) | 계영 스타트와 인계 타이밍을 분석하기 좋음.          |
| 14 | 제105회 전국체육대회 | 계영 800m   | 황선우x김우민 우승 합작 #전국체전 #수영 고등부∙일반부 계영 800m 결승     | [https://www.youtube.com/watch?v=NoROv74rIoQ](https://www.youtube.com/watch?v=NoROv74rIoQ) | 장거리 계영에서 영자별 페이스 차이를 보기 좋음.       |
| 15 | 제105회 전국체육대회 | 혼계영 400m  | #전국체전 #수영 일반부 혼계영 400m 결승                      | [https://www.youtube.com/watch?v=tD3Kc26cFC0](https://www.youtube.com/watch?v=tD3Kc26cFC0) | 혼계영 순서와 영법별 역할을 이해하기 좋음.          |
| 16 | 제104회 전국체육대회 | 자유형 50m   | [전국체전] 내가 한국신기록이라니 / 수영 자유형 50m 결승             | [https://www.youtube.com/watch?v=KU772l-amec](https://www.youtube.com/watch?v=KU772l-amec) | 자유형 50m 스타트부터 터치까지 전력 질주 흐름 확인용.  |
| 17 | 제104회 전국체육대회 | 자유형 100m  | [전국체전] 4관왕즈 / 수영 자유형 100m 결승                   | [https://www.youtube.com/watch?v=wPEyR0FonR8](https://www.youtube.com/watch?v=wPEyR0FonR8) | 100m 전반 스피드와 후반 버티기 비교에 좋음.       |
| 18 | 제104회 전국체육대회 | 자유형 200m  | [전국체전] 친구, 동료 그리고 라이벌 / 수영 자유형 200m 결승         | [https://www.youtube.com/watch?v=Fz71TZamhVM](https://www.youtube.com/watch?v=Fz71TZamhVM) | 자유형 200m에서 경쟁자와의 페이스 싸움을 보기 좋음.   |
| 19 | 제104회 전국체육대회 | 배영 100m   | [전국체전] 기록이 콸콸콸~ / 수영 배영 100m 결승                | [https://www.youtube.com/watch?v=NAEGBgXuMqk](https://www.youtube.com/watch?v=NAEGBgXuMqk) | 배영 100m 스타트, 턴, 후반 킥 유지 분석용.      |
| 20 | 제104회 전국체육대회 | 배영 50m    | [전국체전] 엄청 빠른 해달 / 수영 배영 50m 결승                 | [https://www.youtube.com/watch?v=Yhp3Ov0l6rg](https://www.youtube.com/watch?v=Yhp3Ov0l6rg) | 배영 단거리 출발과 스트로크 템포 참고용.           |
| 21 | 제104회 전국체육대회 | 평영 100m   | [전국체전] 터치싸움 그리고 세리머니 맛집 / 수영 평영 100m 결승        | [https://www.youtube.com/watch?v=MKGZWdzOKNM](https://www.youtube.com/watch?v=MKGZWdzOKNM) | 평영 100m 접전 상황에서 마지막 터치 집중력 확인용.   |
| 22 | 제104회 전국체육대회 | 평영 50m    | [전국체전] 엄청 빠른 개구리 / 수영 평영 50m 결승                | [https://www.youtube.com/watch?v=DDf3M-HSfXQ](https://www.youtube.com/watch?v=DDf3M-HSfXQ) | 평영 단거리 킥 타이밍과 템포 참고용.             |
| 23 | 제104회 전국체육대회 | 접영 100m   | [전국체전] 10분 사이에 한국신기록이 두 번! / 수영 접영 100m 결승     | [https://www.youtube.com/watch?v=LHoayjJL84Q](https://www.youtube.com/watch?v=LHoayjJL84Q) | 접영 100m 리듬과 후반 자세 유지에 도움 됨.       |
| 24 | 제104회 전국체육대회 | 접영 200m   | [전국체전] 1등 한 나, 최고야 / 수영 접영 200m 결승             | [https://www.youtube.com/watch?v=cPaCYIwQ5Y8](https://www.youtube.com/watch?v=cPaCYIwQ5Y8) | 접영 200m 페이스 조절과 체력 분배 참고용.        |
| 25 | 제104회 전국체육대회 | 개인혼영 200m | [전국체전] 접영부터 배영, 평영, 자유형까지! / 수영 개인혼영 200m 결승   | [https://www.youtube.com/watch?v=TgfDZ5UhaEw](https://www.youtube.com/watch?v=TgfDZ5UhaEw) | 개인혼영 영법 전환과 턴 연결을 보기 좋음.          |
| 26 | 제104회 전국체육대회 | 혼성혼계영     | [전국체전] 울산 돌핀즈 또 물보라를 일으켜~ / 수영 혼성 혼계영          | [https://www.youtube.com/watch?v=jTGgHVGSnZo](https://www.youtube.com/watch?v=jTGgHVGSnZo) | 혼성혼계영 팀 구성과 영법별 흐름 이해용.           |
| 27 | 제104회 전국체육대회 | 계영 400m   | [전국체전] 우린 이걸 청춘 드라마라고 부르기로 했어요 / 수영 계영 400m 결승 | [https://www.youtube.com/watch?v=j6tu37E-9I4](https://www.youtube.com/watch?v=j6tu37E-9I4) | 계영 막판 역전과 팀워크 동기부여용으로 좋음.         |
| 28 | 제103회 전국체육대회 | 자유형 200m  | 전국체전 자유형 200m 신기록 세운 황선우, 벌써 두 번째 금메달          | [https://www.youtube.com/watch?v=azOGiFHqW9Q](https://www.youtube.com/watch?v=azOGiFHqW9Q) | 자유형 200m 경기 운영과 대회 신기록 레이스 참고용.   |
| 29 | 제103회 전국체육대회 | 자유형 100m  | 전국체전 기록 제조기 황선우, 100m 예선-결승 모두 대회신기록           | [https://www.youtube.com/watch?v=3RDY3RhS0z4](https://www.youtube.com/watch?v=3RDY3RhS0z4) | 100m 예선과 결승 기록 차이를 이야기하기 좋음.      |
| 30 | 제103회 전국체육대회 | 계영 400m   | 마지막 4번 영자 황선우 계영 400m 한국신기록 경신                 | [https://www.youtube.com/watch?v=Vb8LrV9fP_M](https://www.youtube.com/watch?v=Vb8LrV9fP_M) | 마지막 영자의 추격전과 계영 집중력을 보기 좋음.       |
| 31 | 제103회 전국체육대회 | 혼계영 400m  | 아... 한국 신기록으로 터치패드 찍었는데.. 황선우 5관왕 무산           | [https://www.youtube.com/watch?v=Avb5rGyhJXc](https://www.youtube.com/watch?v=Avb5rGyhJXc) | 부정출발·규칙 준수의 중요성을 설명하기 좋은 사례.      |
| 32 | 제103회 전국체육대회 | 배영        | 배영 대회 신기록 세우며 금메달 획득한 이주호·이은지                  | [https://www.youtube.com/watch?v=ROKz7aLQsDY](https://www.youtube.com/watch?v=ROKz7aLQsDY) | 배영 전문 선수들의 자세와 턴을 참고하기 좋음.        |
| 33 | 제103회 전국체육대회 | 개인혼영      | 접영-배영-평영-자유형 다~ 잘하는 김서영·김민석                    | [https://www.youtube.com/watch?v=NjOG49F8ClY](https://www.youtube.com/watch?v=NjOG49F8ClY) | 개인혼영 선수들의 영법 전환을 비교하기 좋음.         |
| 34 | 제98회 전국체육대회  | 자유형 400m  | 2017 전국체전 - [수영] 여자 일반부 자유형 400m 결승 1조         | [https://www.youtube.com/watch?v=t9Uc7poSagw](https://www.youtube.com/watch?v=t9Uc7poSagw) | 자유형 400m 초반 페이스와 후반 버티기 관찰용.      |
| 35 | 제98회 전국체육대회  | 자유형 400m  | 2017 전국체전 - [수영] 여자 일반부 자유형 400m 결승 2조         | [https://www.youtube.com/watch?v=wHn34a2B8eg](https://www.youtube.com/watch?v=wHn34a2B8eg) | 같은 종목 조별 레이스 차이를 비교하기 좋음.         |
| 36 | 제98회 전국체육대회  | 자유형 400m  | 2017 전국체전 - [수영] 남자 일반부 자유형 400m 결승 1조         | [https://www.youtube.com/watch?v=J-3GE4S8E4I](https://www.youtube.com/watch?v=J-3GE4S8E4I) | 남자 일반부 중거리 페이스 운영 참고용.            |
| 37 | 제98회 전국체육대회  | 자유형 400m  | 2017 전국체전 - [수영] 남자 일반부 자유형 400m 결승 2조         | [https://www.youtube.com/watch?v=kDnw0GLVPhw](https://www.youtube.com/watch?v=kDnw0GLVPhw) | 400m에서 구간별 속도 유지 차이를 보기 좋음.       |
| 38 | 제98회 전국체육대회  | 자유형 400m  | 2017 전국체전 - [수영] 남자 일반부 자유형 400m 결승 3조         | [https://www.youtube.com/watch?v=VBXaoyo5MKg](https://www.youtube.com/watch?v=VBXaoyo5MKg) | 상위 조 레이스 흐름과 후반 스퍼트 참고용.          |
| 39 | 제98회 전국체육대회  | 배영 50m    | 2017 전국체전 - [수영] 여자 일반부 배영 50m 결승              | [https://www.youtube.com/watch?v=60jsMrZKepQ](https://www.youtube.com/watch?v=60jsMrZKepQ) | 배영 단거리 스타트와 팔 템포 관찰용.             |
| 40 | 제98회 전국체육대회  | 배영 50m    | 2017 전국체전 - [수영] 남자 일반부 배영 50m 결승              | [https://www.youtube.com/watch?v=VbVwI_ZKz2g](https://www.youtube.com/watch?v=VbVwI_ZKz2g) | 배영 50m에서 출발 후 잠영과 수면 전환을 보기 좋음.   |
| 41 | 제98회 전국체육대회  | 배영 50m    | 2017 전국체전 - [수영] 남자 고등부 배영 50m 결승              | [https://www.youtube.com/watch?v=9cSqQGoQOCc](https://www.youtube.com/watch?v=9cSqQGoQOCc) | 학생 선수들이 고등부 배영 단거리 흐름을 참고하기 좋음.   |
| 42 | 제98회 전국체육대회  | 개인혼영 200m | 2017 전국체전 - [수영] 남자 일반부 개인혼영 200m 결승           | [https://www.youtube.com/watch?v=VSb2SYsG-Dc](https://www.youtube.com/watch?v=VSb2SYsG-Dc) | 개인혼영 전환 턴과 종목별 강약 비교에 좋음.         |
| 43 | 제98회 전국체육대회  | 개인혼영 200m | 2017 전국체전 - [수영] 여자 고등부 개인혼영 200m 결승           | [https://www.youtube.com/watch?v=Z7h2LtVwblA](https://www.youtube.com/watch?v=Z7h2LtVwblA) | 여자 고등부 IM 레이스 운영을 참고하기 좋음.        |
| 44 | 제98회 전국체육대회  | 자유형 400m  | 2017 전국체전 - [수영] 여자 고등부 자유형 400m 결승 1조         | [https://www.youtube.com/watch?v=XHlVCdteOB0](https://www.youtube.com/watch?v=XHlVCdteOB0) | 학생 선수들의 400m 페이스 조절 참고용.          |
| 45 | 제98회 전국체육대회  | 자유형 400m  | 2017 전국체전 - [수영] 여자 고등부 자유형 400m 결승 2조         | [https://www.youtube.com/watch?v=4EWRRAC5fFk](https://www.youtube.com/watch?v=4EWRRAC5fFk) | 같은 종목 조별 기록 차이와 레이스 흐름 비교에 좋음.    |
| 46 | 제98회 전국체육대회  | 계영 400m   | 2017 전국체전 - [수영] 여자 고등부 계영 400m 결승 1조          | [https://www.youtube.com/watch?v=EHv0aQGeRRw](https://www.youtube.com/watch?v=EHv0aQGeRRw) | 여자 고등부 계영 인계와 팀 운영 참고용.           |
| 47 | 제98회 전국체육대회  | 계영 400m   | 2017 전국체전 - [수영] 여자 고등부 계영 400m 결승 2조          | [https://www.youtube.com/watch?v=O4ePk4S0wnY](https://www.youtube.com/watch?v=O4ePk4S0wnY) | 계영에서 조별 레이스 속도 차이를 비교하기 좋음.       |
| 48 | 제98회 전국체육대회  | 계영 400m   | 2017 전국체전 - [수영] 남자 일반부 계영 400m 결승 1조          | [https://www.youtube.com/watch?v=copWhbwf2sM](https://www.youtube.com/watch?v=copWhbwf2sM) | 남자 일반부 계영 인계와 스퍼트 분석용.            |
| 49 | 제98회 전국체육대회  | 계영 400m   | 2017 전국체전 - [수영] 남자 일반부 계영 400m 결승 2조          | [https://www.youtube.com/watch?v=jjJSGjT36EA](https://www.youtube.com/watch?v=jjJSGjT36EA) | 빠른 계영 인계와 마지막 영자 운영을 보기 좋음.       |
| 50 | 제98회 전국체육대회  | 계영 400m   | 2017 전국체전 - [수영] 남자 고등부 계영 400m 결승 2조          | [https://www.youtube.com/watch?v=pyhLDK_oggk](https://www.youtube.com/watch?v=pyhLDK_oggk) | 고등부 계영 경기 흐름과 팀워크 동기부여용으로 좋음.     |
`;

const mapCategory = (rawCategory) => {
  if (rawCategory.includes('자유형')) return '자유형';
  if (rawCategory.includes('배영')) return '배영';
  if (rawCategory.includes('접영')) return '접영';
  if (rawCategory.includes('평영')) return '평영';
  if (rawCategory.includes('혼계영')) return '혼계영';
  if (rawCategory.includes('계영')) return '기타'; // There is no 계영 category, put it in 기타. Oh wait, user might want to map to 기타. Let's map it.
  if (rawCategory.includes('개인혼영')) return '개인혼영';
  return '기타';
};

const lines = data.split('\n').filter(l => l.trim() !== '' && l.includes('|'));
let sql = "INSERT INTO public.competition_videos (url, title, description, category, status) VALUES\n";

const values = lines.map(line => {
  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 7) return null;
  const num = parts[1];
  if (isNaN(parseInt(num))) return null; // skip header
  
  const competition = parts[2];
  const event = parts[3];
  let title = parts[4].replace(/'/g, "''");
  let url = parts[5];
  const match = url.match(/\[(.*?)\]/);
  if (match) {
    url = match[1];
  }
  let desc = parts[6].replace(/'/g, "''");

  const category = mapCategory(event);

  // prefix title with [대회] [종목] if not present
  if (!title.includes(competition)) {
    title = '[' + competition + '] ' + title;
  }
  
  desc = '[' + event + '] ' + desc;

  return "('" + url + "', '" + title + "', '" + desc + "', '" + category + "', 'approved')";
}).filter(Boolean);

sql += values.join(',\n') + ';';

fs.writeFileSync('scratch/insert_comp_videos3.sql', sql);
