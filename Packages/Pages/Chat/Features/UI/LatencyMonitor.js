/**
 * LatencyMonitor
 *
 * Watches for the first token from the AI provider.
 * If no token (text or thinking) arrives within SLOW_THRESHOLD_MS, it runs
 * lightweight connectivity checks and pushes informational entries
 * into the agent log so the user understands the delay is not the app's fault.
 */

const SLOW_THRESHOLD_MS = 10_000; // 10 seconds before we warn
const CONNECTIVITY_TIMEOUT_MS = 5_000; // per-check timeout

/**
 * Checks basic internet connectivity by hitting Cloudflare's public DNS.
 * Returns { ok, ms, timedOut? }.
 */
async function checkInternetConnectivity() {
  const t0 = Date.now();
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), CONNECTIVITY_TIMEOUT_MS);
  try {
    await fetch('https://1.1.1.1', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(tid);
    return { ok: true, ms: Date.now() - t0 };
  } catch (err) {
    clearTimeout(tid);
    return { ok: false, ms: Date.now() - t0, timedOut: err.name === 'AbortError' };
  }
}

/**
 * Checks reachability of the AI provider's base domain.
 * Returns { ok, ms } or null if endpoint is empty/invalid.
 */
async function checkProviderReachability(endpoint) {
  if (!endpoint) return null;
  let baseUrl;
  try {
    const u = new URL(endpoint);
    baseUrl = `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
  const t0 = Date.now();
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), CONNECTIVITY_TIMEOUT_MS);
  try {
    await fetch(baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(tid);
    return { ok: true, ms: Date.now() - t0 };
  } catch (err) {
    clearTimeout(tid);
    return { ok: false, ms: Date.now() - t0, timedOut: err.name === 'AbortError' };
  }
}

/**
 * Decides what diagnostic lines to display based on check results.
 * Each line: { text, ok, isSummary? }
 */
function buildDiagnosticLines(internet, provider) {
  const lines = [];

  // ── Internet status ───────────────────────────────────────────────────────
  if (!internet.ok) {
    lines.push({
      text: internet.timedOut
        ? 'Internet: No response — check your network connection'
        : 'Internet: Unreachable',
      ok: false,
    });
  } else if (internet.ms > 2000) {
    lines.push({
      text: `Internet: Connected but slow (${internet.ms}ms round-trip)`,
      ok: false,
    });
  } else {
    lines.push({
      text: `Internet: Stable (${internet.ms}ms)`,
      ok: true,
    });
  }

  // ── AI provider status ────────────────────────────────────────────────────
  if (provider !== null && provider !== undefined) {
    if (!provider.ok) {
      lines.push({
        text: 'AI provider: Slow or not responding',
        ok: false,
      });
    } else if (provider.ms > 2000) {
      lines.push({
        text: `AI provider: High latency detected (${provider.ms}ms)`,
        ok: false,
      });
    } else {
      lines.push({
        text: `AI provider: Reachable (${provider.ms}ms)`,
        ok: true,
      });
    }
  }

  // ── Summary / root-cause guess ────────────────────────────────────────────
  if (!internet.ok) {
    lines.push({
      text: 'There may be an issue with your internet connection',
      ok: false,
      isSummary: true,
    });
  } else if (internet.ok && internet.ms > 2000) {
    lines.push({
      text: 'Your slow connection is likely causing this delay',
      ok: false,
      isSummary: true,
    });
  } else if (provider && !provider.ok) {
    lines.push({
      text: 'The AI provider is experiencing high latency — your connection is fine',
      ok: true,
      isSummary: true,
    });
  } else {
    lines.push({
      text: 'The AI provider is taking longer than usual to respond',
      ok: true,
      isSummary: true,
    });
  }

  return lines;
}

/**
 * Creates a latency monitor for one agent run.
 *
 * Usage:
 *   const monitor = createLatencyMonitor(live, provider.endpoint);
 *   // wrap live.stream / live.streamThinking to call monitor.firstToken()
 *   // call monitor.cancel() in the finally block
 *
 * @param {object} live              - Live row object (has .push())
 * @param {string} providerEndpoint  - Full endpoint URL of the selected AI provider
 * @returns {{ firstToken: () => void, cancel: () => void }}
 */
export function createLatencyMonitor(live, providerEndpoint = '') {
  let cancelled = false;
  let firstTokenFired = false;

  const timer = setTimeout(async () => {
    if (cancelled || firstTokenFired) return;

    // Push the "checking" entry immediately so the user sees something
    const waitingHandle = live.push('Response is taking longer than usual\u2026');

    // Run connectivity checks in parallel
    const [internet, provider] = await Promise.all([
      checkInternetConnectivity(),
      checkProviderReachability(providerEndpoint),
    ]);

    // If first token arrived while we were checking, close the entry quietly
    if (cancelled || firstTokenFired) {
      waitingHandle?.done?.(true);
      return;
    }

    // Mark the "checking" entry complete
    waitingHandle?.done?.(true);

    // Push each diagnostic line
    const diagLines = buildDiagnosticLines(internet, provider);
    for (const line of diagLines) {
      if (cancelled || firstTokenFired) break;
      const handle = live.push(`${line.text}`);
      handle?.done?.(line.ok);
    }
  }, SLOW_THRESHOLD_MS);

  return {
    /** Call this as soon as any token (text or thinking) arrives from the model. */
    firstToken() {
      if (!firstTokenFired) {
        firstTokenFired = true;
        clearTimeout(timer);
      }
    },
    /** Call this in the finally block to ensure the timer is always cleared. */
    cancel() {
      cancelled = true;
      clearTimeout(timer);
    },
  };
}
