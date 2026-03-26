/** Parse/summarise file content for the AI context. */
export function enrichFileContent(filename, rawText) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'csv' || ext === 'tsv') return enrichCSV(rawText, ext === 'tsv' ? '\t' : ',');
  if (ext === 'json') return enrichJSON(rawText);
  if (ext === 'yaml' || ext === 'yml') return enrichYAML(rawText);
  return rawText;
}

function enrichCSV(text, delimiter = ',') {
  try {
    const lines = text.trim().split('\n');
    if (!lines.length) return text;
    const headers = parseCSVLine(lines[0], delimiter);
    const dataRows = lines.slice(1).filter(l => l.trim());

    const colStats = headers.map((h, i) => {
      const vals = dataRows.map(r => parseCSVLine(r, delimiter)[i] ?? '').filter(v => v !== '');
      const nums = vals.map(Number).filter(n => !isNaN(n));
      if (nums.length > vals.length / 2) {
        const min = Math.min(...nums).toFixed(2);
        const max = Math.max(...nums).toFixed(2);
        const avg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
        return `${h} (numeric: min=${min}, max=${max}, avg=${avg})`;
      }
      const unique = new Set(vals).size;
      return `${h} (${unique} unique values)`;
    });

    const preview = [lines[0], ...dataRows.slice(0, 5)].join('\n');
    const note = dataRows.length > 5 ? `\n…(${dataRows.length - 5} more rows)` : '';

    return [
      `[CSV: ${dataRows.length} rows × ${headers.length} columns]`,
      `Columns: ${colStats.join(' | ')}`,
      '',
      preview + note,
    ].join('\n');
  } catch {
    return text;
  }
}

export function parseCSVLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function enrichJSON(text) {
  try {
    const parsed = JSON.parse(text);
    const topLevelKeys = Array.isArray(parsed)
      ? Object.keys(parsed[0] || {}).slice(0, 10)
      : Object.keys(parsed).slice(0, 10);
    const type = Array.isArray(parsed) ? `Array[${parsed.length}]` : 'Object';
    const note = `[JSON: ${type}, keys: ${topLevelKeys.join(', ')}${topLevelKeys.length === 10 ? '…' : ''}]`;
    const preview = JSON.stringify(parsed, null, 2).slice(0, 2000);
    const truncated = text.length > 2000 ? preview + '\n…(truncated)' : preview;
    return `${note}\n\n${truncated}`;
  } catch {
    return text;
  }
}

function enrichYAML(text) {
  const lines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
  const topKeys = lines.filter(l => /^[a-zA-Z0-9_-]+:/.test(l)).slice(0, 8).map(l => l.split(':')[0].trim());
  const note = `[YAML: top-level keys: ${topKeys.join(', ') || 'unknown'}]`;
  const preview = text.slice(0, 2000);
  const truncated = text.length > 2000 ? preview + '\n…(truncated)' : preview;
  return `${note}\n\n${truncated}`;
}
