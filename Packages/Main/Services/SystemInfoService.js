import os from 'os';
import { execSync } from 'child_process';
import { persistJson, loadJson } from '../Core/FileSystem.js';
import Paths from '../Core/Paths.js';

function shell(cmd) {
  try {
    const result = execSync(cmd, { timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] });
    return result ? result.toString().trim() : null;
  } catch {
    return null;
  }
}

export async function collectStaticSystemInfo() {
  const platform = process.platform;
  const osName = platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux';
  const arch = os.arch();
  const hostname = os.hostname();
  const homeDir = os.homedir();
  const tmpDir = os.tmpdir();
  const totalMem = os.totalmem();
  const cpus = os.cpus();
  const cpuModel = (cpus[0]?.model ?? 'Unknown CPU').replace(/\s+/g, ' ').trim();
  const cpuCores = cpus.length;
  const cpuSpeed = cpus[0]?.speed ? `${cpus[0].speed} MHz` : null;
  const userInfo = (() => {
    try {
      return os.userInfo();
    } catch {
      return {};
    }
  })();
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  let osVersion = null;
  if (platform === 'darwin') {
    osVersion = shell('sw_vers -productVersion');
    const buildVersion = shell('sw_vers -buildVersion');
    if (osVersion && buildVersion) osVersion = `${osVersion} (Build ${buildVersion})`;
  } else if (platform === 'linux') {
    osVersion =
      shell('lsb_release -ds') ||
      shell('cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"');
  } else if (platform === 'win32') {
    osVersion = shell('wmic os get Caption /value')
      ?.match(/Caption=(.+)/)?.[1]
      ?.trim();
  }

  let kernel = null;
  if (platform === 'win32') {
    kernel = os.release();
  } else {
    kernel = shell('uname -r') || os.release();
  }

  // Simplified shell detection - use COMSPEC on Windows, SHELL on Unix
  const shell_ = platform === 'win32' ? process.env.COMSPEC : process.env.SHELL;

  // GPU info as array of strings
  let gpuInfo = [];
  if (platform === 'darwin') {
    const raw = shell('system_profiler SPDisplaysDataType 2>/dev/null');
    if (raw) {
      const lines = raw.split('\n');
      let currentChipset = null;
      for (const line of lines) {
        if (line.includes('Chipset Model:')) {
          currentChipset = line.split(':')[1]?.trim();
          if (currentChipset) {
            gpuInfo.push(currentChipset);
          }
        }
      }
    }
  } else if (platform === 'linux') {
    // Try lspci
    const lspciRaw = shell('lspci 2>/dev/null');
    if (lspciRaw) {
      const lines = lspciRaw.split('\n');
      for (const line of lines) {
        if (
          line.toLowerCase().includes('vga') ||
          line.toLowerCase().includes('3d') ||
          line.toLowerCase().includes('display')
        ) {
          const parts = line.split(':');
          if (parts.length >= 3) {
            gpuInfo.push(parts[2].trim());
          }
        }
      }
    }
    // If lspci didn't work, try glxinfo
    if (gpuInfo.length === 0) {
      const glxinfoRaw = shell('glxinfo 2>/dev/null');
      if (glxinfoRaw) {
        const lines = glxinfoRaw.split('\n');
        for (const line of lines) {
          if (line.includes('OpenGL renderer')) {
            const renderer = line.split(':')[1]?.trim();
            if (renderer) {
              gpuInfo.push(renderer);
            }
          }
        }
      }
    }
  } else if (platform === 'win32') {
    // Use wmic to get all video controllers
    const raw = shell('wmic path win32_VideoController get Caption /format:csv 2>/dev/null');
    if (raw) {
      const lines = raw.split('\n').filter((line) => line.trim() && !line.startsWith('Node'));
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 2) {
          const caption = parts[1].trim();
          if (caption && caption !== 'Caption') {
            gpuInfo.push(caption);
          }
        }
      }
    }
  }

  let screenRes = null;
  if (platform === 'darwin') {
    const raw = shell('system_profiler SPDisplaysDataType 2>/dev/null | grep Resolution | head -1');
    screenRes = raw?.replace('Resolution:', '').trim() || null;
  }
  // Removed fragile Linux/xdpyinfo dependency - screen resolution often unavailable in container/headless environments

  return {
    osName,
    osVersion,
    arch,
    kernel,
    hostname,
    homeDir,
    tmpDir,
    totalMem,
    cpuModel,
    cpuCores,
    cpuSpeed,
    shell: shell_,
    username: userInfo.username,
    locale,
    timezone,
    gpuInfo,
    screenRes,
    collectedAt: new Date().toISOString(),
  };
}

export function readStaticSystemInfo() {
  return loadJson(Paths.SYSTEM_FILE, null);
}

const STATIC_INFO_REQUIRED_FIELDS = ['osName', 'arch', 'kernel', 'gpuInfo', 'osVersion'];

export async function ensureStaticSystemInfo() {
  let info = readStaticSystemInfo();
  if (!info || STATIC_INFO_REQUIRED_FIELDS.some((f) => !(f in info))) {
    info = await collectStaticSystemInfo();
    persistStaticSystemInfo(info);
  }
  return info;
}

export function persistStaticSystemInfo(info) {
  persistJson(Paths.SYSTEM_FILE, info);
}
