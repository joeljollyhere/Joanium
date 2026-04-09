export function clampInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

export function normalizeFileList(value) {
  const raw = Array.isArray(value) ? value : [value];
  return [...new Set(raw.map((entry) => String(entry ?? '').trim()).filter(Boolean))].slice(0, 12);
}
