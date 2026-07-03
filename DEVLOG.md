# StockBook — 개발 작업 로그

**최종 업데이트**: 2026-07-03  
**현재 버전**: 1.3.1  
**GitHub**: https://github.com/mj94920/stockbook--  
**배포 URL**: https://mj94920.github.io/stockbook--/주식포트폴리오관리.html

---

## 프로젝트 구조

```
StockBook-PWA/
├── 주식포트폴리오관리.html   ← 앱 전체 (단일 파일, 웹/PC 공통)
├── main.js                  ← Electron 메인 프로세스
├── preload.js               ← IPC 브릿지 (window.electronAPI)
├── package.json             ← 버전 및 electron-builder 빌드 설정
├── manifest.json            ← PWA 매니페스트 (start_url, theme_color)
├── sw.js                    ← 서비스워커 v3 (HTML: network-first)
├── index.html               ← PWA 진입점 → 주식포트폴리오관리.html 리디렉트
├── icon-192.png / icon-512.png
├── logo.svg
├── PRD.md                   ← 제품 요구사항 문서
└── DEVLOG.md                ← 이 파일
```

### 빌드/배포 흐름

| 대상 | 명령 | 결과 |
|---|---|---|
| 데스크톱 exe | `npm run build` | `C:\Temp\StockBookBuild\StockBook X.X.X.exe` |
| 모바일 PWA | `git push origin main` | GitHub Pages 자동 갱신 |

---

## 버전별 작업 이력

---

### 초기 배포 (2026 초)

**커밋**: `0b033dc` init: StockBook PWA 초기 배포

- StockBook PWA 최초 배포
- GitHub Pages 서빙 시작

---

### GitHub Pages 진입점 정비

**커밋**: `37a1ce6` → `970bc3c`

- `index.html` 추가 (GitHub Pages 기본 진입점)
- `index.html`을 앱 본체로 교체, 한글 파일명(`주식포트폴리오관리.html`) 의존성 제거 시도

---

### v1.1.2

**커밋**: `58a0da6`

- 추가매수 다중 기록 기능 추가
- Google Play 패키지(aab/apk) 빌드 추가 (`StockBook - Google Play package/` 폴더)

---

### UI 리디자인 (모바일 앱 스타일)

**커밋**: `7dcd332`

- 헤더 전면 개편: pill형 버튼, 흰색 배경
- 하단 탭 바 네비게이션 도입
- `theme-color` 파란색 → 흰색으로 변경

---

### 서비스워커 캐시 문제 해결

**커밋**: `b1c5af1` → `3d21d46` → `d08fda5`

- **문제**: 구 SW가 구버전 HTML을 계속 캐시에서 제공 → 새 디자인 반영 안 됨
- **수정 1**: `sw.js` 캐시 버전 v2로 업데이트
- **수정 2**: HTML 네비게이션 요청에 network-first 전략 적용
- **수정 3**: 앱 로드 시 SW 강제 unregister + 캐시 전체 삭제 코드 삽입

---

### manifest.json + index.html 근본 원인 수정

**커밋**: `a9a64e2`

- **근본 원인 발견**: `manifest.json`의 `start_url`이 `./index.html`로 되어 있어, 모바일 PWA가 항상 구버전 앱을 열었음
- **수정**:
  - `manifest.json` `start_url` → `./주식포트폴리오관리.html`
  - `manifest.json` `theme_color` → `#ffffff`
  - `index.html` → 리디렉트 파일로 교체 (3280줄 구버전 앱이었음)

---

### 거래기록 폼 레이아웃

**커밋**: `8a7d532`

- 매수등록(f_), 투자일지(j_), 거래기록(t_) 폼의 목표가/손절가 섹션
- 기존: 2열 그리드(`form-grid`) → 수정: 1열 4행(`flex-direction:column`)
- 이유: 모바일에서 가격 숫자가 잘려서 보이지 않는 문제

---

### 레이아웃·네비게이션 정비

**커밋**: `1f1ab76` → `f271b10` → `d04fc55` → `1ffe9d0`

- 잔고 탭 추가, 네이버금융 URL 수정, 뉴스 링크 업데이트
- 물타기 레이아웃 전체 화면 적용
- 레이아웃 원상복구: 가로모드 2열 유지, 세로모드만 1열 전환
- 뉴스탭 보유종목 링크 버튼 소형화 (520px 패널 최적화)

---

### v1.2.0 (2026-06-26)

**커밋**: `be4f411` → `eadb6b7` → `989bef4`

#### 버그 수정 3건

**1. 종목 삭제 시 고아 데이터 문제**
- 기존: `deleteStock()` 실행 시 포트폴리오만 삭제, 거래기록·투자일지는 잔존
- 수정: `state.trades`, `state.journals`도 함께 필터링 삭제
- 추가: `cleanOrphanedData()` 함수로 구버전 누적 고아 기록 일괄 정리
- 거래기록 탭 상단에 🧹 버튼 추가 (고아 기록 있을 때만 빨간색 표시)

**2. 매도 시 투자일지 자동 연동**
- 기존: 매수 시에만 일지 초안 생성, 매도 모달로 매도해도 일지 미생성
- 수정: `confirmSell()` 실행 시 ① 기존 buy 일지 → 매도일·투자기간·수익률 자동 기입, ② 일지 없으면 sell 타입 초안 자동 생성

**3. 예수금 탭 신설**
- 기존: 예수금 변동 기록이 모달 깊숙이 있어 접근 불편
- 수정: 서브탭에 💰 예수금 탭 신설 → 입금/출금 폼 + 내역 테이블 상시 표시
- 잔액 자동 계산: 입금 − 출금 − 현금매수 + 현금매도

#### UI 수정

- 중간 화면(769–1100px) 서브탭 헤더 아래 상단 고정 (미디어 쿼리 추가)
- 물타기 계산기 입력 폼 1열 → 2열 그리드
- 잉여 `</div>` 태그 3개 제거 (잔고탭·물타기탭·뉴스탭 패널)
- 모바일(≤768px) 세로 모드 탭: 하단 고정 → 헤더 바로 아래(top: 56px) 상단 고정으로 통일

#### 기타

- 버전 1.1.4 → 1.2.0
- `.gitignore`에 `node_modules/`, `*.exe`, `*.zip` 추가

---

### v1.2.1 (2026-06-29)

**커밋**: `912a781`

- 모바일 물타기 탭 복구 (업데이트 과정에서 소실됨)
- 거래기록 수동 등록 폼 제거 (매수/매도 등록 시 자동 생성으로 일원화)

---

### v1.2.2 (2026-07-01)

**커밋**: `a9d59bb`

- **야후 파이낸스 시세 자동 조회 추가**
  - 해외 종목: Yahoo Finance v8 Chart API 직접 호출
  - 저장: `currentPrice`, `prevClose`, `openPrice`
  - 🔄 시세 새로고침 버튼 (전체 일괄)
  - 매수 폼에서 종목 선택 시 현재가 자동 조회

---

### v1.2.3 (2026-07-01)

**커밋**: `4b010e5`

- **한국 종목 시세 오류 수정**
  - 기존: Yahoo Finance `.KS`/`.KQ` 폴백 방식 → CORS 오류 빈번
  - 수정: 네이버 금융 모바일 API 우선 사용 → 실패 시 Yahoo Finance 폴백

---

### v1.3.0 (2026-07-01)

**커밋**: `8b1f077` → `c2b46b9` → `f119801` → `980cfd7` → `2d07ba5` → `6e282dc`

#### 월복리 시뮬레이터 대폭 개선

**입력값 영구 저장** (`8b1f077`)
- 원금·월수익률·기간·추가납입·시작일 → `state.mcSettings`에 저장
- 앱 재시작 후 자동 복원 및 재계산

**월별 실적 자동 달성 체크** (`c2b46b9`)
- 시작일 입력 시 달력 기준 연월 표시
- 현재 달: 파란 배경 + ◀현재 표시
- 📌 이번 달 실적 기록 버튼: 현재 총자산을 스냅샷으로 저장
- 달성 여부 자동 판정: ✅ (실제 ≥ 목표) / ❌ (미달) / — (미입력)
- 실제수익률: 전월 대비 계산, 초록/노랑/빨강 색상 구분

#### UI/UX 수정

**현재가 셀 sub-text 변경** (`f119801`)
- 기존: 전일 대비 등락
- 수정: 평균단가 대비 손익 (이익: 빨간색, 손실: 파란색)

**실적 입력 모달** (`980cfd7`)
- 기존: `prompt()` 팝업 → 수정: 전용 모달 UI로 교체
- 실제잔액 셀 클릭 → 모달에서 과거 달 금액 수동 입력 (0 입력 시 삭제)

**뉴스탭 정리** (`2d07ba5` → `6e282dc`)
- 보유 종목별 바로가기: 📋DART · 💹네이버 금융 (국내) / 📋DART · Inv. (해외)
- 검색창 위 quick-links 중복 제거, 하단 카드만 유지
- 종목 버튼에서 📰뉴스·KRX KIND 버튼 제거

---

### v1.3.1 (2026-07-03) — 현재

**이번 세션 작업**

#### 프로젝트 구조 통합

- **문제**: `포트폴리오앱`(Electron용)과 `StockBook-PWA`(PWA용) 두 폴더 분리 운영 → 디자인 버전 불일치
- **해결**: Electron 빌드 파일을 PWA 폴더로 통합, 단일 소스 관리

이전한 파일:
- `포트폴리오앱/main.js` → `StockBook-PWA/main.js`
- `포트폴리오앱/preload.js` → `StockBook-PWA/preload.js`
- `포트폴리오앱/package.json` → `StockBook-PWA/package.json`

`포트폴리오앱` 폴더 삭제 (수동, OneDrive 동기화 충돌로 자동 삭제 불가)

---

## 미결 과제

| 항목 | 내용 |
|---|---|
| Yahoo Finance CORS | 정책 변경 시 Cloudflare Worker 프록시 전환 필요 |
| 데이터 저장 경로 | exe 위치 기준으로 변경 가능 (완전 이식성 확보) |
| Google Play 등록 | TWA + Bubblewrap CLI → `.aab` 빌드 → `assetlinks.json` 설정 필요 |
| 복리 시뮬레이터 | 시작 시점 실제 잔액 체크포인트 기능 |
| 백업/복원 | JSON 내보내기·가져오기 기능 |
| 종목 차트 | 네이버 금융 차트 딥링크 또는 iframe 연동 |

---

## Git 커밋 전체 이력

```
6e282dc  fix: 뉴스탭 보유종목 링크 중복 제거
2d07ba5  fix: 뉴스탭 종목 버튼에서 📰뉴스·KRX 제거
980cfd7  fix: 월별 실적 입력을 prompt() → 전용 모달로 교체
f119801  fix: 현재가 셀 sub-text → 평균단가 대비 손익으로 변경
c2b46b9  feat: v1.3.0 — 월복리 시뮬레이터 월별 실적 자동 달성 체크
8b1f077  feat: v1.3.0 — 월복리 시뮬레이터 입력값 영구 저장
4b010e5  fix: v1.2.3 — 한국 주식 시세 조회를 네이버 금융으로 교체
a9d59bb  feat: v1.2.2 — 야후 파이낸스 시세 자동 조회 기능 추가
912a781  fix: 모바일 물타기 탭 복구 + 거래기록 수동 입력 폼 제거
989bef4  feat: v1.2.0 — 예수금 탭, 매도 일지 자동연동, 고아 데이터 정리
eadb6b7  fix: 모바일 세로모드 서브탭 하단→상단 고정으로 변경
be4f411  fix: 중간화면 서브탭 상단고정, 물타기 2열, 잉여 div 제거
1ffe9d0  fix: 뉴스탭 보유종목 링크 버튼 소형화
d04fc55  fix: 레이아웃 원상복구 (가로모드 2열, 세로모드 1열)
f271b10  fix: 물타기 레이아웃 전체 화면 + 네이버금융 URL 수정
1f1ab76  fix: 잔고탭 추가, 네이버금융 URL, 뉴스링크, 레이아웃 수정
8a7d532  fix: 거래기록 폼 목표가/손절가 1열 4행으로 변경
a9a64e2  fix: index.html 리디렉트 교체, manifest start_url 수정
936b728  debug: 버전 태그 v623 (임시, 이후 제거)
d08fda5  fix: 앱 로드 시 SW 강제 unregister + 캐시 전체 삭제
53db063  fix: sw.js 캐시 버전 v3으로 업데이트
3d21d46  fix: sw.js HTML network-first 전략 적용
b1c5af1  fix: sw.js 캐시 버전 v2로 업데이트
7dcd332  UI 리디자인: 모바일 앱 스타일, pill 버튼, theme-color 흰색
58a0da6  v1.1.2: 추가매수 다중 기록 + Google Play 패키지 추가
970bc3c  fix: index.html을 앱 본체로 교체
37a1ce6  fix: index.html 추가 (GitHub Pages 진입점)
0b033dc  init: StockBook PWA 초기 배포
```
