import * as SlidesAPI from '../API/SlidesAPI.js';
import { requireGoogleCredentials } from '../../../Common.js';

export async function executeSlidesChatTool(ctx, toolName, params = {}) {
  const credentials = requireGoogleCredentials(ctx);

  switch (toolName) {
    case 'slides_get_info': {
      const { presentation_id } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      const pres = await SlidesAPI.getPresentation(credentials, presentation_id.trim());
      const slideCount = (pres.slides ?? []).length;
      const size = pres.pageSize;
      const w = size?.width?.magnitude?.toFixed(0);
      const h = size?.height?.magnitude?.toFixed(0);
      return [
        `**${pres.title ?? 'Untitled Presentation'}**`,
        `Presentation ID: \`${pres.presentationId}\``,
        `Slides: ${slideCount}`,
        w && h ? `Slide size: ${w} × ${h} ${size.width?.unit ?? 'pt'}` : '',
        `Link: https://docs.google.com/presentation/d/${pres.presentationId}/edit`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'slides_read': {
      const { presentation_id } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      const pres = await SlidesAPI.getPresentation(credentials, presentation_id.trim());
      const slides = pres.slides ?? [];
      if (!slides.length) return `Presentation "${pres.title ?? presentation_id}" has no slides.`;

      const sections = slides.map((slide, i) => {
        const texts = SlidesAPI.extractSlideText(slide);
        const objectId = slide.objectId ?? '';
        return [
          `── Slide ${i + 1} (ID: \`${objectId}\`) ──`,
          texts.length ? texts.join('\n') : '(no text)',
        ].join('\n');
      });

      return [
        `**${pres.title ?? 'Untitled'}** — ${slides.length} slide${slides.length !== 1 ? 's' : ''}`,
        '',
        sections.join('\n\n'),
      ].join('\n');
    }

    case 'slides_create': {
      const { title } = params;
      if (!title?.trim()) throw new Error('Missing required param: title');
      const pres = await SlidesAPI.createPresentation(credentials, title.trim());
      return [
        'Presentation created',
        `Title: ${pres.title}`,
        `ID: \`${pres.presentationId}\``,
        `Link: https://docs.google.com/presentation/d/${pres.presentationId}/edit`,
      ].join('\n');
    }

    case 'slides_add_slide': {
      const { presentation_id, insertion_index } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      const reply = await SlidesAPI.addSlide(credentials, presentation_id.trim(), {
        insertionIndex: insertion_index != null ? Number(insertion_index) : undefined,
      });
      return ['Slide added', reply?.objectId ? `Slide ID: \`${reply.objectId}\`` : '']
        .filter(Boolean)
        .join('\n');
    }

    case 'slides_delete_slide': {
      const { presentation_id, slide_object_id } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      await SlidesAPI.deleteSlide(credentials, presentation_id.trim(), slide_object_id.trim());
      return `Slide \`${slide_object_id}\` deleted from presentation.`;
    }

    case 'slides_duplicate_slide': {
      const { presentation_id, slide_object_id } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      const reply = await SlidesAPI.duplicateSlide(
        credentials,
        presentation_id.trim(),
        slide_object_id.trim(),
      );
      return [
        `Slide \`${slide_object_id}\` duplicated`,
        reply?.objectId ? `New slide ID: \`${reply.objectId}\`` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'slides_replace_text': {
      const { presentation_id, search_text, replacement } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!search_text) throw new Error('Missing required param: search_text');
      if (replacement == null) throw new Error('Missing required param: replacement');
      const reply = await SlidesAPI.replaceAllText(
        credentials,
        presentation_id.trim(),
        search_text,
        String(replacement),
      );
      const count = reply?.occurrencesChanged ?? 0;
      return count > 0
        ? `Replaced ${count} occurrence${count !== 1 ? 's' : ''} of "${search_text}" across all slides.`
        : `No occurrences of "${search_text}" found in the presentation.`;
    }

    case 'slides_list_slides': {
      const { presentation_id } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      const slides = await SlidesAPI.listSlides(credentials, presentation_id.trim());
      if (!slides.length) return 'Presentation has no slides.';
      const rows = slides.map(
        (s) =>
          `Slide ${s.index}: ID \`${s.objectId}\` — ${s.elementCount} element${s.elementCount !== 1 ? 's' : ''}${s.speakerNotesObjectId ? ` (notes ID: \`${s.speakerNotesObjectId}\`)` : ''}`,
      );
      return [`**${slides.length} slide${slides.length !== 1 ? 's' : ''}**`, ...rows].join('\n');
    }

    case 'slides_get_slide': {
      const { presentation_id, slide_object_id } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      const slide = await SlidesAPI.getSlide(
        credentials,
        presentation_id.trim(),
        slide_object_id.trim(),
      );
      const elements = slide.pageElements ?? [];
      const lines = [
        `**Slide** \`${slide.objectId}\``,
        `Elements: ${elements.length}`,
        '',
        ...elements.map((el, i) => {
          const kind = el.shape
            ? `shape (${el.shape.shapeType ?? 'unknown'})`
            : el.image
              ? 'image'
              : el.table
                ? `table (${el.table.rows}×${el.table.columns})`
                : el.video
                  ? 'video'
                  : el.line
                    ? 'line'
                    : 'element';
          const texts = SlidesAPI.extractSlideText({ pageElements: [el] });
          const preview = texts.length
            ? ` — "${texts[0].slice(0, 60)}${texts[0].length > 60 ? '…' : ''}"`
            : '';
          return `${i + 1}. \`${el.objectId}\` — ${kind}${preview}`;
        }),
      ];
      return lines.join('\n');
    }

    case 'slides_reorder_slides': {
      const { presentation_id, slide_object_ids, insertion_index } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!Array.isArray(slide_object_ids) || !slide_object_ids.length)
        throw new Error('Missing required param: slide_object_ids (must be a non-empty array)');
      if (insertion_index == null) throw new Error('Missing required param: insertion_index');
      await SlidesAPI.reorderSlides(
        credentials,
        presentation_id.trim(),
        slide_object_ids,
        Number(insertion_index),
      );
      return `Moved ${slide_object_ids.length} slide${slide_object_ids.length !== 1 ? 's' : ''} to position ${insertion_index}.`;
    }

    case 'slides_add_text_box': {
      const { presentation_id, slide_object_id, text, x, y, width, height } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      const result = await SlidesAPI.addTextBox(
        credentials,
        presentation_id.trim(),
        slide_object_id.trim(),
        {
          text: text ?? '',
          x: x != null ? Number(x) : 100,
          y: y != null ? Number(y) : 100,
          width: width != null ? Number(width) : 300,
          height: height != null ? Number(height) : 60,
        },
      );
      return [
        'Text box added',
        `Element ID: \`${result.objectId}\``,
        text ? `Content: "${text}"` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'slides_update_text': {
      const { presentation_id, object_id, text } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!object_id?.trim()) throw new Error('Missing required param: object_id');
      if (text == null) throw new Error('Missing required param: text');
      await SlidesAPI.updateShapeText(
        credentials,
        presentation_id.trim(),
        object_id.trim(),
        String(text),
      );
      return `Text in element \`${object_id}\` updated.`;
    }

    case 'slides_add_image': {
      const { presentation_id, slide_object_id, image_url, x, y, width, height } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      if (!image_url?.trim()) throw new Error('Missing required param: image_url');
      const result = await SlidesAPI.addImage(
        credentials,
        presentation_id.trim(),
        slide_object_id.trim(),
        {
          imageUrl: image_url.trim(),
          x: x != null ? Number(x) : 50,
          y: y != null ? Number(y) : 50,
          width: width != null ? Number(width) : 300,
          height: height != null ? Number(height) : 200,
        },
      );
      return ['Image added', `Element ID: \`${result.objectId}\``].join('\n');
    }

    case 'slides_delete_element': {
      const { presentation_id, object_id } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!object_id?.trim()) throw new Error('Missing required param: object_id');
      await SlidesAPI.deleteElement(credentials, presentation_id.trim(), object_id.trim());
      return `Element \`${object_id}\` deleted.`;
    }

    case 'slides_add_shape': {
      const { presentation_id, slide_object_id, shape_type, x, y, width, height } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      const result = await SlidesAPI.addShape(
        credentials,
        presentation_id.trim(),
        slide_object_id.trim(),
        {
          shapeType: shape_type?.trim() ?? 'RECTANGLE',
          x: x != null ? Number(x) : 100,
          y: y != null ? Number(y) : 100,
          width: width != null ? Number(width) : 200,
          height: height != null ? Number(height) : 150,
        },
      );
      return [
        `${shape_type ?? 'RECTANGLE'} shape added`,
        `Element ID: \`${result.objectId}\``,
      ].join('\n');
    }

    case 'slides_update_background': {
      const { presentation_id, slide_object_id, r, g, b } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      if (r == null || g == null || b == null) throw new Error('Missing required params: r, g, b');
      await SlidesAPI.updateSlideBackground(
        credentials,
        presentation_id.trim(),
        slide_object_id.trim(),
        {
          r: Number(r),
          g: Number(g),
          b: Number(b),
        },
      );
      return `Slide \`${slide_object_id}\` background set to rgb(${r}, ${g}, ${b}).`;
    }

    case 'slides_update_text_style': {
      const {
        presentation_id,
        object_id,
        bold,
        italic,
        underline,
        font_size,
        font_family,
        r,
        g,
        b,
      } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!object_id?.trim()) throw new Error('Missing required param: object_id');
      await SlidesAPI.updateTextStyle(credentials, presentation_id.trim(), object_id.trim(), {
        bold: bold != null ? Boolean(bold) : undefined,
        italic: italic != null ? Boolean(italic) : undefined,
        underline: underline != null ? Boolean(underline) : undefined,
        fontSize: font_size != null ? Number(font_size) : undefined,
        fontFamily: font_family ?? undefined,
        r: r != null ? Number(r) : undefined,
        g: g != null ? Number(g) : undefined,
        b: b != null ? Number(b) : undefined,
      });
      return `Text style updated on element \`${object_id}\`.`;
    }

    case 'slides_add_table': {
      const { presentation_id, slide_object_id, rows, columns, x, y, width, height } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      const result = await SlidesAPI.addTable(
        credentials,
        presentation_id.trim(),
        slide_object_id.trim(),
        {
          rows: rows != null ? Number(rows) : 3,
          columns: columns != null ? Number(columns) : 3,
          x: x != null ? Number(x) : 50,
          y: y != null ? Number(y) : 100,
          width: width != null ? Number(width) : 450,
          height: height != null ? Number(height) : 200,
        },
      );
      return [
        `Table (${rows ?? 3}×${columns ?? 3}) added`,
        `Element ID: \`${result.objectId}\``,
      ].join('\n');
    }

    case 'slides_move_element': {
      const { presentation_id, object_id, x, y } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!object_id?.trim()) throw new Error('Missing required param: object_id');
      if (x == null || y == null) throw new Error('Missing required params: x, y');
      await SlidesAPI.moveElement(credentials, presentation_id.trim(), object_id.trim(), {
        x: Number(x),
        y: Number(y),
      });
      return `Element \`${object_id}\` moved to (${x}pt, ${y}pt).`;
    }

    case 'slides_add_speaker_notes': {
      const { presentation_id, slide_object_id, notes } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      if (!notes?.trim()) throw new Error('Missing required param: notes');
      await SlidesAPI.addSpeakerNotes(
        credentials,
        presentation_id.trim(),
        slide_object_id.trim(),
        notes,
      );
      return `Speaker notes set on slide \`${slide_object_id}\`.`;
    }

    case 'slides_update_alignment': {
      const { presentation_id, object_id, alignment } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!object_id?.trim()) throw new Error('Missing required param: object_id');
      if (!alignment?.trim()) throw new Error('Missing required param: alignment');
      const valid = ['START', 'CENTER', 'END', 'JUSTIFIED'];
      const normalized = alignment.trim().toUpperCase();
      if (!valid.includes(normalized))
        throw new Error(`Invalid alignment "${alignment}". Use: ${valid.join(', ')}`);
      await SlidesAPI.updateParagraphAlignment(
        credentials,
        presentation_id.trim(),
        object_id.trim(),
        normalized,
      );
      return `Text alignment in element \`${object_id}\` set to ${normalized}.`;
    }

    case 'slides_update_shape_fill': {
      const { presentation_id, object_id, r, g, b, alpha } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!object_id?.trim()) throw new Error('Missing required param: object_id');
      if (r == null || g == null || b == null) throw new Error('Missing required params: r, g, b');
      await SlidesAPI.updateShapeFill(credentials, presentation_id.trim(), object_id.trim(), {
        r: Number(r),
        g: Number(g),
        b: Number(b),
        alpha: alpha != null ? Number(alpha) : 1.0,
      });
      return `Shape \`${object_id}\` fill set to rgb(${r}, ${g}, ${b})${alpha != null ? ` @ ${alpha} opacity` : ''}.`;
    }

    case 'slides_insert_table_rows': {
      const { presentation_id, table_object_id, row_index, insert_below, count } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!table_object_id?.trim()) throw new Error('Missing required param: table_object_id');
      if (row_index == null) throw new Error('Missing required param: row_index');
      await SlidesAPI.insertTableRows(credentials, presentation_id.trim(), table_object_id.trim(), {
        rowIndex: Number(row_index),
        insertBelow: insert_below != null ? Boolean(insert_below) : true,
        count: count != null ? Number(count) : 1,
      });
      const n = count ?? 1;
      const pos = insert_below === false ? 'above' : 'below';
      return `${n} row${n !== 1 ? 's' : ''} inserted ${pos} row ${row_index} in table \`${table_object_id}\`.`;
    }

    case 'slides_delete_table_row': {
      const { presentation_id, table_object_id, row_index } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!table_object_id?.trim()) throw new Error('Missing required param: table_object_id');
      if (row_index == null) throw new Error('Missing required param: row_index');
      await SlidesAPI.deleteTableRow(
        credentials,
        presentation_id.trim(),
        table_object_id.trim(),
        Number(row_index),
      );
      return `Row ${row_index} deleted from table \`${table_object_id}\`.`;
    }

    case 'slides_update_table_cell': {
      const { presentation_id, table_object_id, row_index, column_index, text } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!table_object_id?.trim()) throw new Error('Missing required param: table_object_id');
      if (row_index == null) throw new Error('Missing required param: row_index');
      if (column_index == null) throw new Error('Missing required param: column_index');
      if (text == null) throw new Error('Missing required param: text');
      await SlidesAPI.updateTableCellText(
        credentials,
        presentation_id.trim(),
        table_object_id.trim(),
        Number(row_index),
        Number(column_index),
        String(text),
      );
      return `Cell [${row_index}, ${column_index}] in table \`${table_object_id}\` updated.`;
    }

    case 'slides_add_line': {
      const { presentation_id, slide_object_id, line_category, x, y, width, height } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      const result = await SlidesAPI.addLine(
        credentials,
        presentation_id.trim(),
        slide_object_id.trim(),
        {
          lineCategory: line_category?.trim().toUpperCase() ?? 'STRAIGHT',
          x: x != null ? Number(x) : 50,
          y: y != null ? Number(y) : 50,
          width: width != null ? Number(width) : 200,
          height: height != null ? Number(height) : 0,
        },
      );
      return ['Line added', `Element ID: \`${result.objectId}\``].join('\n');
    }

    case 'slides_add_video': {
      const { presentation_id, slide_object_id, video_id, x, y, width, height } = params;
      if (!presentation_id?.trim()) throw new Error('Missing required param: presentation_id');
      if (!slide_object_id?.trim()) throw new Error('Missing required param: slide_object_id');
      if (!video_id?.trim()) throw new Error('Missing required param: video_id');
      const result = await SlidesAPI.addVideo(
        credentials,
        presentation_id.trim(),
        slide_object_id.trim(),
        {
          videoId: video_id.trim(),
          x: x != null ? Number(x) : 100,
          y: y != null ? Number(y) : 100,
          width: width != null ? Number(width) : 320,
          height: height != null ? Number(height) : 180,
        },
      );
      return [`YouTube video \`${video_id}\` embedded`, `Element ID: \`${result.objectId}\``].join(
        '\n',
      );
    }

    default:
      throw new Error(`Unknown Slides tool: ${toolName}`);
  }
}
