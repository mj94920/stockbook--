const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path  = require('path');
const fs    = require('fs');
const https = require('https');

let win;

// ── 데이터 파일 경로: %APPDATA%\StockBook\stockbook-data.json ──────────────
function getDataFile() {
  return path.join(app.getPath('userData'), 'stockbook-data.json');
}

// ── 내부 HTTPS 헬퍼 (CORS 제한 없음) ────────────────────────────────────────
function httpsGet(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept':     'application/json, text/plain, */*',
      }
    }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end',  () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(body);
        else reject(new Error(`HTTP ${res.statusCode}`));
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── IPC: 시세 조회 (main 프로세스에서 직접 요청 → CORS 없음) ────────────────
ipcMain.handle('fetch-quote', async (_event, rawTicker) => {
  if (!rawTicker) return null;
  rawTicker = rawTicker.trim();
  const isKrNum = /^\d{6}$/.test(rawTicker);

  const parseYF = (body, symbol) => {
    try {
      const d    = JSON.parse(body);
      const meta = d?.chart?.result?.[0]?.meta;
      if (!meta?.regularMarketPrice) return null;
      return {
        symbol,
        price:     meta.regularMarketPrice,
        prevClose: meta.previousClose ?? meta.chartPreviousClose ?? null,
        openPrice: meta.regularMarketOpen ?? null,
        currency:  meta.currency ?? 'USD',
      };
    } catch (_) { return null; }
  };

  if (isKrNum) {
    // 1) 네이버 금융 (국내 전용, 가장 정확)
    try {
      const body = await httpsGet(`https://m.stock.naver.com/api/stock/${rawTicker}/basic`);
      const d    = JSON.parse(body);
      const price  = parseFloat((d.closePrice                 || '0').replace(/,/g, ''));
      const change = parseFloat((d.compareToPreviousClosePrice || '0').replace(/,/g, ''));
      const openP  = parseFloat((d.openPrice                  || '0').replace(/,/g, ''));
      if (price) return {
        symbol:    rawTicker,
        price,
        prevClose: Math.round((price - change) * 100) / 100,
        openPrice: openP || null,
        currency:  'KRW',
      };
    } catch (_) { /* 네이버 실패 시 야후 폴백 */ }

    // 2) 야후 파이낸스 .KS / .KQ
    for (const suffix of ['.KS', '.KQ']) {
      const sym = rawTicker + suffix;
      try {
        const body = await httpsGet(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d&includePrePost=false`
        );
        const result = parseYF(body, sym);
        if (result) return { ...result, currency: result.currency || 'KRW' };
      } catch (_) {}
    }
    return null;
  }

  // 해외 종목
  const sym = rawTicker.toUpperCase();
  try {
    const body = await httpsGet(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d&includePrePost=false`
    );
    return parseYF(body, sym);
  } catch (_) {}
  try {
    const body = await httpsGet(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d&includePrePost=false`
    );
    return parseYF(body, sym);
  } catch (_) {}
  return null;
});

// ── IPC 핸들러 ──────────────────────────────────────────────────────────────
ipcMain.handle('load-state', async () => {
  try {
    const f = getDataFile();
    if (fs.existsSync(f)) return fs.readFileSync(f, 'utf-8');
  } catch (e) {}
  return null;
});

ipcMain.handle('save-state', async (_event, data) => {
  try {
    const f = getDataFile();
    const tmp = f + '.tmp';
    // 임시 파일에 먼저 쓰고 원자적으로 교체 (저장 중 크래시 시 데이터 보호)
    fs.writeFileSync(tmp, data, 'utf-8');
    fs.renameSync(tmp, f);
    // 하루 1회 .bak 백업 (날짜가 바뀐 경우에만)
    const bak = f + '.bak';
    const today = new Date().toDateString();
    let bakDate = null;
    try { bakDate = fs.statSync(bak).mtime.toDateString(); } catch {}
    if (bakDate !== today) fs.copyFileSync(f, bak);
    return true;
  } catch (e) {
    console.error('[StockBook] save-state 오류:', e);
    return false;
  }
});

ipcMain.handle('show-confirm', async (_event, message) => {
  const result = await dialog.showMessageBox(win, {
    type:      'question',
    buttons:   ['취소', '확인'],
    defaultId: 1,
    cancelId:  0,
    message:   message
  });
  return result.response === 1;
});

// ── 창 생성 ──────────────────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    width:     1440,
    height:    920,
    minWidth:  900,
    minHeight: 600,
    title: 'Stock Book — 주식 포트폴리오',
    icon: path.join(__dirname, 'icon-512.png'),
    backgroundColor: '#0d1421', // 로딩 중 흰 화면 번쩍임 방지
    show: false,                // 완전히 렌더링된 후 표시
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, '주식포트폴리오관리.html'));
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => win.show()); // 렌더링 완료 후 창 표시

  // ── 외부 URL은 모두 시스템 기본 브라우저로 열기 ──────────────────────────
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // ── 페이지 완전 로드 후 파일에서 직접 push (가장 확실한 로드 방법) ──────
  win.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      const f = getDataFile();
      console.log('[StockBook] push-state 시도:', f);
      if (fs.existsSync(f)) {
        try {
          const data = fs.readFileSync(f, 'utf-8');
          win.webContents.send('push-state', data);
          console.log('[StockBook] push-state 전송 완료:', data.length, 'bytes');
        } catch (e) {
          console.error('[StockBook] push-state 오류:', e);
        }
      } else {
        console.log('[StockBook] 데이터 파일 없음 — push 스킵');
      }
    }, 300);
  });
}

app.whenReady().then(() => {
  console.log('[StockBook] userData 경로:', app.getPath('userData'));
  console.log('[StockBook] 데이터 파일:', getDataFile());
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
