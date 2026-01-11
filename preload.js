const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  getTodos: (sessionFile) => ipcRenderer.invoke('get-todos', sessionFile),
  selectSession: (sessionFile) => ipcRenderer.invoke('select-session', sessionFile),
  getCurrentDir: () => ipcRenderer.invoke('get-current-dir'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  resetToDefault: () => ipcRenderer.invoke('reset-to-default'),
  selectSoundFile: () => ipcRenderer.invoke('select-sound-file'),
  onTodosUpdated: (callback) => {
    ipcRenderer.on('todos-updated', (event, data) => callback(data));
  },
  onSessionsUpdated: (callback) => {
    ipcRenderer.on('sessions-updated', (event, data) => callback(data));
  }
});
