import * as DocsAPI from '../API/DocsAPI.js';
import { requireGoogleCredentials } from '../../../Common.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse a "#RRGGBB" or "#RGB" hex string into {red, green, blue} floats 0–1. */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    red: parseInt(full.slice(0, 2), 16) / 255,
    green: parseInt(full.slice(2, 4), 16) / 255,
    blue: parseInt(full.slice(4, 6), 16) / 255,
  };
}

/** Find all occurrences of `query` in `text` and return {start, end} pairs. */
function findAllOccurrences(text, query) {
  const results = [];
  let pos = 0;
  while ((pos = text.indexOf(query, pos)) !== -1) {
    results.push({ start: pos, end: pos + query.length });
    pos += query.length;
  }
  return results;
}

export async function executeDocsChatTool(ctx, toolName, params = {}) {
  const credentials = requireGoogleCredentials(ctx);

  switch (toolName) {
    case 'docs_get_info': {
      const { document_id } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      const doc = await DocsAPI.getDocument(credentials, document_id.trim());
      const bodyContent = doc.body?.content ?? [];
      const totalChars = bodyContent
        .flatMap((el) => el.paragraph?.elements ?? [])
        .reduce((n, el) => n + (el.textRun?.content?.length ?? 0), 0);
      return [
        `**${doc.title ?? 'Untitled'}**`,
        `Document ID: \`${doc.documentId}\``,
        doc.documentStyle?.pageSize
          ? `Page size: ${doc.documentStyle.pageSize.width?.magnitude?.toFixed(0)} × ${doc.documentStyle.pageSize.height?.magnitude?.toFixed(0)} pt`
          : '',
        `~${totalChars.toLocaleString()} characters`,
        doc.revisionId ? `Revision: ${doc.revisionId}` : '',
        `Link: https://docs.google.com/document/d/${doc.documentId}/edit`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'docs_read': {
      const { document_id } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      const doc = await DocsAPI.getDocument(credentials, document_id.trim());
      const { text, truncated } = DocsAPI.extractText(doc);
      if (!text.trim()) return `Document "${doc.title ?? document_id}" is empty.`;
      return [
        `**${doc.title ?? 'Untitled'}**`,
        truncated ? 'Showing the first 30,000 characters.' : '',
        '',
        '```',
        text,
        '```',
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'docs_word_count': {
      const { document_id } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      const doc = await DocsAPI.getDocument(credentials, document_id.trim());
      const { text } = DocsAPI.extractText(doc);
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      const paragraphs = (doc.body?.content ?? []).filter((el) => el.paragraph).length;
      return [
        `**${doc.title ?? 'Untitled'} — Word Count**`,
        `Words: ${words.toLocaleString()}`,
        `Characters: ${chars.toLocaleString()}`,
        `Paragraphs: ${paragraphs.toLocaleString()}`,
      ].join('\n');
    }

    case 'docs_get_outline': {
      const { document_id } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      const doc = await DocsAPI.getDocument(credentials, document_id.trim());
      const headings = DocsAPI.extractOutline(doc);
      if (!headings.length) return 'No headings found in this document.';
      const lines = headings.map(
        (h) =>
          `${'  '.repeat(h.level - 1)}H${h.level} — ${h.text} (index ${h.startIndex}–${h.endIndex})`,
      );
      return [`**${doc.title ?? 'Untitled'} — Outline**`, '', ...lines].join('\n');
    }

    case 'docs_search_text': {
      const { document_id, query } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!query) throw new Error('Missing required param: query');
      const doc = await DocsAPI.getDocument(credentials, document_id.trim());
      const { text } = DocsAPI.extractText(doc);
      const matches = findAllOccurrences(text, query);
      if (!matches.length) return `No occurrences of "${query}" found in the document.`;
      const lines = matches.map(
        (m, i) =>
          `Match ${i + 1}: index ${m.start}–${m.end} — …${text.slice(Math.max(0, m.start - 20), m.end + 20).replace(/\n/g, '↵')}…`,
      );
      return [
        `Found ${matches.length} occurrence${matches.length !== 1 ? 's' : ''} of "${query}":`,
        '',
        ...lines,
      ].join('\n');
    }

    case 'docs_list_named_ranges': {
      const { document_id } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      const doc = await DocsAPI.getDocument(credentials, document_id.trim());
      const ranges = DocsAPI.extractNamedRanges(doc);
      if (!ranges.length) return 'No named ranges found in this document.';
      const lines = ranges.map((r) => {
        const spans = (r.ranges ?? []).map((rng) => `${rng.startIndex}–${rng.endIndex}`).join(', ');
        return `**${r.name}** (ID: ${r.namedRangeId ?? 'n/a'}) — ${spans || 'no range data'}`;
      });
      return [`**Named Ranges (${ranges.length}):**`, '', ...lines].join('\n');
    }

    case 'docs_create': {
      const { title } = params;
      if (!title?.trim()) throw new Error('Missing required param: title');
      const doc = await DocsAPI.createDocument(credentials, title.trim());
      return [
        'Document created',
        `Title: ${doc.title}`,
        `ID: \`${doc.documentId}\``,
        `Link: https://docs.google.com/document/d/${doc.documentId}/edit`,
      ].join('\n');
    }

    case 'docs_append_text': {
      const { document_id, text } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!text) throw new Error('Missing required param: text');
      await DocsAPI.appendText(credentials, document_id.trim(), String(text));
      return `Text appended to document \`${document_id}\`.`;
    }

    case 'docs_prepend_text': {
      const { document_id, text } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!text) throw new Error('Missing required param: text');
      await DocsAPI.insertText(credentials, document_id.trim(), String(text), 1);
      return `Text prepended to document \`${document_id}\`.`;
    }

    case 'docs_insert_text': {
      const { document_id, text, index = 1 } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!text) throw new Error('Missing required param: text');
      if (typeof index !== 'number' || index < 1) throw new Error('index must be a number >= 1');
      await DocsAPI.insertText(credentials, document_id.trim(), String(text), index);
      return `Text inserted at index ${index} in document \`${document_id}\`.`;
    }

    case 'docs_batch_insert_text': {
      const { document_id, insertions } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!Array.isArray(insertions) || !insertions.length)
        throw new Error('insertions must be a non-empty array');
      for (const item of insertions) {
        if (typeof item.index !== 'number' || item.index < 1)
          throw new Error('Each insertion must have a numeric index >= 1');
        if (typeof item.text !== 'string')
          throw new Error('Each insertion must have a string text field');
      }
      await DocsAPI.batchInsertText(credentials, document_id.trim(), insertions);
      return `${insertions.length} text snippet${insertions.length !== 1 ? 's' : ''} inserted into document \`${document_id}\`.`;
    }

    case 'docs_replace_text': {
      const { document_id, search_text, replacement } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!search_text) throw new Error('Missing required param: search_text');
      if (replacement == null) throw new Error('Missing required param: replacement');
      const result = await DocsAPI.replaceAllText(
        credentials,
        document_id.trim(),
        search_text,
        String(replacement),
      );
      const count = result.replies?.[0]?.replaceAllText?.occurrencesChanged ?? 0;
      return count > 0
        ? `Replaced ${count} occurrence${count !== 1 ? 's' : ''} of "${search_text}" in document \`${document_id}\`.`
        : `No occurrences of "${search_text}" found in the document.`;
    }

    case 'docs_delete_range': {
      const { document_id, start_index, end_index } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (start_index == null) throw new Error('Missing required param: start_index');
      if (end_index == null) throw new Error('Missing required param: end_index');
      if (start_index < 1) throw new Error('start_index must be >= 1');
      if (end_index <= start_index) throw new Error('end_index must be greater than start_index');
      await DocsAPI.deleteContentRange(credentials, document_id.trim(), start_index, end_index);
      return `Deleted characters ${start_index}–${end_index} from document \`${document_id}\`.`;
    }

    case 'docs_clear_content': {
      const { document_id } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      const doc = await DocsAPI.getDocument(credentials, document_id.trim());
      const lastEl = (doc.body?.content ?? []).at(-1);
      const endIndex = lastEl?.endIndex ?? 1;
      if (endIndex <= 2) return `Document \`${document_id}\` is already empty.`;
      await DocsAPI.deleteContentRange(credentials, document_id.trim(), 1, endIndex - 1);
      return `All content cleared from document \`${document_id}\`.`;
    }

    case 'docs_apply_text_style': {
      const {
        document_id,
        start_index,
        end_index,
        bold,
        italic,
        underline,
        strikethrough,
        font_size_pt,
        font_family,
        foreground_color_hex,
      } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (start_index == null) throw new Error('Missing required param: start_index');
      if (end_index == null) throw new Error('Missing required param: end_index');
      if (end_index <= start_index) throw new Error('end_index must be greater than start_index');

      const textStyle = {};
      if (bold != null) textStyle.bold = bold;
      if (italic != null) textStyle.italic = italic;
      if (underline != null) textStyle.underline = underline;
      if (strikethrough != null) textStyle.strikethrough = strikethrough;
      if (font_size_pt != null) textStyle.fontSize = { magnitude: font_size_pt, unit: 'PT' };
      if (font_family != null) textStyle.weightedFontFamily = { fontFamily: font_family };
      if (foreground_color_hex != null)
        textStyle.foregroundColor = { color: { rgbColor: hexToRgb(foreground_color_hex) } };

      if (!Object.keys(textStyle).length)
        throw new Error('At least one style property is required');
      await DocsAPI.applyTextStyle(
        credentials,
        document_id.trim(),
        start_index,
        end_index,
        textStyle,
      );
      return `Text style applied to characters ${start_index}–${end_index} in document \`${document_id}\`.`;
    }

    case 'docs_apply_paragraph_style': {
      const { document_id, start_index, end_index, named_style_type, alignment, line_spacing } =
        params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (start_index == null) throw new Error('Missing required param: start_index');
      if (end_index == null) throw new Error('Missing required param: end_index');
      if (end_index <= start_index) throw new Error('end_index must be greater than start_index');

      const paragraphStyle = {};
      if (named_style_type != null) paragraphStyle.namedStyleType = named_style_type;
      if (alignment != null) paragraphStyle.alignment = alignment;
      if (line_spacing != null) paragraphStyle.lineSpacing = line_spacing;

      if (!Object.keys(paragraphStyle).length)
        throw new Error('At least one style property is required');
      await DocsAPI.applyParagraphStyle(
        credentials,
        document_id.trim(),
        start_index,
        end_index,
        paragraphStyle,
      );
      return `Paragraph style applied to range ${start_index}–${end_index} in document \`${document_id}\`.`;
    }

    case 'docs_create_bullet_list': {
      const { document_id, start_index, end_index, bullet_preset } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (start_index == null) throw new Error('Missing required param: start_index');
      if (end_index == null) throw new Error('Missing required param: end_index');
      if (end_index <= start_index) throw new Error('end_index must be greater than start_index');
      await DocsAPI.createBulletList(
        credentials,
        document_id.trim(),
        start_index,
        end_index,
        bullet_preset ?? 'BULLET_DISC_CIRCLE_SQUARE',
      );
      return `Bullet list applied to range ${start_index}–${end_index} in document \`${document_id}\`.`;
    }

    case 'docs_remove_bullet_list': {
      const { document_id, start_index, end_index } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (start_index == null) throw new Error('Missing required param: start_index');
      if (end_index == null) throw new Error('Missing required param: end_index');
      if (end_index <= start_index) throw new Error('end_index must be greater than start_index');
      await DocsAPI.removeBulletList(credentials, document_id.trim(), start_index, end_index);
      return `Bullet formatting removed from range ${start_index}–${end_index} in document \`${document_id}\`.`;
    }

    case 'docs_insert_table': {
      const { document_id, rows, columns, index = 1 } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!rows || rows < 1) throw new Error('rows must be >= 1');
      if (!columns || columns < 1) throw new Error('columns must be >= 1');
      if (index < 1) throw new Error('index must be >= 1');
      await DocsAPI.insertTable(credentials, document_id.trim(), rows, columns, index);
      return `${rows}×${columns} table inserted at index ${index} in document \`${document_id}\`.`;
    }

    case 'docs_insert_page_break': {
      const { document_id, index = 1 } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (index < 1) throw new Error('index must be >= 1');
      await DocsAPI.insertPageBreak(credentials, document_id.trim(), index);
      return `Page break inserted at index ${index} in document \`${document_id}\`.`;
    }

    case 'docs_insert_inline_image': {
      const { document_id, image_url, index = 1, width_pt, height_pt } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!image_url?.trim()) throw new Error('Missing required param: image_url');
      if (index < 1) throw new Error('index must be >= 1');
      await DocsAPI.insertInlineImage(
        credentials,
        document_id.trim(),
        image_url.trim(),
        index,
        width_pt,
        height_pt,
      );
      return `Image inserted at index ${index} in document \`${document_id}\`.`;
    }

    case 'docs_create_named_range': {
      const { document_id, name, start_index, end_index } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!name?.trim()) throw new Error('Missing required param: name');
      if (start_index == null) throw new Error('Missing required param: start_index');
      if (end_index == null) throw new Error('Missing required param: end_index');
      if (end_index <= start_index) throw new Error('end_index must be greater than start_index');
      const result = await DocsAPI.createNamedRange(
        credentials,
        document_id.trim(),
        name.trim(),
        start_index,
        end_index,
      );
      const id = result.replies?.[0]?.createNamedRange?.namedRangeId ?? 'unknown';
      return `Named range "${name}" created (ID: ${id}) covering indices ${start_index}–${end_index}.`;
    }

    case 'docs_delete_named_range': {
      const { document_id, name } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (!name?.trim()) throw new Error('Missing required param: name');
      await DocsAPI.deleteNamedRange(credentials, document_id.trim(), name.trim());
      return `Named range "${name}" deleted from document \`${document_id}\`.`;
    }

    case 'docs_update_page_size': {
      const { document_id, width_pt, height_pt } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      if (width_pt == null) throw new Error('Missing required param: width_pt');
      if (height_pt == null) throw new Error('Missing required param: height_pt');
      await DocsAPI.updateDocumentStyle(
        credentials,
        document_id.trim(),
        {
          pageSize: {
            width: { magnitude: width_pt, unit: 'PT' },
            height: { magnitude: height_pt, unit: 'PT' },
          },
        },
        'pageSize',
      );
      return `Page size updated to ${width_pt}×${height_pt} pt in document \`${document_id}\`.`;
    }

    case 'docs_update_margins': {
      const { document_id, top_pt, bottom_pt, left_pt, right_pt } = params;
      if (!document_id?.trim()) throw new Error('Missing required param: document_id');
      const margins = {};
      const fieldParts = [];
      if (top_pt != null) {
        margins.marginTop = { magnitude: top_pt, unit: 'PT' };
        fieldParts.push('marginTop');
      }
      if (bottom_pt != null) {
        margins.marginBottom = { magnitude: bottom_pt, unit: 'PT' };
        fieldParts.push('marginBottom');
      }
      if (left_pt != null) {
        margins.marginLeft = { magnitude: left_pt, unit: 'PT' };
        fieldParts.push('marginLeft');
      }
      if (right_pt != null) {
        margins.marginRight = { magnitude: right_pt, unit: 'PT' };
        fieldParts.push('marginRight');
      }
      if (!fieldParts.length)
        throw new Error('At least one margin (top_pt, bottom_pt, left_pt, right_pt) is required');
      await DocsAPI.updateDocumentStyle(
        credentials,
        document_id.trim(),
        margins,
        fieldParts.join(','),
      );
      const summary = fieldParts
        .map((f) => `${f.replace('margin', '').toLowerCase()}: ${margins[f].magnitude} pt`)
        .join(', ');
      return `Margins updated (${summary}) in document \`${document_id}\`.`;
    }

    default:
      throw new Error(`Unknown Docs tool: ${toolName}`);
  }
}
