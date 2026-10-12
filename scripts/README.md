# scripts

앱 빌드·배포와는 관계없는 **일회성 Node 스크립트** 모음입니다. 기록 보존용으로 남겨 두었습니다.

| 폴더 | 내용 |
|---|---|
| `content/` | `raw_*.txt` 원문을 `src/data/`의 에세이·편지·퀴즈 파일로 바꾸는 스크립트 |
| `data-import/` | 영상 목록 SQL 생성, 전국 랭킹 CSV 업로드, 기사 이미지 업로드 스크립트 |

- 실행 예: `node scripts/content/parse_essays.js`
- `data-import/`의 일부 스크립트는 작성자 PC의 파일 경로와 `.env.local`을 사용합니다. 다시 쓰려면 경로를 먼저 고치세요.
- DB에 데이터를 넣는 스크립트는 **운영 DB를 직접 바꿉니다.** 실행 전에 꼭 확인하세요.
