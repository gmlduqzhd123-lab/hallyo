const fs = require('fs');

const data = `
|  1 | 공식 훈련  | [대한수영연맹] 맞춤형 훈련 프로그램 3차 경영 1강 “자유형”        | https://www.youtube.com/watch?v=GPfTCJneQmA | 대한수영연맹 공식 자료로 자유형 기본 흐름을 정리하기 좋음.  |
|  2 | 공식 훈련  | [대한수영연맹] 맞춤형 훈련 프로그램 3차 경영 2강 “배영”         | https://www.youtube.com/watch?v=dxOILKpr3X4 | 배영 기본 자세와 훈련 방향을 잡는 데 도움 됨.        |
|  3 | 공식 훈련  | [대한수영연맹] 맞춤형 훈련 프로그램 3차 경영 3강 “평영”         | https://www.youtube.com/watch?v=h8pd9cGKDsQ | 평영 킥과 타이밍을 선수 관점에서 복습하기 좋음.        |
|  4 | 공식 훈련  | [대한수영연맹] 맞춤형 훈련 프로그램 3차 경영 4강 “접영”         | https://www.youtube.com/watch?v=j1G6Qzu7sho | 접영 리듬과 기본 움직임을 점검할 수 있음.           |
|  5 | 공식 훈련  | [대한수영연맹] 맞춤형 프로그램 경영 3강 “자유형 기초, 팔동작 및 호흡” | https://www.youtube.com/watch?v=-z4OwuQlMgk | 자유형 호흡과 팔동작을 기초부터 다지기 좋음.          |
|  6 | 공식 훈련  | [대한수영연맹] 맞춤형 프로그램 경영 4강 “자유형 숙달”           | https://www.youtube.com/watch?v=WMyGuju7fIg | 자유형 기록 향상을 위한 숙달 단계 영상.            |
|  7 | 공식 훈련  | [대한수영연맹] 맞춤형 프로그램 경영 5강 “배영 기초”            | https://www.youtube.com/watch?v=urKpZfDCBjA | 배영 발차기, 팔동작, 호흡을 정리하는 데 좋음.        |
|  8 | 공식 훈련  | [대한수영연맹] 맞춤형 프로그램 경영 7강 “평영 기초, 발차기”       | https://www.youtube.com/watch?v=XhSNKbcMviE | 평영 발차기 약한 선수들에게 추천.                |
|  9 | 공식 훈련  | [대한수영연맹] 맞춤형 프로그램 경영 8강 “평영 기초, 팔동작/호흡”    | https://www.youtube.com/watch?v=3gN6VkedOus | 평영 호흡 타이밍과 팔동작 연결을 보기 좋음.          |
| 10 | 공식 훈련  | [대한수영연맹] 맞춤형 프로그램 경영 11강 “접영 숙달”           | https://www.youtube.com/watch?v=4VNZvYsC9EI | 접영을 어느 정도 하는 선수들이 리듬을 다듬기 좋음.      |
| 11 | 지상훈련   | [대한수영연맹] 맞춤형 프로그램 경영 13강 “지상 트레이닝”         | https://www.youtube.com/watch?v=hmh-ot9PqYw | 수영장 밖에서 할 수 있는 보강운동 자료로 활용 가능.     |
| 12 | 자유형    | 이 영상 하나로 자유형 끝내기!                          | https://www.youtube.com/watch?v=tVhe4wXsn5I | 자유형 호흡, 발차기, 스트로크를 한 번에 복습하기 좋음.   |
| 13 | 자유형    | 자유형을 잘하고 싶다면 이걸 반드시 연습해주세요                 | https://www.youtube.com/watch?v=cisPjh5TGv4 | 자유형 실력 향상을 위한 핵심 연습 포인트를 제시함.      |
| 14 | 자유형 호흡 | 자유형 할 때 숨이 찬다면 이 연습을 하세요!                  | https://www.youtube.com/watch?v=2rKeFJSTCmg | 호흡이 급하거나 몸이 뜨는 선수들에게 추천.           |
| 15 | 자유형 킥  | 자유형 발차기의 정석 + 지상훈련 방법                      | https://www.youtube.com/watch?v=CVudFDGJOX4 | 발차기 자세와 지상 보강을 함께 익힐 수 있음.         |
| 16 | 자유형    | 수영 국대가 직접 알려주는 자유형 잘 하는 법                  | https://www.youtube.com/watch?v=ACL0yMG-xT0 | 국가대표 출신이 자유형 호흡, 발차기, 팔동작을 설명함.    |
| 17 | 자유형    | 훈련에 적용하면 좋은 실전 자유형 드릴 2가지                  | https://www.youtube.com/watch?v=lFwn-m4e4S0 | 선수반 훈련에 바로 넣기 좋은 자유형 드릴 영상.        |
| 18 | 자유형    | 편안할 수 있는 팔 동작? 자유형 수영 처음부터 고쳐주세요!          | https://www.youtube.com/watch?v=Tu9KR8aKTIU | 자유형 팔돌리기와 힘 빼기 감각을 잡는 데 좋음.        |
| 19 | 자유형    | 편안하고 부드러운 자유형에 꼭 필요한 팔돌리기 3가지 방법           | https://www.youtube.com/watch?v=IkFqJCqSYAA | 스트로크가 뻣뻣한 선수들에게 추천.                |
| 20 | 자유형    | 나만 모르는 자유형 롤링 3배 더 잘하는 방법                  | https://www.youtube.com/watch?v=Q_Yxkl5ldSc | 자유형 롤링 감각과 몸통 회전을 익히기 좋음.          |
| 21 | 자유형 킥  | 시간이 지날수록 강력해지는 자유형 발차기 훈련 방법               | https://www.youtube.com/watch?v=KkM9s_h9LVs | 발차기 체력과 킥 지속력을 기르는 데 도움 됨.         |
| 22 | 장거리    | 지치지 않고 오래할 수 있는 장거리 수영방법 4가지               | https://www.youtube.com/watch?v=ItBcRqs_eOI | 200m 이상 종목 선수들의 페이스 운영 참고용.        |
| 23 | 배영     | 국가대표 박한별의 배영 잘하는 팁 - 배영킥, 스타트              | https://www.youtube.com/watch?v=-pHVP2VLrXA | 배영 선수들이 킥과 스타트 감각을 익히기 좋음.         |
| 24 | 배영     | 1000만원짜리 수영 공식, 배영 핵심 꿀팁 총정리               | https://www.youtube.com/watch?v=Qxaq0ymH4T0 | 배영 자세, 물잡기, 리듬을 전체적으로 점검 가능.       |
| 25 | 배영     | 비싼 수업 안 들어도 배영을 쉽게 하는 방법                   | https://www.youtube.com/watch?v=bH0q7_nWtHA | 배영 물잡기와 팔동작을 쉽게 이해할 수 있음.          |
| 26 | 배영     | 배영 감각 확 살아나는 롤링, 팔돌리기, 유선형라인               | https://www.youtube.com/watch?v=VrwcW7VZtzk | 배영에서 몸이 흔들리는 선수들에게 좋음.             |
| 27 | 배영     | 배영 발차기 ‘이거 모르면’ 하면 망합니다                    | https://www.youtube.com/watch?v=uzd0zv319VA | 배영 킥이 약하거나 무릎이 많이 나오는 선수에게 추천.     |
| 28 | 배영     | 수영 잘하는 요령! 이 3가지 꿀팁 알고 배영 100% 잘해졌습니다      | https://www.youtube.com/watch?v=32Oq_SJPjs8 | 배영의 기본 실수를 줄이는 데 도움 됨.             |
| 29 | 평영     | 평영 잘하는 사람 90%는 이 방법으로 앞으로 쭉쭉 나가고 있습니다      | https://www.youtube.com/watch?v=Izq1ioyEfWo | 평영 추진력과 글라이드 감각을 익히기 좋음.           |
| 30 | 평영     | 평영 앞으로 쭉쭉 나가는 법                            | https://www.youtube.com/watch?v=XHMO4qxRbFQ | 평영이 제자리에서 맴도는 선수들에게 추천.            |
| 31 | 평영     | 평영 영법 교정 순서 및 방법                           | https://www.youtube.com/watch?v=T_ZfAwQUNeI | 평영 자세를 순서대로 교정하는 데 활용 가능.          |
| 32 | 평영     | 평영 손동작 시 머리 드는 타이밍                         | https://www.youtube.com/watch?v=I8GdhEvpSU8 | 평영 호흡 타이밍이 빠르거나 늦은 선수에게 좋음.        |
| 33 | 평영     | 국가대표 백승호 선수 평영 잘하는 법                       | https://www.youtube.com/watch?v=fRnd41zno4M | 평영 선수들이 상체와 킥 연결을 참고하기 좋음.         |
| 34 | 평영 턴   | 백승호 수영) 접영턴 평영턴                            | https://www.youtube.com/watch?v=zJcPp7G2U3o | 접영·평영 오픈턴과 터치 감각을 익히기 좋음.          |
| 35 | 접영     | 이 영상 하나로 접영 끝내기!                           | https://www.youtube.com/watch?v=aQ8TMw77FKA | 접영 발차기, 웨이브, 팔동작을 전체적으로 복습 가능.     |
| 36 | 접영     | 접영 잘하는 사람 90%가 하고 있는 꿀팁 총정리                | https://www.youtube.com/watch?v=-7ash20nZAU | 접영이 끊기거나 무거운 선수들에게 추천.             |
| 37 | 접영     | 접영 꿀팁 & 접영 기초 발차기                          | https://www.youtube.com/watch?v=evwcY5ia4ms | 돌핀킥과 접영 발차기 기초를 다지기 좋음.            |
| 38 | 접영     | SHC 수영강습_수영 국가대표 백승호 접영 팁                  | https://www.youtube.com/watch?v=7bcVR2ePZk4 | 접영 가슴누르기와 물속 동작을 이해하기 좋음.          |
| 39 | 접영     | 접영 배우는 순서 4단계로 정리 끝                        | https://www.youtube.com/watch?v=O0Mb6qLmUaI | 접영을 단계적으로 익히는 데 적합함.               |
| 40 | 접영     | 접영 돌핀킥 발차기 포인트 & 실수체크                      | https://www.youtube.com/watch?v=YgB3ZkXJooc | 접영 킥이 약하거나 타이밍이 안 맞는 선수에게 추천.      |
| 41 | 스타트    | 수영 초보자의 안전한 다이브 스타트                        | https://www.youtube.com/watch?v=nqxKo6U7MfA | 스타트 안전과 기본 자세를 익히는 데 좋음.           |
| 42 | 스타트    | 11분 만에 배우는 국가대표 서민석 선수의 수영 기술              | https://www.youtube.com/watch?v=Kd4KG1MdZj8 | 스타트, 돌핀킥, 브레이크아웃 기술을 함께 볼 수 있음.    |
| 43 | 스타트    | 수영 스타트의 모든 것 두 번째 이야기, 크라우칭 스타트            | https://www.youtube.com/watch?v=0vsus-Ao2cI | 크라우칭 스타트 자세와 입수 감각을 배우기 좋음.        |
| 44 | 스타트    | 당신의 스타트가 안 되는 이유                           | https://www.youtube.com/watch?v=Rf10FNWJHiA | 스타트 자세가 무너지거나 입수각이 안 좋은 선수에게 추천.   |
| 45 | 턴      | 이것만 알면 턴 완전 잘 할 수 있어요!                     | https://www.youtube.com/watch?v=lqcvUAu2QmI | 턴할 때 몸통 말기, 벽 차기, 유선형 만들기를 익히기 좋음. |
| 46 | 턴      | 당신의 사이드턴이 안 되는 이유                          | https://www.youtube.com/watch?v=6WqIPo9PUuw | 평영·접영 오픈턴 감각을 잡는 데 도움 됨.           |
| 47 | 턴      | 자유형 플립턴 핵꿀팁                                | https://www.youtube.com/watch?v=z130r4940bI | 자유형 플립턴이 느린 선수들에게 추천.              |
| 48 | 스트림라인  | 백승호 수영) 스트림라인                              | https://www.youtube.com/watch?v=u8VVkvEpBY8 | 스타트와 턴 이후 유선형 자세를 잡는 데 좋음.         |
| 49 | 동기부여   | 노련해진 황선우, 거침없는 김우민 “시상대 위에 서겠습니다”          | https://www.youtube.com/watch?v=YK6E0POZIfg | 국가대표 선수들의 목표 의식과 훈련 태도를 볼 수 있음.    |
| 50 | 동기부여   | 황선우·김우민, 세계선수권 준비 위해 전지훈련 떠나               | https://www.youtube.com/watch?v=cPl9XMy8a0g | 큰 대회를 앞둔 국가대표의 준비 과정을 보며 동기부여 가능.  |
`;

const lines = data.split('\n').filter(l => l.trim() !== '' && l.startsWith('|  ') || l.startsWith('| 1') || l.startsWith('| 2') || l.startsWith('| 3') || l.startsWith('| 4') || l.startsWith('| 5'));
let sql = `INSERT INTO public.training_videos (url, title, description, category, status) VALUES\n`;

const values = lines.map(line => {
  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 5) return null;
  const num = parts[1];
  const type = parts[2];
  let title = parts[3].replace(/'/g, "''");
  let url = parts[4];
  const match = url.match(/\[(.*?)\]/);
  if (match) {
    url = match[1];
  }
  let desc = parts[5].replace(/'/g, "''");
  
  let category = '훈련 영상';
  if (type === '동기부여') category = '동기 유발';
  else if (type === '지상훈련') category = '기타 수영 관련';
  else if (title.includes('꿀팁') || title.includes('상식') || title.includes('방법') || title.includes('이유')) category = '수영 상식';
  else category = '훈련 영상';

  return `('${url}', '${title}', '${desc}', '${category}', 'approved')`;
}).filter(Boolean);

sql += values.join(',\n') + ';';

fs.writeFileSync('scratch/insert_videos.sql', sql);
