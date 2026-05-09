const fs = require('fs');

const data = `
| 번호 | 구분   | 영상 제목                                  | Full 링크 주소                                                                                 | 추천 이유                                  |
| -: | ---- | -------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
|  1 | 자유형  | [제20회 꿈나무 전국 수영대회] 남자 유년부 자유형 50M 결승   | [https://www.youtube.com/watch?v=vGR-l340pww](https://www.youtube.com/watch?v=vGR-l340pww) | 저학년 남자 선수들의 단거리 스타트와 킥 템포를 보기 좋음.      |
|  2 | 자유형  | [제20회 꿈나무 전국 수영대회] 여자 유년부 자유형 50M 결승   | [https://www.youtube.com/watch?v=lHZsNNnGCpw](https://www.youtube.com/watch?v=lHZsNNnGCpw) | 여자 유년부 단거리 레이스 흐름과 터치 집중력을 볼 수 있음.     |
|  3 | 자유형  | [제20회 꿈나무 전국 수영대회] 남자 초등부 자유형 50M 결승   | [https://www.youtube.com/watch?v=APQg6oYD2EA](https://www.youtube.com/watch?v=APQg6oYD2EA) | 초등부 자유형 50M의 스타트, 돌핀킥, 전력 질주 감각 참고용.   |
|  4 | 자유형  | [제20회 꿈나무 전국 수영대회] 여자 초등부 자유형 50M 결승   | [https://www.youtube.com/watch?v=W2HILjoj4z8](https://www.youtube.com/watch?v=W2HILjoj4z8) | 여자 초등부 단거리 선수들이 스타트와 후반 스퍼트를 보기 좋음.    |
|  5 | 자유형  | [제20회 꿈나무 전국 수영대회] 남자 중등부 자유형 50M 결승   | [https://www.youtube.com/watch?v=w2DtbU1UkhM](https://www.youtube.com/watch?v=w2DtbU1UkhM) | 빠른 템포와 강한 킥을 비교하며 단거리 감각을 익히기 좋음.      |
|  6 | 자유형  | [제20회 꿈나무 전국수영대회] 여자 중등부 자유형 100M 결승   | [https://www.youtube.com/watch?v=vUaMkzVGNuU](https://www.youtube.com/watch?v=vUaMkzVGNuU) | 100M 전반·후반 페이스와 턴 이후 가속을 볼 수 있음.       |
|  7 | 자유형  | [제20회 꿈나무 전국수영대회] 남자 유년부 자유형 100M 결승   | [https://www.youtube.com/watch?v=15b9OhfUkU0](https://www.youtube.com/watch?v=15b9OhfUkU0) | 유년부 100M 경기 운영과 끝까지 밀고 가는 모습을 보기 좋음.   |
|  8 | 자유형  | [제20회 꿈나무 전국수영대회] 여자 유년부 자유형 100M 결승   | [https://www.youtube.com/watch?v=icBa85Am3Yw](https://www.youtube.com/watch?v=icBa85Am3Yw) | 저학년 선수들의 100M 페이스 조절과 마지막 터치 확인용.      |
|  9 | 자유형  | [제20회 꿈나무 전국수영대회] 남자 초등부 자유형 100M 결승   | [https://www.youtube.com/watch?v=QHTQF8DdDAU](https://www.youtube.com/watch?v=QHTQF8DdDAU) | 초등부 남자 자유형 100M 경기 운영을 분석하기 좋음.        |
| 10 | 자유형  | [제20회 꿈나무 전국수영대회] 여자 초등부 자유형 100M 결승   | [https://www.youtube.com/watch?v=XvihnrzQmnA](https://www.youtube.com/watch?v=XvihnrzQmnA) | 여자 초등부 자유형 100M 선수들의 전후반 차이를 보기 좋음.    |
| 11 | 자유형  | [제20회 꿈나무 전국수영대회] 남자 중등부 자유형 100M 결승   | [https://www.youtube.com/watch?v=HEkqymNlUkY](https://www.youtube.com/watch?v=HEkqymNlUkY) | 중등부 선수들의 레이스 템포와 턴 이후 속도 유지 참고용.       |
| 12 | 자유형  | [제20회 꿈나무 전국수영대회] 여자 초등부 자유형 200M 결승   | [https://www.youtube.com/watch?v=DaDbfc9e35E](https://www.youtube.com/watch?v=DaDbfc9e35E) | 200M 페이스 배분과 후반 버티는 힘을 보기 좋음.          |
| 13 | 자유형  | [제20회 꿈나무 전국수영대회] 남자 초등부 자유형 200M 결승   | [https://www.youtube.com/watch?v=F-zu2HjlzAs](https://www.youtube.com/watch?v=F-zu2HjlzAs) | 초등부 남자 200M 선수들의 구간별 페이스 조절 참고용.       |
| 14 | 자유형  | [제20회 꿈나무 전국수영대회] 남자 중등부 자유형 200M 결승   | [https://www.youtube.com/watch?v=_97d-LdzD4k](https://www.youtube.com/watch?v=_97d-LdzD4k) | 중거리 자유형의 턴, 호흡, 후반 체력 운영을 볼 수 있음.      |
| 15 | 자유형  | [제20회 꿈나무 전국수영대회] 여자 중등부 자유형 200M 결승   | [https://www.youtube.com/watch?v=5zwHQnxGk0o](https://www.youtube.com/watch?v=5zwHQnxGk0o) | 중등부 여자 자유형 200M 페이스와 마지막 스퍼트 참고용.      |
| 16 | 배영   | [제20회 꿈나무 전국수영대회] 남자 유년부 배영 50M 결승     | [https://www.youtube.com/watch?v=cdrPMt-ZZKg](https://www.youtube.com/watch?v=cdrPMt-ZZKg) | 유년부 배영 스타트와 짧은 거리 킥 템포를 보기 좋음.         |
| 17 | 배영   | [제20회 꿈나무 전국수영대회] 여자 유년부 배영 50M 결승     | [https://www.youtube.com/watch?v=10TYU0ThxE4](https://www.youtube.com/watch?v=10TYU0ThxE4) | 배영 자세 안정과 레인 유지 감각을 확인하기 좋음.           |
| 18 | 배영   | [제20회 꿈나무 전국수영대회] 남자 초등부 배영 50M 결승     | [https://www.youtube.com/watch?v=yVjHAdfytH8](https://www.youtube.com/watch?v=yVjHAdfytH8) | 초등부 배영 50M의 스타트와 빠른 팔 템포를 비교하기 좋음.     |
| 19 | 배영   | [제20회 꿈나무 전국수영대회] 여자 초등부 배영 50M 결승     | [https://www.youtube.com/watch?v=DZxx78Xu2WE](https://www.youtube.com/watch?v=DZxx78Xu2WE) | 여자 초등부 배영 단거리 선수들의 킥과 몸의 중심 확인용.       |
| 20 | 배영   | [제20회 꿈나무 전국수영대회] 남자 중등부 배영 50M 결승     | [https://www.youtube.com/watch?v=ZjIt2VvmzMA](https://www.youtube.com/watch?v=ZjIt2VvmzMA) | 빠른 배영 스타트와 수면 위 자세를 관찰하기 좋음.           |
| 21 | 배영   | [제20회 꿈나무 전국수영대회] 여자 중등부 배영 50M 결승     | [https://www.youtube.com/watch?v=lwK3TeaG63k](https://www.youtube.com/watch?v=lwK3TeaG63k) | 중등부 여자 선수들의 배영 속도감과 마무리 터치 참고용.        |
| 22 | 배영   | [제20회 꿈나무 전국수영대회] 남자 유년부 배영 100M 결승    | [https://www.youtube.com/watch?v=yNDqWIOIAhs](https://www.youtube.com/watch?v=yNDqWIOIAhs) | 100M 배영에서 턴 이후 자세 유지가 어떻게 되는지 보기 좋음.   |
| 23 | 배영   | [제20회 꿈나무 전국수영대회] 여자 유년부 배영 100M 결승    | [https://www.youtube.com/watch?v=KYob88bLiBs](https://www.youtube.com/watch?v=KYob88bLiBs) | 유년부 배영 100M의 페이스와 후반 킥 유지 참고용.         |
| 24 | 배영   | [제20회 꿈나무 전국수영대회] 남자 초등부 배영 100M 결승    | [https://www.youtube.com/watch?v=RrGT4fJcSD8](https://www.youtube.com/watch?v=RrGT4fJcSD8) | 초등부 배영 선수들의 턴 전 거리 판단과 후반 운영을 볼 수 있음.  |
| 25 | 배영   | [제20회 꿈나무 전국수영대회] 여자 초등부 배영 100M 결승    | [https://www.youtube.com/watch?v=j6pXNijbKx4](https://www.youtube.com/watch?v=j6pXNijbKx4) | 여자 초등부 배영 100M의 자세 유지와 팔 리듬 참고용.       |
| 26 | 배영   | [제20회 꿈나무 전국수영대회] 여자 중등부 배영 100M 결승    | [https://www.youtube.com/watch?v=IAWD08nUfdc](https://www.youtube.com/watch?v=IAWD08nUfdc) | 중등부 배영의 스타트, 턴, 후반 스피드 유지 분석용.         |
| 27 | 평영   | [제20회 꿈나무 전국수영대회] 남자 유년부 평영 50M 결승     | [https://www.youtube.com/watch?v=bi1D5reuXX8](https://www.youtube.com/watch?v=bi1D5reuXX8) | 평영 킥 타이밍과 짧은 거리 추진력을 보기 좋음.            |
| 28 | 평영   | [제20회 꿈나무 전국수영대회] 남자 초등부 평영 50M 결승     | [https://www.youtube.com/watch?v=WLPhioOCv60](https://www.youtube.com/watch?v=WLPhioOCv60) | 초등부 평영 선수들의 킥, 글라이드, 양손 터치 확인용.        |
| 29 | 평영   | [제20회 꿈나무 전국수영대회] 여자 초등부 평영 50M 결승     | [https://www.youtube.com/watch?v=uPL6pg4YBjg](https://www.youtube.com/watch?v=uPL6pg4YBjg) | 여자 초등부 평영 50M의 리듬과 호흡 타이밍을 보기 좋음.      |
| 30 | 평영   | [제20회 꿈나무 전국수영대회] 남자 중등부 평영 50M 결승     | [https://www.youtube.com/watch?v=ZAQGOCILrpg](https://www.youtube.com/watch?v=ZAQGOCILrpg) | 중등부 평영 단거리에서 빠른 템포와 글라이드 차이를 볼 수 있음.   |
| 31 | 평영   | [제20회 꿈나무 전국수영대회] 여자 중등부 평영 50M 결승     | [https://www.youtube.com/watch?v=RX_9WZZVdew](https://www.youtube.com/watch?v=RX_9WZZVdew) | 여자 중등부 평영 선수들의 킥 타이밍과 터치 감각 참고용.       |
| 32 | 평영   | [제20회 꿈나무 전국수영대회] 남자 유년부 평영 100M 결승    | [https://www.youtube.com/watch?v=jyGUaqLroSg](https://www.youtube.com/watch?v=jyGUaqLroSg) | 평영 100M에서 초반과 후반 템포 차이를 보기 좋음.         |
| 33 | 평영   | [제20회 꿈나무 전국수영대회] 여자 유년부 평영 100M 결승    | [https://www.youtube.com/watch?v=0Vt__vmbTYk](https://www.youtube.com/watch?v=0Vt__vmbTYk) | 유년부 여자 평영 100M의 체력 운영과 리듬 참고용.         |
| 34 | 평영   | [제20회 꿈나무 전국수영대회] 남자 초등부 평영 100M 결승    | [https://www.youtube.com/watch?v=PksQihURSjg](https://www.youtube.com/watch?v=PksQihURSjg) | 초등부 평영 선수들의 턴, 글라이드, 후반 유지력 분석용.       |
| 35 | 평영   | [제20회 꿈나무 전국수영대회] 여자 초등부 평영 100M 결승    | [https://www.youtube.com/watch?v=AxZL0QAqV2M](https://www.youtube.com/watch?v=AxZL0QAqV2M) | 여자 초등부 평영 100M의 호흡 리듬과 마무리 터치 참고용.     |
| 36 | 접영   | [제20회 꿈나무 전국수영대회] 남자 유년부 접영 50M 결승     | [https://www.youtube.com/watch?v=Y7ZwN_MpB_M](https://www.youtube.com/watch?v=Y7ZwN_MpB_M) | 유년부 접영 50M의 돌핀킥과 팔 리듬을 보기 좋음.          |
| 37 | 접영   | [제20회 꿈나무 전국수영대회] 여자 유년부 접영 50M 결승     | [https://www.youtube.com/watch?v=p1t7IlcXt5g](https://www.youtube.com/watch?v=p1t7IlcXt5g) | 여자 유년부 접영 선수들의 리듬과 마지막 터치 참고용.         |
| 38 | 접영   | [제20회 꿈나무 전국수영대회] 여자 초등부 접영 50M 결승     | [https://www.youtube.com/watch?v=S1ioaTZ7MLc](https://www.youtube.com/watch?v=S1ioaTZ7MLc) | 여자 초등부 접영 50M의 전력 질주와 양손 터치 확인용.       |
| 39 | 접영   | [제20회 꿈나무 전국수영대회] 남자 중등부 접영 50M 결승     | [https://www.youtube.com/watch?v=U9TO2mYmSWY](https://www.youtube.com/watch?v=U9TO2mYmSWY) | 중등부 접영 단거리의 빠른 리듬과 수면 위 동작 참고용.        |
| 40 | 접영   | [제20회 꿈나무 전국수영대회] 여자 중등부 접영 50M 결승     | [https://www.youtube.com/watch?v=UQxBGhDS_eA](https://www.youtube.com/watch?v=UQxBGhDS_eA) | 여자 중등부 접영 50M의 스타트와 후반 터치 집중력을 볼 수 있음. |
| 41 | 접영   | [제20회 꿈나무 전국 수영대회] 남자 유년부 접영 100M 결승   | [https://www.youtube.com/watch?v=HCMvFLOEEbw](https://www.youtube.com/watch?v=HCMvFLOEEbw) | 접영 100M에서 리듬을 끝까지 유지하는 모습을 보기 좋음.      |
| 42 | 접영   | [제20회 꿈나무 전국 수영대회] 여자 유년부 접영 100M 결승   | [https://www.youtube.com/watch?v=1YG4CF2cv8c](https://www.youtube.com/watch?v=1YG4CF2cv8c) | 유년부 접영 100M의 체력 분배와 후반 자세 변화를 볼 수 있음.  |
| 43 | 접영   | [제20회 꿈나무 전국 수영대회] 여자 초등부 접영 100M 결승   | [https://www.youtube.com/watch?v=-UbAaWFX-28](https://www.youtube.com/watch?v=-UbAaWFX-28) | 초등부 접영 선수들의 100M 페이스와 턴 이후 가속 참고용.     |
| 44 | 접영   | [제20회 꿈나무 전국 수영대회] 남자 중등부 접영 100M 결승   | [https://www.youtube.com/watch?v=1NdPtysfQKQ](https://www.youtube.com/watch?v=1NdPtysfQKQ) | 중등부 접영 100M의 전반 스피드와 후반 버티기 분석용.       |
| 45 | 접영   | [제20회 꿈나무 전국 수영대회] 여자 중등부 접영 100M 결승   | [https://www.youtube.com/watch?v=J3gkhMAVcQk](https://www.youtube.com/watch?v=J3gkhMAVcQk) | 여자 중등부 접영 100M 선수들의 리듬과 후반 경기 운영 참고용.  |
| 46 | 접영   | [제20회 꿈나무 전국수영대회] 남자 중등부 접영 200M 결승    | [https://www.youtube.com/watch?v=WFOi4D38i5w](https://www.youtube.com/watch?v=WFOi4D38i5w) | 접영 200M 페이스 분배와 체력 유지 전략을 보기 좋음.       |
| 47 | 접영   | [제20회 꿈나무 전국수영대회] 여자 중등부 접영 200M 결승    | [https://www.youtube.com/watch?v=OPCFRhVZpGI](https://www.youtube.com/watch?v=OPCFRhVZpGI) | 접영 장거리형 경기 운영과 후반 리듬 유지 참고용.           |
| 48 | 개인혼영 | [제20회 꿈나무 전국수영대회] 남자 초등부 개인혼영 200M 결승  | [https://www.youtube.com/watch?v=xdrsdJxb7Ks](https://www.youtube.com/watch?v=xdrsdJxb7Ks) | 4영법 전환과 턴 연결을 한 번에 볼 수 있어 IM 선수에게 좋음.  |
| 49 | 개인혼영 | [제20회 꿈나무 전국수영대회] 여자 초등부 개인혼영 200M 결승  | [https://www.youtube.com/watch?v=Lgmf6b3dgiU](https://www.youtube.com/watch?v=Lgmf6b3dgiU) | 여자 초등부 개인혼영의 영법별 페이스 차이를 보기 좋음.        |
| 50 | 혼계영  | [제20회 꿈나무 전국수영대회] 남자 초/중등부 혼계영 400M 결승 | [https://www.youtube.com/watch?v=XEHWTqyAYpI](https://www.youtube.com/watch?v=XEHWTqyAYpI) | 단체전 혼계영 순서와 인계 분위기, 팀워크를 보기 좋음.        |
`;

const lines = data.split('\n').filter(l => l.trim() !== '' && l.includes('|'));
let sql = "INSERT INTO public.competition_videos (url, title, description, status) VALUES\n";

const values = lines.map(line => {
  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 6) return null;
  const num = parts[1];
  if (isNaN(parseInt(num))) return null; // skip header
  
  const category = parts[2];
  let title = parts[3].replace(/'/g, "''");
  let url = parts[4];
  const match = url.match(/\[(.*?)\]/);
  if (match) {
    url = match[1];
  }
  let desc = parts[5].replace(/'/g, "''");

  // In case the title doesn't contain the category, we can optionally prepend it, but it seems to be fine.
  // Actually, I'll include category in description just to be safe if it's not present.
  desc = `[${category}] ${desc}`;

  return `('${url}', '${title}', '${desc}', 'approved')`;
}).filter(Boolean);

sql += values.join(',\n') + ';';

fs.writeFileSync('scratch/insert_comp_videos.sql', sql);
