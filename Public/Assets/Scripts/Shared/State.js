export const state = {
  // Chat
  messages:            [],   // { role, content, attachments[] }
  composerAttachments: [],   // { id, type, mimeType, name, dataUrl }
  isTyping:            false,
  currentChatId:       null,

  // Models
  allProviders:    [],   // every provider regardless of whether a key is set
  providers:       [],   // providers that have a valid API key
  selectedProvider: null,
  selectedModel:   null,

  // User
  userName:     '',
  userInitials: 'OW',

  // System
  systemPrompt: '', // built by main process; refreshed after settings save

  // UI
  theme: localStorage.getItem('ow-theme') || 'dark',
};
