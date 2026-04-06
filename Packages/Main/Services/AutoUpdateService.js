import electronUpdater from 'electron-updater';
import log from 'electron-log';

let enabled = false;
let pendingInstall = false;

export function setupAutoUpdates() {
  // Ensure we only wire this once per app session.
  if (enabled) return;
  enabled = true;

  // Access the autoUpdater getter lazily inside the function so that a bad
  // app version (e.g. during development) throws here and can be caught,
  // rather than crashing the whole app at module-evaluation time.
  let autoUpdater;
  try {
    autoUpdater = electronUpdater.autoUpdater;
  } catch (err) {
    const message = err?.stack ?? err?.message ?? String(err);
    log.warn('[AutoUpdate] Could not initialise autoUpdater (skipping):', message);
    return;
  }

  // Keep update logs in files inside userData so failures are debuggable.
  autoUpdater.logger = log;
  try {
    log.transports.file.level = 'info';
  } catch {
    // log.transports.file may not exist in some environments
  }

  // We'll start downloading explicitly on `update-available`.
  // This avoids relying on `autoDownload` behavior differences across updater versions.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.channel = 'latest';

  autoUpdater.on('update-available', (info) => {
    const nextVersion = info?.version ?? info?.releaseName ?? 'unknown';
    log.info(`[AutoUpdate] Update available (${nextVersion}). Downloading...`);
    autoUpdater.downloadUpdate().catch((err) => {
      const message = err?.stack ?? err?.message ?? String(err);
      log.warn('[AutoUpdate] downloadUpdate failed:', message);
    });
  });

  autoUpdater.on('update-downloaded', () => {
    pendingInstall = true;
    log.info('[AutoUpdate] Update downloaded. Will install on app quit.');
  });

  autoUpdater.on('error', (err) => {
    const message = err?.stack ?? err?.message ?? String(err);
    log.warn('[AutoUpdate] Auto update error:', message);
  });

  // Check immediately on app open; if an update is available we download it automatically.
  try {
    autoUpdater.checkForUpdates().catch((err) => {
      const message = err?.stack ?? err?.message ?? String(err);
      log.warn('[AutoUpdate] checkForUpdates failed:', message);
    });
  } catch (err) {
    const message = err?.stack ?? err?.message ?? String(err);
    log.warn('[AutoUpdate] Failed to start update check:', message);
  }
}
