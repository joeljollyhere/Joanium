/** Escape a string for safe insertion into HTML. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Render lightweight markdown into safe HTML for read-only UI surfaces. */
export function renderMarkdownToHtml(raw = '') {
  const text = String(raw)
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    .trim();
  let html = escapeHtml(text);

  html = html.replace(/```([\s\S]*?)```/g, (_match, inner) => {
    const newlineIndex = inner.indexOf('\n');
    const code = newlineIndex >= 0 ? inner.slice(newlineIndex + 1) : inner;
    return `</p><pre><code>${code}</code></pre><p>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^### (.+)$/gm, '</p><h3>$1</h3><p>');
  html = html.replace(/^## (.+)$/gm, '</p><h2>$1</h2><p>');
  html = html.replace(/^# (.+)$/gm, '</p><h1>$1</h1><p>');
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = `<p>${html}</p>`;
  html = html.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
  html = html.replace(/<p>\s*<\/p>/g, '').replace(/<p><br><\/p>/g, '');

  return html;
}

/**
 * Generate a unique ID with an optional prefix.
 * @param {string} [prefix='id']
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Format a Date object relative to now for the chat library.
 * @param {Date} date
 */
export function formatChatDate(date) {
  const now = new Date();
  const diff = now - date;
  const DAY = 86_400_000;
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (diff < DAY) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 7 * DAY) return DAYS[date.getDay()];
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Capitalize the first letter of a string. */
export function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Get user initials (up to 2 chars) from a display name. */
export function getInitials(name) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0] ?? 'OW').slice(0, 2).toUpperCase();
}

/**
 * Format a trigger descriptor into a human readable string.
 */
export function formatTrigger(trigger) {
  if (!trigger) return '?';
  switch (trigger.type) {
    case 'on_startup':
      return '\u26A1 Startup';
    case 'interval':
      return `\u23F1 Every ${trigger.minutes}m`;
    case 'hourly':
      return '\u23F0 Hourly';
    case 'daily':
      return `\u{1F305} Daily ${trigger.time ?? ''}`;
    case 'weekly':
      return `\u{1F4C5} ${capitalize(trigger.day ?? '')} ${trigger.time ?? ''}`;
    default:
      return trigger.type;
  }
}

/**
 * Format a timestamp into a relative time string (e.g. "5m ago", "2h ago").
 */
export function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso);
  const minute = 60_000;
  const hour = 3_600_000;

  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / hour)}h ago`;

  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Full locale date+time string for detail views.
 * @param {string} iso
 */
export function fullDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Sort models by rank. Array can contain plain models or entries with { provider, modelName, ... } */
export function sortModelsByRank(modelsArray) {
  return [...modelsArray].sort((l, r) => (l.rank ?? 999) - (r.rank ?? 999));
}
