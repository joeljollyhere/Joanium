// ─────────────────────────────────────────────
//  openworld — Packages/Electron/Preload.js
//  contextBridge between main process ↔ renderer
// ─────────────────────────────────────────────

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {

  /* ── Setup ── */
  saveUser: (userData) => ipcRenderer.invoke('save-user', userData),
  saveAPIKeys: (keysMap) => ipcRenderer.invoke('save-api-keys', keysMap),
  saveUserProfile: (profile) => ipcRenderer.invoke('save-user-profile', profile),
  launchMain: () => ipcRenderer.invoke('launch-main'),

  /* ── Runtime reads ── */
  getUser: () => ipcRenderer.invoke('get-user'),
  getModels: () => ipcRenderer.invoke('get-models'),
  getAPIKey: (providerId) => ipcRenderer.invoke('get-api-key', providerId),
  getCustomInstructions: () => ipcRenderer.invoke('get-custom-instructions'),
  saveCustomInstructions: (content) => ipcRenderer.invoke('save-custom-instructions', content),

  /* ── Chat storage ── */
  saveChat: (chatData) => ipcRenderer.invoke('save-chat', chatData),
  getChats: () => ipcRenderer.invoke('get-chats'),
  loadChat: (chatId) => ipcRenderer.invoke('load-chat', chatId),
  deleteChat: (chatId) => ipcRenderer.invoke('delete-chat', chatId),

  /* ── Frameless window controls ── */
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

});
