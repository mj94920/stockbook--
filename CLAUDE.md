# StockBook PWA — 프로젝트 메모

## 최근 작업 내역

### 2026-07-01
- Yahoo Finance API를 이용한 시세 자동 조회 기능 구현 (Cloudflare Worker 없이 브라우저 직접 호출)
  - `fetchYFQuote(ticker)`: 단일 종목 조회. 한국 6자리 코드는 `.KS`→`.KQ` 순 자동 시도
  - `fetchAllPrices()`: 티커 등록 종목 전체 일괄 조회
  - `fetchSinglePrice()`: 개별 현재가 모달에서 해당 종목만 조회
  - 조회 시 `currentPrice` 외 `prevClose`(전일종가), `openPrice`(당일 시가)도 저장
- 포트폴리오 툴바에 "🔄 시세 새로고침" 버튼 추가
- 현재가 일괄 업데이트 모달 상단에 "🔄 자동 조회" 버튼 추가
- 개별 현재가 모달에 "🔄 자동 조회" 버튼 + 전일종가·시가·전일비 표시 추가
- 포트폴리오 테이블 현재가 셀 하단에 전일 대비 등락률(`±X.XX%`) 표시 추가
- 티커가 없는 종목은 기존 수동 입력 방식 유지 (자동 조회 버튼 숨김 처리)
- 매수 등록 폼에 현재가 자동 조회 연동
  - `fetchCurrentForForm()`: 종목명 선택 시 티커가 있으면 자동 조회 후 `f_current` 자동 입력
  - `_onFormNameChange()`: `f_name` 변경 이벤트 통합 핸들러 — 섹터/포지션 자동완성 + 시세 조회 트리거
  - `f_current` 옆에 "🔄 조회" 버튼 추가 (수동 재조회용, 티커 없는 종목은 숨김)
  - 라벨 옆 상태 텍스트(`f_current_status`)로 조회 중/완료/실패 표시
  - 폼 초기화 시 버튼·상태 텍스트도 함께 리셋
- 데스크톱 exe 재빌드 미실시 — 변경 반영하려면 `npm run build` 필요

### 2026-06-30 (세션 4)
- 코드 변경 없음 — `codebase-analyzer` 스킬 존재 여부 확인
  - 해당 스킬은 설치되어 있지 않음
  - 대안으로 `/code-review`, `/security-review`, `/init`, `/review`, `/simplify` 안내

### 2026-06-30 (세션 3)
- 코드 변경 없음 — 설치된 스킬 목록 확인 및 `/generate-project-idea` 스킬 동작 확인
  - 스킬 파일 정상 존재 확인: `C:\Users\mj949\.claude\commands\generate-project-idea.md`

### 2026-06-30 (세션 2)
- `/generate-project-idea` 커스텀 Claude Code 스킬 생성
  - 위치: `C:\Users\mj949\.claude\commands\generate-project-idea.md`
  - 기능: 도메인/주제를 받아 개발 프로젝트 아이디어 5개 생성 → 선택 시 상세 기획서(화면구성·데이터모델·로드맵) 제공
  - 인자 없이 호출하면 컨텍스트 질문, 주제 입력 시 바로 아이디어 생성

### 2026-06-30
- 버그 점검 및 수정 (4개)
  1. `fmtCommaInput` 미정의 → `formatWithComma`로 수정 (투자일지 추가매수 단가 입력 시 ReferenceError)
  2. `saveBulkEdit()` 목표가·손절가 필드명 오류: `targetPrice`/`stopLoss` → `target1`/`stop1` 통일 (전체 편집에서 저장해도 포트폴리오 테이블에 반영 안 되던 문제)
  3. 월복리 시뮬레이터 표 열 불일치: 헤더 5열(월·잔액·월수익·누적수익률·달성✓) vs 바디 4열 → 월 수익(`monthProfit = balance * r`) 계산 추가 및 5열 출력으로 수정
  4. `renderPortfolioBar()` 내 `portfolioBarSegs.innerHTML` 이중 할당 제거 (첫 번째 불필요한 할당 삭제)
- 데스크톱 exe 재빌드 미실시 — 위 변경 반영하려면 `npm run build` 필요

### 2026-06-29
- 모바일 물타기 탭 복구: 서브탭 CSS에 `flex-wrap:nowrap` + `-webkit-overflow-scrolling:touch` 추가
  - 원인: 기본 `.sub-tabs`의 `flex-wrap:wrap`이 모바일에서 재정의되지 않아 7개 탭이 두 줄로 넘어가 고정 높이(44px)에 가려짐
- 거래기록 탭에서 수동 "빠른 등록" 폼 제거
  - 사유: 매수/매도 등록 시 자동 기록되는 방식이므로 별도 수동 입력 불필요
  - 관련 JS 함수(`addTrade`, `clearTradeForm`), `t_name` 이벤트 리스너, `t_date` 초기화 코드 함께 삭제
  - `<datalist id="tStockList">` 는 `updateDatalist()` 호출이 남아있어 hidden 상태로 유지
- GitHub push 완료 (commit: 912a781)
- v1.2.1 데스크톱 exe 재빌드: `npm run build` → `C:\Temp\StockBookBuild\StockBook 1.2.1.exe`
  - package.json 버전 1.2.0 → 1.2.1 업데이트
  - StockBook-PWA\ 폴더에 1.2.1.exe 배치, 구버전 1.2.0.exe 삭제

### 2026-06-26
- 정기 자동저장 크론 설정 확인 및 등록 (30분 간격, `3,33 * * * *`)
- 크론은 세션 내에서만 유지되며 세션 종료 시 소멸되는 한계 확인
- 세션 간 기억 보존 구조 확립: 크론(세션 중 30분 저장) + CLAUDE.md(세션 종료 시 저장) + 다음 세션 시작 시 CLAUDE.md 읽어 복원
- `deleteStock()` 버그 수정: 종목 삭제 시 `state.trades`, `state.journals`에서도 해당 종목 기록 함께 삭제 (기존엔 portfolio에서만 제거)
- `confirmSell()` 개선: 매도 시 기존 buy 투자일지 자동 업데이트(매도일·투자기간·수익률 기록), 일지 없으면 sell 타입 초안 자동 생성
- 서브탭에 "💰 예수금" 탭 신규 추가: 입금/출금 폼 + 내역 테이블 상시 표시, 잔액 자동 계산 (입금−출금−현금매수+현금매도)
- 고아 데이터 정리 기능 추가: 구버전 deleteStock 버그로 JSON 파일에 남은 고아 거래기록/투자일지를 `cleanOrphanedData()`로 일괄 삭제
  - 거래기록 탭 상단에 🧹 "고아 데이터 정리" 버튼 추가 (포트폴리오에 없는 종목 기록이 있을 때만 빨간색으로 표시)
  - 1.2.0 exe 재빌드 완료
- StockBook 1.2.0.exe를 `StockBook-PWA` 폴더로 교체 (구버전 1.1.4.exe 삭제)
- .gitignore에 `node_modules/`, `*.exe`, `*.zip` 추가
- v1.2.0 전체 변경사항 GitHub push 완료 (`github.com/mj94920/stockbook--`)
  - 모바일 TWA 앱은 APK 재빌드 없이 GitHub Pages HTML 업데이트만으로 갱신됨 (network-first SW 전략)

## 미결 사항
- 시세 자동 조회: Yahoo Finance 직접 호출 방식으로 1차 구현 완료
  - CORS 허용 여부가 Yahoo Finance 정책에 따라 달라질 수 있음 → 실제 브라우저 환경에서 테스트 필요
  - 조회 실패 시 Cloudflare Worker 프록시 방식으로 전환 고려
  - 한국 종목 `.KS`/`.KQ` 구분이 자동으로 되는지 실종목으로 검증 필요
- 데스크톱 exe 빌드: 2026-07-01 변경분(시세 자동 조회) 아직 미빌드


## 참고
- HTML은 ASAR로 패키징되어 있어 소스 수정만으로는 반영 안 됨 — 수정 후 반드시 `npm run build` 필요
- 데스크톱 빌드: `npm run build` → `C:\Temp\StockBookBuild\StockBook x.x.x.exe` → `StockBook-PWA\` 폴더로 복사
- 모바일 업데이트: HTML 수정 후 `git push origin main` 만으로 GitHub Pages 갱신 (APK 재빌드 불필요)
- 현재 버전: 1.2.1
