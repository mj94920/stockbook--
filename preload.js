const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadState:   ()          => ipcRenderer.invoke('load-state'),
  saveState:   (data)      => ipcRenderer.invoke('save-state', data),
  showConfirm: (message)   => ipcRenderer.invoke('show-confirm', message),
  // main 프로세스가 did-finish-load 후 파일 데이터를 직접 push하는 채널
  onPushState: (callback)  => ipcRenderer.once('push-state', (_event, data) => callback(data))
});
