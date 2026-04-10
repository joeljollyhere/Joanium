import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

let _country = null;
async function fetchCountry() {
  if (_country) return _country;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 250);
  try {
    const res = await fetch('https://ipapi.co/country_name/', { signal: ctrl.signal });
    if (res.ok) {
      _country = (await res.text()).trim();
      return _country;
    }
  } catch {
  } finally {
    clearTimeout(timer);
  }
  return null;
}

function getCurrentDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function normalizeSection(section) {
  if (!section) return null;
  if (typeof section === 'string') {
    return { title: 'Additional Context', body: section };
  }
  if (typeof section === 'object' && section.title && section.body) {
    return { title: section.title, body: section.body };
  }
  return null;
}

function normalizeForComparison(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeEntries(entries = []) {
  const seen = new Set();
  const deduped = [];

  for (const entry of entries) {
    const text = String(entry ?? '').trim();
    if (!text) continue;
    const normalized = normalizeForComparison(text);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    deduped.push(text);
  }

  return deduped;
}

function pushExtraSections(lines, sections = []) {
  for (const rawSection of sections) {
    const section = normalizeSection(rawSection);
    if (!section) continue;
    lines.push('');
    lines.push(`## ${section.title}`);
    lines.push(section.body.trim());
  }
}

let systemPromptConfig = {};
try {
  const spPath = path.join(PROJECT_ROOT, 'SystemInstructions', 'SystemPrompt.json');
  if (fs.existsSync(spPath)) {
    systemPromptConfig = JSON.parse(fs.readFileSync(spPath, 'utf-8'));
  }
} catch (e) {}

const getConfig = (key, fallback = null) => systemPromptConfig[key] || fallback;

export async function buildSystemPrompt({
  userName = '',
  customInstructions = '',
  gmailEmail = null,
  activePersona = null,
  connectedServices = [],
  extraContextSections = [],
} = {}) {
  const now = new Date();
  const timeStr = now.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const platform = process.platform;
  const osName = platform === 'darwin' ? 'macOS' : platform === 'win32' ? 'Windows' : 'Linux';
  const release = os.release();
  const totalMemGB = (os.totalmem() / 1_073_741_824).toFixed(1);
  const cpus = os.cpus();
  const cpuModel = (cpus[0]?.model ?? 'Unknown CPU').replace(/\s+/g, ' ').trim();
  const cpuCores = cpus.length;
  const country = await fetchCountry();

  const lines = [];
  const push = (...args) => lines.push(...args);
  const blank = () => lines.push('');

  if (activePersona) {
    const personaInstructions = activePersona.instructions?.trim() ?? '';
    const normalizedInstructions = normalizeForComparison(personaInstructions);
    const personaIntro = `You are ${activePersona.name}.`;

    if (!normalizedInstructions.includes(normalizeForComparison(personaIntro))) {
      push(personaIntro);
    }
    if (activePersona.personality) push(`Your personality: ${activePersona.personality}.`);
    if (!personaInstructions && activePersona.description) push(activePersona.description);
    if (personaInstructions) {
      blank();
      push(personaInstructions);
    }
    blank();
    push('---');
    blank();
    if (getConfig('joaniumContext')) push(getConfig('joaniumContext'));
  } else {
    push(getConfig('joaniumPersona'));
  }

  blank();
  push('# User');
  push(`- Name: ${userName || 'User'}`);
  push(`- Local time: ${timeStr}`);
  push(`- Date: ${getCurrentDate()}`);
  if (country) push(`- Country: ${country}`);
  push(`- OS: ${osName} ${release}`);
  push(`- Hardware: ${cpuCores}-core CPU (${cpuModel}), ${totalMemGB} GB RAM`);

  const mergedConnectedServices = [...connectedServices];
  if (
    gmailEmail &&
    !mergedConnectedServices.some(
      (item) => item.includes('Google Workspace') || item.includes('Gmail'),
    )
  ) {
    mergedConnectedServices.push(`Gmail (${gmailEmail})`);
  }
  if (mergedConnectedServices.length) {
    push(`- Connected services: ${[...new Set(mergedConnectedServices)].join(', ')}`);
  }

  pushExtraSections(lines, extraContextSections);

  if (customInstructions?.trim()) {
    blank();
    push('# Custom Instructions');
    push(customInstructions.trim());
  }

  blank();

  const finalInst = dedupeEntries(getConfig('finalInstructions', []));
  finalInst.forEach((instruction) => push(instruction));

  return lines.join('\n');
}
