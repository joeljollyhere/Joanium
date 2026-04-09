async function getFreshGoogleCreds(creds) {
  const { getFreshCreds } = await import('../../../GoogleWorkspace.js');
  return getFreshCreds(creds);
}

const SLIDES_BASE = 'https://slides.googleapis.com/v1/presentations';
const PT_TO_EMU = 12700;

async function slidesFetch(creds, url, options = {}) {
  const fresh = await getFreshGoogleCreds(creds);
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${fresh.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Slides API error (${res.status}): ${body.error?.message ?? JSON.stringify(body)}`,
    );
  }

  if (res.status === 204) return null;
  return res.json();
}

function pt(value) {
  return { magnitude: value * PT_TO_EMU, unit: 'EMU' };
}

function elementProperties(pageObjectId, x, y, width, height) {
  return {
    pageObjectId,
    size: {
      width: pt(width),
      height: pt(height),
    },
    transform: {
      scaleX: 1,
      scaleY: 1,
      translateX: x * PT_TO_EMU,
      translateY: y * PT_TO_EMU,
      unit: 'EMU',
    },
  };
}

export async function getPresentation(creds, presentationId) {
  return slidesFetch(creds, `${SLIDES_BASE}/${presentationId}`);
}

export async function createPresentation(creds, title) {
  return slidesFetch(creds, SLIDES_BASE, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export function extractSlideText(slide) {
  const texts = [];
  for (const element of slide.pageElements ?? []) {
    const textContent =
      element.shape?.text ??
      element.table?.tableRows
        ?.flatMap((row) => row.tableCells ?? [])
        ?.flatMap((cell) => (cell.text ? [cell.text] : []));

    const textObj = Array.isArray(textContent) ? textContent[0] : textContent;
    if (!textObj) continue;

    const text = (textObj.textElements ?? [])
      .map((el) => el.textRun?.content ?? '')
      .join('')
      .trim();

    if (text) texts.push(text);
  }
  return texts;
}

export async function addSlide(creds, presentationId, { insertionIndex, layoutId } = {}) {
  const request = { createSlide: {} };
  if (insertionIndex != null) request.createSlide.insertionIndex = insertionIndex;
  if (layoutId) request.createSlide.slideLayoutReference = { layoutId };

  const result = await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests: [request] }),
  });

  return result.replies?.[0]?.createSlide ?? null;
}

export async function deleteSlide(creds, presentationId, slideObjectId) {
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{ deleteObject: { objectId: slideObjectId } }],
    }),
  });
  return true;
}

export async function duplicateSlide(creds, presentationId, slideObjectId) {
  const result = await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{ duplicateObject: { objectId: slideObjectId } }],
    }),
  });
  return result.replies?.[0]?.duplicateObject ?? null;
}

export async function replaceAllText(creds, presentationId, searchText, replacement) {
  const result = await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          replaceAllText: {
            containsText: { text: searchText, matchCase: true },
            replaceText: replacement,
          },
        },
      ],
    }),
  });
  return result.replies?.[0]?.replaceAllText ?? null;
}

export async function listSlides(creds, presentationId) {
  const pres = await getPresentation(creds, presentationId);
  return (pres.slides ?? []).map((slide, i) => ({
    index: i + 1,
    objectId: slide.objectId,
    speakerNotesObjectId:
      slide.slideProperties?.notesPage?.notesProperties?.speakerNotesObjectId ?? null,
    elementCount: (slide.pageElements ?? []).length,
  }));
}

export async function getSlide(creds, presentationId, slideObjectId) {
  const pres = await getPresentation(creds, presentationId);
  const slide = (pres.slides ?? []).find((s) => s.objectId === slideObjectId);
  if (!slide) throw new Error(`Slide "${slideObjectId}" not found in presentation.`);
  return slide;
}

export async function reorderSlides(creds, presentationId, slideObjectIds, insertionIndex) {
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{ updateSlidesPosition: { slideObjectIds, insertionIndex } }],
    }),
  });
  return true;
}

export async function addTextBox(
  creds,
  presentationId,
  slideObjectId,
  { text = '', x = 100, y = 100, width = 300, height = 60 } = {},
) {
  const boxId = `textbox_${Date.now()}`;
  const requests = [
    {
      createShape: {
        objectId: boxId,
        shapeType: 'TEXT_BOX',
        elementProperties: elementProperties(slideObjectId, x, y, width, height),
      },
    },
  ];
  if (text) {
    requests.push({ insertText: { objectId: boxId, insertionIndex: 0, text } });
  }
  const result = await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests }),
  });
  return { objectId: boxId, replies: result.replies };
}

export async function updateShapeText(creds, presentationId, objectId, newText) {
  const requests = [
    { deleteText: { objectId, textRange: { type: 'ALL' } } },
    { insertText: { objectId, insertionIndex: 0, text: newText } },
  ];
  return slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests }),
  });
}

export async function addImage(
  creds,
  presentationId,
  slideObjectId,
  { imageUrl, x = 50, y = 50, width = 300, height = 200 } = {},
) {
  const imgId = `image_${Date.now()}`;
  const result = await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          createImage: {
            objectId: imgId,
            url: imageUrl,
            elementProperties: elementProperties(slideObjectId, x, y, width, height),
          },
        },
      ],
    }),
  });
  return { objectId: imgId, reply: result.replies?.[0] ?? null };
}

export async function deleteElement(creds, presentationId, objectId) {
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests: [{ deleteObject: { objectId } }] }),
  });
  return true;
}

export async function addShape(
  creds,
  presentationId,
  slideObjectId,
  { shapeType = 'RECTANGLE', x = 100, y = 100, width = 200, height = 150 } = {},
) {
  const shapeId = `shape_${Date.now()}`;
  const result = await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          createShape: {
            objectId: shapeId,
            shapeType,
            elementProperties: elementProperties(slideObjectId, x, y, width, height),
          },
        },
      ],
    }),
  });
  return { objectId: shapeId, reply: result.replies?.[0] ?? null };
}

export async function updateSlideBackground(creds, presentationId, slideObjectId, { r, g, b }) {
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          updatePageProperties: {
            objectId: slideObjectId,
            pageProperties: {
              pageBackgroundFill: {
                solidFill: {
                  color: {
                    rgbColor: { red: r / 255, green: g / 255, blue: b / 255 },
                  },
                },
              },
            },
            fields: 'pageBackgroundFill',
          },
        },
      ],
    }),
  });
  return true;
}

export async function updateTextStyle(
  creds,
  presentationId,
  objectId,
  { bold, italic, underline, fontSize, fontFamily, r, g, b } = {},
) {
  const style = {};
  const fieldList = [];

  if (bold != null) {
    style.bold = bold;
    fieldList.push('bold');
  }
  if (italic != null) {
    style.italic = italic;
    fieldList.push('italic');
  }
  if (underline != null) {
    style.underline = underline;
    fieldList.push('underline');
  }
  if (fontSize != null) {
    style.fontSize = { magnitude: fontSize, unit: 'PT' };
    fieldList.push('fontSize');
  }
  if (fontFamily != null) {
    style.fontFamily = fontFamily;
    fieldList.push('fontFamily');
  }
  if (r != null && g != null && b != null) {
    style.foregroundColor = {
      opaqueColor: { rgbColor: { red: r / 255, green: g / 255, blue: b / 255 } },
    };
    fieldList.push('foregroundColor');
  }

  if (!fieldList.length) throw new Error('No style properties provided.');

  return slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          updateTextStyle: {
            objectId,
            textRange: { type: 'ALL' },
            style,
            fields: fieldList.join(','),
          },
        },
      ],
    }),
  });
}

export async function addTable(
  creds,
  presentationId,
  slideObjectId,
  { rows = 3, columns = 3, x = 50, y = 100, width = 450, height = 200 } = {},
) {
  const tableId = `table_${Date.now()}`;
  const result = await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          createTable: {
            objectId: tableId,
            rows,
            columns,
            elementProperties: elementProperties(slideObjectId, x, y, width, height),
          },
        },
      ],
    }),
  });
  return { objectId: tableId, reply: result.replies?.[0] ?? null };
}

export async function moveElement(
  creds,
  presentationId,
  objectId,
  { x, y, scaleX = 1, scaleY = 1 },
) {
  const transform = {
    scaleX,
    scaleY,
    translateX: x * PT_TO_EMU,
    translateY: y * PT_TO_EMU,
    unit: 'EMU',
  };
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          updatePageElementTransform: {
            objectId,
            transform,
            applyMode: 'ABSOLUTE',
          },
        },
      ],
    }),
  });
  return true;
}

export async function addSpeakerNotes(creds, presentationId, slideObjectId, notes) {
  const pres = await getPresentation(creds, presentationId);
  const slide = (pres.slides ?? []).find((s) => s.objectId === slideObjectId);
  if (!slide) throw new Error(`Slide "${slideObjectId}" not found.`);

  const speakerNotesId = slide.slideProperties?.notesPage?.notesProperties?.speakerNotesObjectId;
  if (!speakerNotesId) throw new Error('Could not find speaker notes object for this slide.');

  const requests = [
    { deleteText: { objectId: speakerNotesId, textRange: { type: 'ALL' } } },
    { insertText: { objectId: speakerNotesId, insertionIndex: 0, text: notes } },
  ];
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests }),
  });
  return true;
}

export async function updateParagraphAlignment(creds, presentationId, objectId, alignment) {
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          updateParagraphStyle: {
            objectId,
            textRange: { type: 'ALL' },
            style: { alignment },
            fields: 'alignment',
          },
        },
      ],
    }),
  });
  return true;
}

export async function updateShapeFill(creds, presentationId, objectId, { r, g, b, alpha = 1.0 }) {
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          updateShapeProperties: {
            objectId,
            shapeProperties: {
              shapeBackgroundFill: {
                solidFill: {
                  color: { rgbColor: { red: r / 255, green: g / 255, blue: b / 255 } },
                  alpha,
                },
              },
            },
            fields: 'shapeBackgroundFill',
          },
        },
      ],
    }),
  });
  return true;
}

export async function insertTableRows(
  creds,
  presentationId,
  tableObjectId,
  { rowIndex = 0, insertBelow = true, count = 1 } = {},
) {
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          insertTableRows: {
            tableObjectId,
            cellLocation: { rowIndex },
            insertBelow,
            number: count,
          },
        },
      ],
    }),
  });
  return true;
}

export async function deleteTableRow(creds, presentationId, tableObjectId, rowIndex) {
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          deleteTableRow: {
            tableObjectId,
            cellLocation: { rowIndex },
          },
        },
      ],
    }),
  });
  return true;
}

export async function updateTableCellText(
  creds,
  presentationId,
  tableObjectId,
  rowIndex,
  columnIndex,
  text,
) {
  const requests = [
    {
      deleteText: {
        objectId: tableObjectId,
        cellLocation: { rowIndex, columnIndex },
        textRange: { type: 'ALL' },
      },
    },
    {
      insertText: {
        objectId: tableObjectId,
        cellLocation: { rowIndex, columnIndex },
        insertionIndex: 0,
        text,
      },
    },
  ];
  await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests }),
  });
  return true;
}

export async function addLine(
  creds,
  presentationId,
  slideObjectId,
  { lineCategory = 'STRAIGHT', x = 50, y = 50, width = 200, height = 0 } = {},
) {
  const lineId = `line_${Date.now()}`;
  const result = await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          createLine: {
            objectId: lineId,
            lineCategory,
            elementProperties: elementProperties(
              slideObjectId,
              x,
              y,
              Math.max(width, 1),
              Math.max(height, 1),
            ),
          },
        },
      ],
    }),
  });
  return { objectId: lineId, reply: result.replies?.[0] ?? null };
}

export async function addVideo(
  creds,
  presentationId,
  slideObjectId,
  { videoId, x = 100, y = 100, width = 320, height = 180 } = {},
) {
  const vidId = `video_${Date.now()}`;
  const result = await slidesFetch(creds, `${SLIDES_BASE}/${presentationId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          createVideo: {
            objectId: vidId,
            source: 'YOUTUBE',
            id: videoId,
            elementProperties: elementProperties(slideObjectId, x, y, width, height),
          },
        },
      ],
    }),
  });
  return { objectId: vidId, reply: result.replies?.[0] ?? null };
}
