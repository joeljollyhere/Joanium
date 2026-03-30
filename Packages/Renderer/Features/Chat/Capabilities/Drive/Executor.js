const HANDLED = new Set([
  'drive_list_files',
  'drive_search_files',
  'drive_read_file',
  'drive_get_storage',
  'drive_create_file',
  'drive_list_folders',
]);

export function handles(toolName) { return HANDLED.has(toolName); }

function formatSize(bytes) {
  if (bytes == null) return 'unknown size';
  const n = Number(bytes);
  if (n >= 1_073_741_824) return `${(n / 1_073_741_824).toFixed(2)} GB`;
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MB`;
  if (n >= 1_024) return `${(n / 1_024).toFixed(0)} KB`;
  return `${n} B`;
}

function formatDate(iso) {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return iso; }
}

function mimeLabel(mimeType = '') {
  const map = {
    'application/vnd.google-apps.document': 'Google Doc',
    'application/vnd.google-apps.spreadsheet': 'Google Sheet',
    'application/vnd.google-apps.presentation': 'Google Slides',
    'application/vnd.google-apps.folder': 'Folder',
    'application/pdf': 'PDF',
    'text/plain': 'Text',
    'text/csv': 'CSV',
    'application/json': 'JSON',
    'image/jpeg': 'Image (JPEG)',
    'image/png': 'Image (PNG)',
  };
  return map[mimeType] ?? mimeType.split('/').pop() ?? 'File';
}

export async function execute(toolName, params, onStage = () => {}) {
  switch (toolName) {

    case 'drive_list_files': {
      onStage('[DRIVE] Listing Google Drive files…');
      const opts = {};
      if (params.folder_id?.trim()) opts.folderId = params.folder_id.trim();
      if (params.max_results) opts.pageSize = Number(params.max_results);
      const res = await window.electronAPI?.driveListFiles?.(opts);
      if (!res?.ok) throw new Error(res?.error ?? 'Google Drive not connected');
      const files = res.files ?? [];
      if (!files.length) return 'No files found in Google Drive.';
      const lines = files.map((f, i) =>
        `${i + 1}. **${f.name}** [${mimeLabel(f.mimeType)}]${f.size ? ` — ${formatSize(f.size)}` : ''} · Modified ${formatDate(f.modifiedTime)}\n   ID: \`${f.id}\`${f.webViewLink ? `\n   🔗 ${f.webViewLink}` : ''}`
      ).join('\n\n');
      return `🗂️ Google Drive — ${files.length} file${files.length !== 1 ? 's' : ''}:\n\n${lines}`;
    }

    case 'drive_search_files': {
      const { query, max_results } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');
      onStage(`[DRIVE] Searching Google Drive for "${query}"…`);
      const res = await window.electronAPI?.driveSearchFiles?.(query, max_results ?? 20);
      if (!res?.ok) throw new Error(res?.error ?? 'Google Drive not connected');
      const files = res.files ?? [];
      if (!files.length) return `No files found in Google Drive matching "${query}".`;
      const lines = files.map((f, i) =>
        `${i + 1}. **${f.name}** [${mimeLabel(f.mimeType)}]${f.size ? ` — ${formatSize(f.size)}` : ''} · Modified ${formatDate(f.modifiedTime)}\n   ID: \`${f.id}\`${f.webViewLink ? `\n   🔗 ${f.webViewLink}` : ''}`
      ).join('\n\n');
      return `🔍 Drive search for "${query}" — ${files.length} result${files.length !== 1 ? 's' : ''}:\n\n${lines}`;
    }

    case 'drive_read_file': {
      const { file_id } = params;
      if (!file_id?.trim()) throw new Error('Missing required param: file_id');
      onStage(`[DRIVE] Reading file ${file_id}…`);
      const res = await window.electronAPI?.driveReadFile?.(file_id);
      if (!res?.ok) throw new Error(res?.error ?? 'Google Drive not connected');
      const meta = res.meta ?? {};
      if (res.binaryFile) {
        return [
          `📄 **${meta.name ?? 'File'}** [${mimeLabel(meta.mimeType)}]`,
          `This file is a binary format (image, video, etc.) and its content cannot be displayed as text.`,
          meta.webViewLink ? `🔗 ${meta.webViewLink}` : '',
        ].filter(Boolean).join('\n');
      }
      const content = res.content ?? '(empty file)';
      const truncated = res.truncated ?? content.length >= 30_000;
      return [
        `📄 **${meta.name ?? 'File'}** [${mimeLabel(meta.mimeType)}]`,
        meta.modifiedTime ? `Modified: ${formatDate(meta.modifiedTime)}` : '',
        truncated ? '*(showing first 30,000 characters)*' : '',
        '',
        '```',
        content,
        '```',
      ].filter(Boolean).join('\n');
    }

    case 'drive_get_storage': {
      onStage('[DRIVE] Checking Google Drive storage…');
      const res = await window.electronAPI?.driveGetQuota?.();
      if (!res?.ok) throw new Error(res?.error ?? 'Google Drive not connected');
      const q = res.quota ?? {};
      const used = Number(q.usage ?? 0);
      const limit = Number(q.limit ?? 0);
      const pct = limit > 0 ? ((used / limit) * 100).toFixed(1) : null;
      const inDrive = Number(q.usageInDrive ?? 0);
      const inTrash = Number(q.usageInDriveTrash ?? 0);
      return [
        `🗂️ Google Drive Storage`,
        ``,
        `**Used:** ${formatSize(used)}${pct ? ` (${pct}%)` : ''}`,
        limit ? `**Total:** ${formatSize(limit)}` : '',
        inDrive ? `**In Drive:** ${formatSize(inDrive)}` : '',
        inTrash ? `**In Trash:** ${formatSize(inTrash)}` : '',
        res.email ? `\nAccount: ${res.email}` : '',
      ].filter(Boolean).join('\n');
    }

    case 'drive_create_file': {
      const { name, content, folder_id } = params;
      if (!name?.trim()) throw new Error('Missing required param: name');
      if (content == null) throw new Error('Missing required param: content');
      onStage(`[DRIVE] Creating file "${name}" in Google Drive…`);
      const res = await window.electronAPI?.driveCreateFile?.(
        name.trim(),
        String(content),
        'text/plain',
        folder_id?.trim() || null,
      );
      if (!res?.ok) throw new Error(res?.error ?? 'Google Drive not connected');
      const file = res.file ?? {};
      return [
        `✅ File created in Google Drive`,
        `**Name:** ${file.name ?? name}`,
        file.id ? `**ID:** \`${file.id}\`` : '',
        file.webViewLink ? `🔗 ${file.webViewLink}` : '',
      ].filter(Boolean).join('\n');
    }

    case 'drive_list_folders': {
      onStage('[DRIVE] Listing Google Drive folders…');
      const res = await window.electronAPI?.driveListFolders?.(params.max_results ?? 20);
      if (!res?.ok) throw new Error(res?.error ?? 'Google Drive not connected');
      const folders = res.folders ?? [];
      if (!folders.length) return 'No folders found in Google Drive.';
      const lines = folders.map((f, i) =>
        `${i + 1}. 📁 **${f.name}** — ID: \`${f.id}\``
      ).join('\n');
      return `📁 Google Drive Folders (${folders.length}):\n\n${lines}`;
    }

    default:
      throw new Error(`DriveExecutor: unknown tool "${toolName}"`);
  }
}
