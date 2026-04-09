import { createExecutor } from '../Shared/createExecutor.js';
import { clampInteger, normalizeFileList } from './Utils.js';

export const { handles, execute } = createExecutor({
  name: 'MemoryExecutor',
  tools: ['list_personal_memory_files', 'search_personal_memory', 'read_personal_memory_files'],
  handlers: {
    list_personal_memory_files: async (_params, onStage) => {
      onStage('Checking personal memory files');
      const files = (await window.electronAPI?.invoke?.('list-personal-memory-files')) ?? [];

      if (!files.length) {
        return 'No personal memory files are available yet.';
      }

      return [
        ...files.map((file) => {
          const factsLabel = file.bulletCount
            ? `${file.bulletCount} fact${file.bulletCount === 1 ? '' : 's'}`
            : file.empty
              ? 'empty'
              : `${file.lineCount} line${file.lineCount === 1 ? '' : 's'}`;
          return `- ${file.filename} [${factsLabel}]`;
        }),
      ].join('\n');
    },

    search_personal_memory: async (params, onStage) => {
      const query = String(params.query ?? '').trim();
      if (!query) throw new Error('Missing required param: query');

      onStage(`Searching personal memory for ${query}`);
      const limit = clampInteger(params.limit, 5, 1, 12);
      const results =
        (await window.electronAPI?.invoke?.('search-personal-memory', query, { limit })) ?? [];

      if (!results.length) {
        return `No personal memory matches found for "${query}".`;
      }

      const lines = [`Personal memory matches for "${query}":`, ''];
      for (const result of results) {
        lines.push(`- ${result.filename}`);
        if (Array.isArray(result.matches) && result.matches.length) {
          lines.push(`  Matches: ${result.matches.join(' | ')}`);
        }
      }
      return lines.join('\n');
    },

    read_personal_memory_files: async (params, onStage) => {
      const files = normalizeFileList(params.files);
      if (!files.length) throw new Error('Missing required param: files');

      onStage(`Reading ${files.length} personal memory file${files.length === 1 ? '' : 's'}`);
      const entries =
        (await window.electronAPI?.invoke?.('read-personal-memory-files', files)) ?? [];

      if (!entries.length) {
        return 'No personal memory files were returned.';
      }

      return entries
        .map((entry) =>
          [`${entry.filename}`, '```md', entry.content?.trim() || '# Empty', '```'].join('\n'),
        )
        .join('\n\n');
    },
  },
});
