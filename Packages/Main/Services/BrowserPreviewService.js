import { BrowserView } from 'electron';
import { EventEmitter } from 'events';

export class BrowserPreviewService extends EventEmitter {
  constructor() {
    super();
    this._window = null;
    this._view = null;
    this._viewAttached = false;
    this._hostBounds = null;
    this._visible = false;
    this._title = 'Built-in Browser';
    this._url = '';
    this._status = 'Ready';
    this._loading = false;
  }

  attachToWindow(win) {
    if (this._window === win) return;

    if (this._window && this._viewAttached && this._view) {
      this._window.removeBrowserView(this._view);
      this._viewAttached = false;
    }

    this._window = win ?? null;
    this._attachIfNeeded();
    this._emitState();
  }

  getState() {
    const navigationHistory = this._view?.webContents?.navigationHistory;

    return {
      visible: this._visible,
      hasView: Boolean(this._view),
      hasPage: Boolean(this._url),
      title: this._title,
      url: this._url,
      status: this._status,
      loading: this._loading,
      canGoBack: Boolean(navigationHistory?.canGoBack?.()),
      canGoForward: Boolean(navigationHistory?.canGoForward?.()),
    };
  }

  async ensureWebContents() {
    if (!this._view) {
      this._view = new BrowserView({
        webPreferences: {
          partition: 'persist:evelina-browser-mcp',
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
          backgroundThrottling: false,
        },
      });

      this._wireViewEvents(this._view);
    }

    this.show();
    return this._view.webContents;
  }

  show() {
    this._visible = true;
    this._attachIfNeeded();
    this._emitState();
  }

  hide() {
    this._visible = false;
    this._detachIfNeeded();
    this._emitState();
  }

  setVisible(visible) {
    if (visible) this.show();
    else this.hide();
  }

  setHostBounds(bounds) {
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
      this._hostBounds = null;
      this._detachIfNeeded();
      this._emitState();
      return;
    }

    this._hostBounds = {
      x: Math.max(0, Math.round(bounds.x)),
      y: Math.max(0, Math.round(bounds.y)),
      width: Math.max(1, Math.round(bounds.width)),
      height: Math.max(1, Math.round(bounds.height)),
    };

    this._attachIfNeeded();
    this._updateBounds();
    this._emitState();
  }

  setStatus(status = 'Ready') {
    this._status = String(status ?? 'Ready').trim() || 'Ready';
    this._emitState();
  }

  clearStatus() {
    this.setStatus(this._loading ? 'Loading page...' : 'Ready');
  }

  async close() {
    this.hide();
    if (this._view?.webContents && !this._view.webContents.isDestroyed()) {
      this._view.webContents.close();
    }
    this._view = null;
    this._title = 'Built-in Browser';
    this._url = '';
    this._status = 'Ready';
    this._loading = false;
    this._emitState();
  }

  _wireViewEvents(view) {
    const webContents = view.webContents;

    webContents.setWindowOpenHandler(({ url }) => {
      if (url) {
        this.setStatus(`Opening ${url}`);
        void webContents.loadURL(url).catch(() => { });
      }
      return { action: 'deny' };
    });

    webContents.on('page-title-updated', (event, title) => {
      event.preventDefault();
      this._title = title || 'Built-in Browser';
      this._emitState();
    });

    webContents.on('did-start-loading', () => {
      this._loading = true;
      this._status = 'Loading page...';
      this._emitState();
    });

    webContents.on('did-start-navigation', (_event, url, _isInPlace, isMainFrame) => {
      if (!isMainFrame) return;
      this._url = url || this._url;
      this._status = url ? `Opening ${url}` : 'Loading page...';
      this._emitState();
    });

    webContents.on('did-stop-loading', () => {
      this._loading = false;
      this._url = webContents.getURL() || this._url;
      this._title = webContents.getTitle() || this._title;
      this._status = 'Ready';
      this._emitState();
    });

    webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) return;
      this._loading = false;
      this._url = validatedURL || this._url;
      this._status = `Load failed (${errorCode}): ${errorDescription}`;
      this._emitState();
    });

    const syncLocation = () => {
      this._url = webContents.getURL() || this._url;
      this._title = webContents.getTitle() || this._title;
      this._emitState();
    };

    webContents.on('did-navigate', syncLocation);
    webContents.on('did-navigate-in-page', syncLocation);

    webContents.on('render-process-gone', () => {
      this._status = 'Browser process ended unexpectedly.';
      this._loading = false;
      this._emitState();
    });

    webContents.on('destroyed', () => {
      this._view = null;
      this._viewAttached = false;
      this._loading = false;
      this._emitState();
    });
  }

  _attachIfNeeded() {
    if (!this._window || !this._view || !this._visible || !this._hostBounds) return;
    if (this._viewAttached) {
      this._updateBounds();
      return;
    }

    this._window.addBrowserView(this._view);
    this._viewAttached = true;
    this._updateBounds();
  }

  _detachIfNeeded() {
    if (!this._window || !this._view || !this._viewAttached) return;
    this._window.removeBrowserView(this._view);
    this._viewAttached = false;
  }

  _updateBounds() {
    if (!this._view || !this._viewAttached || !this._hostBounds) return;
    this._view.setBounds(this._hostBounds);
    this._view.setAutoResize({ width: false, height: false, horizontal: false, vertical: false });
  }

  _emitState() {
    const state = this.getState();
    this.emit('state', state);

    if (this._window && !this._window.isDestroyed()) {
      this._window.webContents.send('browser-preview-state', state);
    }
  }
}

let _browserPreviewService = null;

export function getBrowserPreviewService() {
  if (!_browserPreviewService) {
    _browserPreviewService = new BrowserPreviewService();
  }
  return _browserPreviewService;
}
