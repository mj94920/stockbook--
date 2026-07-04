const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadState:   ()          => ipcRenderer.invoke('load-state'),
  saveState:   (data)      => ipcRenderer.invoke('save-state', data),
  showConfirm: (message)   => ipcRenderer.invoke('show-confirm', message),
  // 시세 조회 — main 프로세스에서 직접 HTTPS 요청 (CORS 없음)
  fetchQuote:  (ticker)    => ipcRenderer.invoke('fetch-quote', ticker),
  // main 프로세스가 did-finish-load 후 파일 데이터를 직접 push하는 채널
  onPushState: (callback)  => ipcRenderer.once('push-state', (_event, data) => callback(data))
});
