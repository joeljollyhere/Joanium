import defineFeature from '../../../Core/DefineFeature.js';
import * as SlidesAPI from './API/SlidesAPI.js';
import { SLIDES_TOOLS } from './Chat/Tools.js';
import { executeSlidesChatTool } from './Chat/ChatExecutor.js';
import { withGoogle } from '../../Common.js';

export default defineFeature({
  id: 'slides',
  name: 'Google Slides',
  dependsOn: ['google-workspace'],
  connectors: {
    serviceExtensions: [
      {
        target: 'google',
        subServices: [
          {
            key: 'slides',
            icon: '📊',
            name: 'Google Slides',
            apiUrl: 'https://console.cloud.google.com/apis/library/slides.googleapis.com',
          },
        ],
        capabilities: [
          'Read and manage Google Slides presentations',
          'Create presentations and manipulate slides',
        ],
      },
    ],
  },
  main: {
    methods: {
      async getPresentation(ctx, { presentationId }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId) return { ok: false, error: 'presentationId is required' };
          return {
            ok: true,
            presentation: await SlidesAPI.getPresentation(credentials, presentationId),
          };
        });
      },

      async createPresentation(ctx, { title }) {
        return withGoogle(ctx, async (credentials) => {
          if (!title) return { ok: false, error: 'title is required' };
          return { ok: true, presentation: await SlidesAPI.createPresentation(credentials, title) };
        });
      },

      async addSlide(ctx, { presentationId, insertionIndex, layoutId } = {}) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId) return { ok: false, error: 'presentationId is required' };
          return {
            ok: true,
            reply: await SlidesAPI.addSlide(credentials, presentationId, {
              insertionIndex,
              layoutId,
            }),
          };
        });
      },

      async deleteSlide(ctx, { presentationId, slideObjectId }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          await SlidesAPI.deleteSlide(credentials, presentationId, slideObjectId);
          return { ok: true };
        });
      },

      async duplicateSlide(ctx, { presentationId, slideObjectId }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          return {
            ok: true,
            reply: await SlidesAPI.duplicateSlide(credentials, presentationId, slideObjectId),
          };
        });
      },

      async replaceAllText(ctx, { presentationId, searchText, replacement }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !searchText)
            return { ok: false, error: 'presentationId and searchText are required' };
          return {
            ok: true,
            result: await SlidesAPI.replaceAllText(
              credentials,
              presentationId,
              searchText,
              replacement ?? '',
            ),
          };
        });
      },

      async executeChatTool(ctx, { toolName, params }) {
        return executeSlidesChatTool(ctx, toolName, params);
      },

      async listSlides(ctx, { presentationId }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId) return { ok: false, error: 'presentationId is required' };
          return { ok: true, slides: await SlidesAPI.listSlides(credentials, presentationId) };
        });
      },

      async getSlide(ctx, { presentationId, slideObjectId }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          return {
            ok: true,
            slide: await SlidesAPI.getSlide(credentials, presentationId, slideObjectId),
          };
        });
      },

      async reorderSlides(ctx, { presentationId, slideObjectIds, insertionIndex }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId) return { ok: false, error: 'presentationId is required' };
          if (!Array.isArray(slideObjectIds) || !slideObjectIds.length)
            return { ok: false, error: 'slideObjectIds must be a non-empty array' };
          if (insertionIndex == null) return { ok: false, error: 'insertionIndex is required' };
          await SlidesAPI.reorderSlides(
            credentials,
            presentationId,
            slideObjectIds,
            insertionIndex,
          );
          return { ok: true };
        });
      },

      async addTextBox(ctx, { presentationId, slideObjectId, text, x, y, width, height } = {}) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          return {
            ok: true,
            result: await SlidesAPI.addTextBox(credentials, presentationId, slideObjectId, {
              text,
              x,
              y,
              width,
              height,
            }),
          };
        });
      },

      async updateShapeText(ctx, { presentationId, objectId, text }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !objectId)
            return { ok: false, error: 'presentationId and objectId are required' };
          if (text == null) return { ok: false, error: 'text is required' };
          await SlidesAPI.updateShapeText(credentials, presentationId, objectId, text);
          return { ok: true };
        });
      },

      async addImage(ctx, { presentationId, slideObjectId, imageUrl, x, y, width, height } = {}) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          if (!imageUrl) return { ok: false, error: 'imageUrl is required' };
          return {
            ok: true,
            result: await SlidesAPI.addImage(credentials, presentationId, slideObjectId, {
              imageUrl,
              x,
              y,
              width,
              height,
            }),
          };
        });
      },

      async deleteElement(ctx, { presentationId, objectId }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !objectId)
            return { ok: false, error: 'presentationId and objectId are required' };
          await SlidesAPI.deleteElement(credentials, presentationId, objectId);
          return { ok: true };
        });
      },

      async addShape(ctx, { presentationId, slideObjectId, shapeType, x, y, width, height } = {}) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          return {
            ok: true,
            result: await SlidesAPI.addShape(credentials, presentationId, slideObjectId, {
              shapeType,
              x,
              y,
              width,
              height,
            }),
          };
        });
      },

      async updateSlideBackground(ctx, { presentationId, slideObjectId, r, g, b }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          if (r == null || g == null || b == null)
            return { ok: false, error: 'r, g, b color values are required' };
          await SlidesAPI.updateSlideBackground(credentials, presentationId, slideObjectId, {
            r,
            g,
            b,
          });
          return { ok: true };
        });
      },

      async updateTextStyle(
        ctx,
        { presentationId, objectId, bold, italic, underline, fontSize, fontFamily, r, g, b } = {},
      ) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !objectId)
            return { ok: false, error: 'presentationId and objectId are required' };
          await SlidesAPI.updateTextStyle(credentials, presentationId, objectId, {
            bold,
            italic,
            underline,
            fontSize,
            fontFamily,
            r,
            g,
            b,
          });
          return { ok: true };
        });
      },

      async addTable(
        ctx,
        { presentationId, slideObjectId, rows, columns, x, y, width, height } = {},
      ) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          return {
            ok: true,
            result: await SlidesAPI.addTable(credentials, presentationId, slideObjectId, {
              rows,
              columns,
              x,
              y,
              width,
              height,
            }),
          };
        });
      },

      async moveElement(ctx, { presentationId, objectId, x, y } = {}) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !objectId)
            return { ok: false, error: 'presentationId and objectId are required' };
          if (x == null || y == null) return { ok: false, error: 'x and y are required' };
          await SlidesAPI.moveElement(credentials, presentationId, objectId, { x, y });
          return { ok: true };
        });
      },

      async addSpeakerNotes(ctx, { presentationId, slideObjectId, notes }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          if (!notes) return { ok: false, error: 'notes is required' };
          await SlidesAPI.addSpeakerNotes(credentials, presentationId, slideObjectId, notes);
          return { ok: true };
        });
      },

      async updateParagraphAlignment(ctx, { presentationId, objectId, alignment }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !objectId)
            return { ok: false, error: 'presentationId and objectId are required' };
          if (!alignment) return { ok: false, error: 'alignment is required' };
          await SlidesAPI.updateParagraphAlignment(
            credentials,
            presentationId,
            objectId,
            alignment,
          );
          return { ok: true };
        });
      },

      async updateShapeFill(ctx, { presentationId, objectId, r, g, b, alpha } = {}) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !objectId)
            return { ok: false, error: 'presentationId and objectId are required' };
          if (r == null || g == null || b == null)
            return { ok: false, error: 'r, g, b color values are required' };
          await SlidesAPI.updateShapeFill(credentials, presentationId, objectId, {
            r,
            g,
            b,
            alpha,
          });
          return { ok: true };
        });
      },

      async insertTableRows(
        ctx,
        { presentationId, tableObjectId, rowIndex, insertBelow, count } = {},
      ) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !tableObjectId)
            return { ok: false, error: 'presentationId and tableObjectId are required' };
          if (rowIndex == null) return { ok: false, error: 'rowIndex is required' };
          await SlidesAPI.insertTableRows(credentials, presentationId, tableObjectId, {
            rowIndex,
            insertBelow,
            count,
          });
          return { ok: true };
        });
      },

      async deleteTableRow(ctx, { presentationId, tableObjectId, rowIndex }) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !tableObjectId)
            return { ok: false, error: 'presentationId and tableObjectId are required' };
          if (rowIndex == null) return { ok: false, error: 'rowIndex is required' };
          await SlidesAPI.deleteTableRow(credentials, presentationId, tableObjectId, rowIndex);
          return { ok: true };
        });
      },

      async updateTableCellText(
        ctx,
        { presentationId, tableObjectId, rowIndex, columnIndex, text },
      ) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !tableObjectId)
            return { ok: false, error: 'presentationId and tableObjectId are required' };
          if (rowIndex == null || columnIndex == null)
            return { ok: false, error: 'rowIndex and columnIndex are required' };
          if (text == null) return { ok: false, error: 'text is required' };
          await SlidesAPI.updateTableCellText(
            credentials,
            presentationId,
            tableObjectId,
            rowIndex,
            columnIndex,
            text,
          );
          return { ok: true };
        });
      },

      async addLine(
        ctx,
        { presentationId, slideObjectId, lineCategory, x, y, width, height } = {},
      ) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          return {
            ok: true,
            result: await SlidesAPI.addLine(credentials, presentationId, slideObjectId, {
              lineCategory,
              x,
              y,
              width,
              height,
            }),
          };
        });
      },

      async addVideo(ctx, { presentationId, slideObjectId, videoId, x, y, width, height } = {}) {
        return withGoogle(ctx, async (credentials) => {
          if (!presentationId || !slideObjectId)
            return { ok: false, error: 'presentationId and slideObjectId are required' };
          if (!videoId) return { ok: false, error: 'videoId is required' };
          return {
            ok: true,
            result: await SlidesAPI.addVideo(credentials, presentationId, slideObjectId, {
              videoId,
              x,
              y,
              width,
              height,
            }),
          };
        });
      },
    },
  },
  renderer: {
    chatTools: SLIDES_TOOLS,
  },
});
