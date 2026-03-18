import os from 'os';

/* ── Country lookup (cached for the session) ── */
let _country = null;
async function fetchCountry() {
  if (_country) return _country;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch('https://ipapi.co/country_name/', { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      _country = (await res.text()).trim();
      return _country;
    }
  } catch { /* ignore – country is optional */ }
  return null;
}

/* ══════════════════════════════════════════
   PUBLIC
══════════════════════════════════════════ */

/**
 * Build a comprehensive system prompt.
 *
 * @param {object} opts
 * @param {string}   opts.userName
 * @param {string}   opts.customInstructions   – contents of CustomInstructions.md
 * @param {string}   opts.memory               – contents of Memory.md
 * @param {string}   [opts.githubUsername]
 * @param {object[]} [opts.githubRepos]         – array of GitHub repo objects
 * @param {string}   [opts.gmailEmail]
 * @returns {Promise<string>}
 */
export async function buildSystemPrompt({
  userName           = '',
  customInstructions = '',
  memory             = '',
  githubUsername     = null,
  githubRepos        = [],
  gmailEmail         = null,
} = {}) {

  /* ── Time ── */
  const now     = new Date();
  const timeStr = now.toLocaleString('en-US', {
    weekday:    'long',
    year:       'numeric',
    month:      'long',
    day:        'numeric',
    hour:       '2-digit',
    minute:     '2-digit',
    timeZoneName: 'short',
  });

  /* ── OS & hardware ── */
  const platform   = process.platform;
  const osName     = platform === 'darwin' ? 'macOS'
                   : platform === 'win32'  ? 'Windows'
                   :                         'Linux';
  const release    = os.release();
  const totalMemGB = (os.totalmem() / 1_073_741_824).toFixed(1);
  const cpus       = os.cpus();
  const cpuModel   = (cpus[0]?.model ?? 'Unknown CPU').replace(/\s+/g, ' ').trim();
  const cpuCores   = cpus.length;

  /* ── Country ── */
  const country = await fetchCountry();

  /* ── Build prompt ── */
  const L = []; // lines
  const push  = (...args) => L.push(...args);
  const blank = () => L.push('');

  push(`You are an intelligent AI assistant running inside openworld — a personal desktop AI platform built by Joel Jolly.`);
  blank();
  push(`## User`);
  push(`- **Name:** ${userName || 'User'}`);
  push(`- **Local time:** ${timeStr}`);
  if (country) push(`- **Country:** ${country}`);
  push(`- **OS:** ${osName} ${release}`);
  push(`- **Hardware:** ${cpuCores}-core CPU (${cpuModel}), ${totalMemGB} GB RAM`);

  /* ── Connected services ── */
  const connected = [];
  if (gmailEmail)     connected.push(`Gmail (${gmailEmail})`);
  if (githubUsername) connected.push(`GitHub (@${githubUsername})`);
  if (connected.length) push(`- **Connected services:** ${connected.join(', ')}`);

  /* ── GitHub repos ── */
  if (githubUsername && githubRepos.length) {
    blank();
    push(`## GitHub Repositories (@${githubUsername})`);
    push(`The user has these repos (most recently updated first):`);
    githubRepos.slice(0, 20).forEach(r => {
      const desc = r.description ? ` — ${r.description}` : '';
      const lang = r.language    ? ` [${r.language}]`     : '';
      push(`- \`${r.full_name}\`${desc}${lang}`);
    });
    push(`When the user asks about "my repo" or references a project by name, match it against the list above.`);
  }

  /* ── Memory ── */
  if (memory?.trim()) {
    blank();
    push(`## Memory (persistent notes about the user)`);
    push(memory.trim());
  }

  /* ── Custom instructions ── */
  if (customInstructions?.trim()) {
    blank();
    push(`## Custom Instructions`);
    push(customInstructions.trim());
  }

  blank();
  push(`Answer helpfully, concisely, and accurately. When the user references their repos, emails, system, or preferences, use the context above.`);

  return L.join('\n');
}
