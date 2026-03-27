import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import { getBrowserPreviewService } from '../../Main/Services/BrowserPreviewService.js';

const BROWSER_TOOLS = [
  {
    name: 'browser_navigate',
    description: 'Open a URL in the built-in browser session.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The absolute URL to open.' },
      },
      required: ['url'],
    },
  },
  {
    name: 'browser_snapshot',
    description: 'Read the current page and list visible interactive elements with stable ids like ow-1.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'browser_click',
    description: 'Click a visible element by stable id from browser_snapshot, CSS selector, or visible label text.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, or visible label text for the element.' },
      },
      required: ['target'],
    },
  },
  {
    name: 'browser_hover',
    description: 'Hover a visible element by stable id, CSS selector, or visible label text.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, or visible label text for the element.' },
      },
      required: ['target'],
    },
  },
  {
    name: 'browser_focus',
    description: 'Focus or activate an element by stable id, CSS selector, or visible label text.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, visible label text, or "focused".' },
      },
      required: ['target'],
    },
  },
  {
    name: 'browser_type',
    description: 'Type text into an input, combobox, contenteditable region, or textarea by stable id, selector, or label.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, visible label text, or "focused".' },
        text: { type: 'string', description: 'The text to type into the field.' },
        clearFirst: { type: 'boolean', description: 'Clear the field before typing. Defaults to true.' },
        pressEnter: { type: 'boolean', description: 'Press Enter after typing.' },
      },
      required: ['target', 'text'],
    },
  },
  {
    name: 'browser_clear',
    description: 'Clear the current value of a text field by stable id, selector, label, or "focused".',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, visible label text, or "focused".' },
      },
      required: ['target'],
    },
  },
  {
    name: 'browser_press_key',
    description: 'Send a keyboard key such as Enter, Tab, ArrowDown, or Escape to the focused element or a target.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Keyboard key to press, such as Enter, Tab, Escape, ArrowDown, or A.' },
        target: { type: 'string', description: 'Optional stable id, selector, or label to focus before pressing the key.' },
      },
      required: ['key'],
    },
  },
  {
    name: 'browser_select_option',
    description: 'Select an option in a select element by value or visible label.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, or visible label text for the select element.' },
        value: { type: 'string', description: 'Option value or visible option text to select.' },
      },
      required: ['target', 'value'],
    },
  },
  {
    name: 'browser_scroll',
    description: 'Scroll the page or a specific element.',
    inputSchema: {
      type: 'object',
      properties: {
        direction: { type: 'string', description: 'up, down, left, right, top, or bottom. Defaults to down.' },
        amount: { type: 'number', description: 'Pixels to scroll when using up, down, left, or right. Defaults to 600.' },
        target: { type: 'string', description: 'Optional stable id, selector, or label for a scrollable element.' },
      },
      required: [],
    },
  },
  {
    name: 'browser_wait',
    description: 'Wait for a fixed amount of time to allow dynamic page updates or animations to finish.',
    inputSchema: {
      type: 'object',
      properties: {
        timeoutMs: { type: 'number', description: 'How long to wait. Defaults to 1000ms.' },
      },
      required: [],
    },
  },
  {
    name: 'browser_set_checked',
    description: 'Set a checkbox, radio button, or switch-like control to checked or unchecked.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, or visible label text for the control.' },
        checked: { type: 'boolean', description: 'Whether the control should be checked.' },
      },
      required: ['target', 'checked'],
    },
  },
  {
    name: 'browser_list_options',
    description: 'List the available options for a select, combobox, or listbox-like control.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, or visible label text for the control.' },
      },
      required: ['target'],
    },
  },
  {
    name: 'browser_list_links',
    description: 'List visible links and button-like actions on the current page with stable ids.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'browser_find_elements',
    description: 'Find visible interactive elements whose label, text, role, id, or selector matches a query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text, label, stable id, or CSS selector to search for.' },
        limit: { type: 'number', description: 'Maximum matches to return. Defaults to 10.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'browser_list_form_fields',
    description: 'List visible form fields, labels, current values, and states on the page or within a target area.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Optional stable id, selector, or label for a form or section to inspect.' },
      },
      required: [],
    },
  },
  {
    name: 'browser_scroll_into_view',
    description: 'Scroll a visible element into the center of the built-in browser viewport.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, or visible label text for the element.' },
      },
      required: ['target'],
    },
  },
  {
    name: 'browser_submit_form',
    description: 'Submit a form from a target field or button, or from the currently focused element.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Optional stable id, CSS selector, or visible label text for the form field or submit button.' },
      },
      required: [],
    },
  },
  {
    name: 'browser_wait_for_element',
    description: 'Wait until an element is visible on the page by stable id, selector, or label text.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, or visible label text for the element.' },
        timeoutMs: { type: 'number', description: 'How long to wait before failing. Defaults to 15000.' },
      },
      required: ['target'],
    },
  },
  {
    name: 'browser_read_element',
    description: 'Read the label, text, value, and state of a visible element by stable id, selector, or label text.',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Stable id, CSS selector, or visible label text for the element.' },
      },
      required: ['target'],
    },
  },
  {
    name: 'browser_wait_for_text',
    description: 'Wait until specific text appears anywhere on the current page.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to wait for on the page.' },
        timeoutMs: { type: 'number', description: 'How long to wait before failing. Defaults to 15000.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'browser_wait_for_navigation',
    description: 'Wait for the current page to finish navigating or loading.',
    inputSchema: {
      type: 'object',
      properties: {
        timeoutMs: { type: 'number', description: 'How long to wait before failing. Defaults to 15000.' },
      },
      required: [],
    },
  },
  {
    name: 'browser_screenshot',
    description: 'Capture the current browser view to a PNG file in the temp folder.',
    inputSchema: {
      type: 'object',
      properties: {
        fileName: { type: 'string', description: 'Optional PNG file name.' },
      },
      required: [],
    },
  },
  {
    name: 'browser_get_state',
    description: 'Get the current page URL, title, loading state, and a short text excerpt.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'browser_back',
    description: 'Go back to the previous page in the built-in browser session.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'browser_forward',
    description: 'Go forward to the next page in the built-in browser session.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'browser_refresh',
    description: 'Reload the current page in the built-in browser session.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

const PAGE_HELPERS = String.raw`
  const normalizeText = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const isVisible = el => {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  const getNodeText = el => normalizeText(
    el?.innerText ||
    el?.textContent ||
    el?.value ||
    el?.placeholder ||
    el?.getAttribute?.('aria-label') ||
    el?.getAttribute?.('title') ||
    el?.name ||
    el?.id
  );
  const getElementLabel = el => {
    const labels = [];
    if (Array.isArray(el?.labels)) labels.push(...el.labels.map(label => getNodeText(label)));
    if (el?.id) {
      document.querySelectorAll('label[for="' + CSS.escape(el.id) + '"]').forEach(label => labels.push(getNodeText(label)));
    }
    labels.push(getNodeText(el));
    return normalizeText(labels.filter(Boolean).join(' | '));
  };
  const isTextLike = el => {
    if (!el) return false;
    if (el instanceof HTMLTextAreaElement) return true;
    if (el instanceof HTMLInputElement) {
      const type = String(el.type || 'text').toLowerCase();
      return !['checkbox', 'radio', 'file', 'range', 'color', 'submit', 'reset', 'button', 'image', 'hidden'].includes(type);
    }
    if (el instanceof HTMLSelectElement) return false;
    if (el.isContentEditable) return true;
    const role = String(el.getAttribute?.('role') || '').toLowerCase();
    return role === 'textbox' || role === 'combobox' || role === 'searchbox';
  };
  const interactiveSelectors = [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'textarea',
    'select',
    '[role="button"]',
    '[role="link"]',
    '[role="textbox"]',
    '[role="combobox"]',
    '[role="searchbox"]',
    '[contenteditable="true"]',
    'label',
  ];
  const formFieldSelector = 'input:not([type="hidden"]), textarea, select, [role="textbox"], [role="combobox"], [role="searchbox"], [contenteditable="true"]';
  const isFormField = el => {
    if (!el) return false;
    try {
      return el.matches(formFieldSelector) || isTextLike(el);
    } catch {
      return isTextLike(el);
    }
  };
  const collectVisibleFields = root => {
    const scope = root?.querySelectorAll ? root : document;
    const direct = root instanceof Element && isFormField(root) ? [root] : [];
    return [...direct, ...scope.querySelectorAll(formFieldSelector)]
      .map(el => el.tagName === 'LABEL' && el.control ? el.control : el)
      .filter(el => el && isVisible(el))
      .filter((el, index, arr) => arr.indexOf(el) === index)
      .slice(0, 120);
  };
  const findInteractiveDescendant = (el, preferTextField = false) => {
    if (!el) return null;
    if (el.tagName === 'LABEL' && el.control) return el.control;
    if (preferTextField && isTextLike(el)) return el;
    if (!preferTextField && interactiveSelectors.some(selector => {
      try { return el.matches(selector); }
      catch { return false; }
    })) return el;

    const selector = preferTextField
      ? 'input:not([type="hidden"]), textarea, [role="textbox"], [role="combobox"], [role="searchbox"], [contenteditable="true"]'
      : interactiveSelectors.join(',');

    const candidate = [...el.querySelectorAll(selector)].find(isVisible);
    if (!candidate) return null;
    return candidate.tagName === 'LABEL' && candidate.control ? candidate.control : candidate;
  };
  const findNearbyTextField = el => {
    if (!el) return null;
    if (isTextLike(el)) return el;
    if (el.tagName === 'LABEL' && el.control && isTextLike(el.control)) return el.control;

    const localMatch = findInteractiveDescendant(el, true);
    if (localMatch && isTextLike(localMatch)) return localMatch;

    const ariaControls = el.getAttribute?.('aria-controls');
    if (ariaControls) {
      const controlled = document.getElementById(ariaControls);
      const controlledField = findInteractiveDescendant(controlled, true);
      if (controlledField && isTextLike(controlledField)) return controlledField;
    }

    const containers = [
      el.closest?.('label'),
      el.closest?.('[role="group"]'),
      el.closest?.('[role="dialog"]'),
      el.closest?.('[data-testid]'),
      el.parentElement,
      el.parentElement?.parentElement,
    ].filter(Boolean);

    for (const container of containers) {
      const field = findInteractiveDescendant(container, true);
      if (field && isTextLike(field)) return field;
    }

    return null;
  };
  const assignStableIds = () => {
    const elements = [...document.querySelectorAll(interactiveSelectors.join(','))]
      .map(el => el.tagName === 'LABEL' && el.control ? el.control : el)
      .filter(el => el && isVisible(el))
      .filter((el, index, arr) => arr.indexOf(el) === index)
      .slice(0, 180);

    elements.forEach((el, index) => {
      if (!el.dataset.owMcpId) el.dataset.owMcpId = 'ow-' + String(index + 1);
    });

    return elements;
  };
  const describeElement = el => ({
    tag: (el?.tagName || '').toLowerCase(),
    type: normalizeText(el?.getAttribute?.('type')),
    role: normalizeText(el?.getAttribute?.('role')),
    label: getElementLabel(el),
    id: el?.dataset?.owMcpId || '',
  });
  const resolveTarget = (rawTarget, options = {}) => {
    const preferTextField = Boolean(options.preferTextField);
    const allowFocused = options.allowFocused !== false;
    const target = normalizeText(rawTarget);
    if (!target) return null;

    if (allowFocused && target.toLowerCase() === 'focused') {
      const focused = document.activeElement || null;
      return preferTextField ? (findNearbyTextField(focused) || focused) : focused;
    }

    if (target.startsWith('ow-')) {
      const byId = document.querySelector('[data-ow-mcp-id="' + CSS.escape(target) + '"]');
      if (byId) return (preferTextField ? findNearbyTextField(byId) : findInteractiveDescendant(byId, preferTextField)) || byId;
    }

    try {
      const bySelector = document.querySelector(target);
      if (bySelector) return (preferTextField ? findNearbyTextField(bySelector) : findInteractiveDescendant(bySelector, preferTextField)) || bySelector;
    } catch { /* ignore invalid selectors */ }

    const lowered = target.toLowerCase();
    const candidates = assignStableIds();

    const byText = candidates.find(candidate => {
      const values = [
        candidate.dataset.owMcpId,
        getElementLabel(candidate),
        candidate.placeholder,
        candidate.getAttribute?.('aria-label'),
        candidate.getAttribute?.('title'),
        candidate.name,
        candidate.id,
      ]
        .map(value => normalizeText(value).toLowerCase())
        .filter(Boolean);

      return values.some(value => value === lowered || value.includes(lowered));
    });

    if (!byText) return null;
    return (preferTextField ? findNearbyTextField(byText) : findInteractiveDescendant(byText, preferTextField)) || byText;
  };
  const focusElement = el => {
    if (!el) return;
    el.scrollIntoView?.({ block: 'center', inline: 'center', behavior: 'instant' });
    el.focus?.({ preventScroll: true });
  };
  const setElementValue = (el, nextValue) => {
    if (el instanceof HTMLInputElement) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      descriptor?.set ? descriptor.set.call(el, nextValue) : (el.value = nextValue);
    } else if (el instanceof HTMLTextAreaElement) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      descriptor?.set ? descriptor.set.call(el, nextValue) : (el.value = nextValue);
    } else if (el.isContentEditable) {
      el.textContent = nextValue;
    } else {
      el.value = nextValue;
    }

    el.dispatchEvent(new InputEvent('input', { bubbles: true, data: nextValue, inputType: 'insertText' }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const dispatchKeyboard = (el, key) => {
    ['keydown', 'keypress', 'keyup'].forEach(type => {
      el.dispatchEvent(new KeyboardEvent(type, {
        key,
        code: key,
        bubbles: true,
        cancelable: true,
      }));
    });
  };
`;

function normalizeUrl(rawUrl = '') {
  const trimmed = String(rawUrl ?? '').trim();
  if (!trimmed) throw new Error('A URL is required.');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function formatElementLine(element) {
  const kind = element.type ? `${element.tag}[${element.type}]` : element.tag;
  const role = element.role ? ` role=${element.role}` : '';
  const label = element.label ? ` - ${element.label}` : '';
  return `[${element.id}] ${kind}${role}${label}`;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeTimeout(timeoutMs, fallback = 15000) {
  const value = Number(timeoutMs);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export class BrowserMCPServer {
  constructor() {
    this._preview = getBrowserPreviewService();
  }

  async listTools() {
    return BROWSER_TOOLS;
  }

  async callTool(name, args = {}) {
    switch (name) {
      case 'browser_navigate':
        return this._navigate(args.url);
      case 'browser_snapshot':
        return this._snapshot();
      case 'browser_click':
        return this._click(args.target);
      case 'browser_hover':
        return this._hover(args.target);
      case 'browser_focus':
        return this._focus(args.target);
      case 'browser_type':
        return this._type(args.target, args.text, args);
      case 'browser_clear':
        return this._clear(args.target);
      case 'browser_press_key':
        return this._pressKey(args.key, args.target);
      case 'browser_select_option':
        return this._selectOption(args.target, args.value);
      case 'browser_scroll':
        return this._scroll(args);
      case 'browser_wait':
        return this._wait(args.timeoutMs);
      case 'browser_set_checked':
        return this._setChecked(args.target, args.checked);
      case 'browser_list_options':
        return this._listOptions(args.target);
      case 'browser_list_links':
        return this._listLinks();
      case 'browser_find_elements':
        return this._findElements(args.query, args.limit);
      case 'browser_list_form_fields':
        return this._listFormFields(args.target);
      case 'browser_scroll_into_view':
        return this._scrollIntoView(args.target);
      case 'browser_submit_form':
        return this._submitForm(args.target);
      case 'browser_wait_for_element':
        return this._waitForElement(args.target, args.timeoutMs);
      case 'browser_read_element':
        return this._readElement(args.target);
      case 'browser_wait_for_text':
        return this._waitForText(args.text, args.timeoutMs);
      case 'browser_wait_for_navigation':
        return this._waitForNavigation(args.timeoutMs);
      case 'browser_screenshot':
        return this._screenshot(args.fileName);
      case 'browser_get_state':
        return this._getState();
      case 'browser_back':
        return this._goBack();
      case 'browser_forward':
        return this._goForward();
      case 'browser_refresh':
        return this._refresh();
      default:
        throw new Error(`Unknown built-in browser tool "${name}".`);
    }
  }

  async close() {
    await this._preview.close();
  }

  async _getWebContents() {
    return this._preview.ensureWebContents();
  }

  async _execute(script, userGesture = true) {
    const webContents = await this._getWebContents();
    return webContents.executeJavaScript(script, userGesture);
  }

  async _getTextExcerpt(limit = 1200) {
    return this._execute(`
      (() => {
        const text = String(document.body?.innerText || '').replace(/\\s+/g, ' ').trim();
        return text.slice(0, ${Number(limit)});
      })()
    `, false);
  }

  async _waitForLoadStop(webContents, timeoutMs = 30000) {
    if (!webContents.isLoading()) return;

    const timeout = normalizeTimeout(timeoutMs, 30000);

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timed out waiting for the page to load after ${timeout}ms.`));
      }, timeout);

      const cleanup = () => {
        clearTimeout(timer);
        webContents.removeListener('did-stop-loading', handleStop);
        webContents.removeListener('did-fail-load', handleFail);
        webContents.removeListener('destroyed', handleDestroyed);
      };

      const handleStop = () => {
        cleanup();
        resolve();
      };

      const handleFail = (_event, errorCode, errorDescription) => {
        cleanup();
        reject(new Error(`Page load failed (${errorCode}): ${errorDescription}`));
      };

      const handleDestroyed = () => {
        cleanup();
        reject(new Error('Browser preview was destroyed while loading.'));
      };

      webContents.once('did-stop-loading', handleStop);
      webContents.once('did-fail-load', handleFail);
      webContents.once('destroyed', handleDestroyed);
    });
  }

  async _waitForPotentialNavigation(webContents, timeoutMs = 15000) {
    const timeout = normalizeTimeout(timeoutMs, 15000);
    if (webContents.isLoading()) {
      await this._waitForLoadStop(webContents, timeout);
      return 'Navigation finished.';
    }

    await new Promise((resolve, reject) => {
      let started = false;

      const timer = setTimeout(() => {
        cleanup();
        if (started) reject(new Error(`Timed out waiting for navigation after ${timeout}ms.`));
        else resolve();
      }, timeout);

      const cleanup = () => {
        clearTimeout(timer);
        webContents.removeListener('did-start-navigation', handleStart);
        webContents.removeListener('did-navigate-in-page', handleInPage);
        webContents.removeListener('did-stop-loading', handleStop);
        webContents.removeListener('did-fail-load', handleFail);
      };

      const handleStart = () => {
        started = true;
      };

      const handleInPage = () => {
        started = true;
        cleanup();
        resolve();
      };

      const handleStop = () => {
        if (!started) return;
        cleanup();
        resolve();
      };

      const handleFail = (_event, errorCode, errorDescription) => {
        cleanup();
        reject(new Error(`Navigation failed (${errorCode}): ${errorDescription}`));
      };

      webContents.on('did-start-navigation', handleStart);
      webContents.on('did-navigate-in-page', handleInPage);
      webContents.on('did-stop-loading', handleStop);
      webContents.once('did-fail-load', handleFail);
    });

    return 'Navigation finished.';
  }

  async _navigate(url) {
    const target = normalizeUrl(url);
    this._preview.setStatus(`Navigating to ${target}`);
    const webContents = await this._preview.loadURL(target);
    const title = webContents.getTitle() || '(untitled page)';
    this._preview.setStatus(`Opened ${title}`);
    return `Opened ${target}\nTitle: ${title}`;
  }

  async _snapshot() {
    this._preview.setStatus('Scanning the current page');
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const elements = assignStableIds().map(describeElement);
        const text = normalizeText(document.body?.innerText || '').slice(0, 3000);
        const focused = document.activeElement ? describeElement(document.activeElement) : null;
        return {
          title: document.title || '(untitled page)',
          url: location.href || '(no page loaded)',
          elements,
          text,
          focused,
        };
      })()
    `, false);

    const lines = [
      `Title: ${result.title}`,
      `URL: ${result.url}`,
      '',
      'Visible interactive elements:',
      ...(result.elements.length ? result.elements.map(formatElementLine) : ['(none found)']),
    ];

    if (result.focused?.id || result.focused?.label) {
      lines.splice(2, 0, `Focused element: ${formatElementLine(result.focused)}`, '');
    }

    if (result.text) {
      lines.push('', 'Visible text excerpt:', result.text);
    }

    this._preview.clearStatus();
    return lines.join('\n');
  }

  async _click(target) {
    if (!target) throw new Error('Target is required.');

    const webContents = await this._getWebContents();
    this._preview.setStatus(`Clicking ${target}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const el = resolveTarget(${JSON.stringify(target)});
        if (!el) return { ok: false, error: 'Element not found.' };

        focusElement(el);
        el.click?.();
        return { ok: true, info: describeElement(el) };
      })()
    `);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not click the requested element.');
    await wait(250);
    try {
      await this._waitForPotentialNavigation(webContents, 1500);
    } catch (err) {
      if (!/Timed out waiting for navigation/.test(String(err?.message ?? ''))) throw err;
    }
    this._preview.clearStatus();
    return `Clicked ${formatElementLine(result.info)}`;
  }

  async _hover(target) {
    if (!target) throw new Error('Target is required.');

    this._preview.setStatus(`Hovering ${target}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const el = resolveTarget(${JSON.stringify(target)});
        if (!el) return { ok: false, error: 'Element not found.' };

        focusElement(el);
        ['pointerenter', 'mouseenter', 'pointerover', 'mouseover'].forEach(type => {
          el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
        });

        return { ok: true, info: describeElement(el) };
      })()
    `);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not hover the requested element.');
    this._preview.clearStatus();
    return `Hovered ${formatElementLine(result.info)}`;
  }

  async _focus(target) {
    if (!target) throw new Error('Target is required.');

    this._preview.setStatus(`Focusing ${target}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const el = resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true });
        if (!el) return { ok: false, error: 'Element not found.' };

        const candidate = findNearbyTextField(el) || el;
        focusElement(candidate);
        candidate.click?.();

        return { ok: true, info: describeElement(candidate) };
      })()
    `);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not focus the requested element.');
    this._preview.clearStatus();
    return `Focused ${formatElementLine(result.info)}`;
  }

  async _type(target, text, options = {}) {
    if (!target) throw new Error('Target is required.');
    if (text == null) throw new Error('Text is required.');

    const clearFirst = options.clearFirst !== false;
    const pressEnter = Boolean(options.pressEnter);
    this._preview.setStatus(`Typing into ${target}`);

    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        let el = resolveTarget(${JSON.stringify(target)}, { preferTextField: true, allowFocused: true });
        if (!el) {
          const fallback = resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true });
          if (fallback) {
            focusElement(fallback);
            fallback.click?.();
            el = findNearbyTextField(document.activeElement) || findNearbyTextField(fallback);
          }
        } else if (!isTextLike(el)) {
          focusElement(el);
          el.click?.();
          el = findNearbyTextField(document.activeElement) || findNearbyTextField(el);
        }

        if (!el) return { ok: false, error: 'Field not found.' };
        if (!isTextLike(el)) {
          return { ok: false, error: 'Target is not a text field. Try browser_focus or browser_click first, then use target "focused".' };
        }

        focusElement(el);

        const nextValue = ${clearFirst ? JSON.stringify(String(text)) : `String(el.value ?? el.textContent ?? '') + ${JSON.stringify(String(text))}`};
        setElementValue(el, nextValue);

        if (${pressEnter ? 'true' : 'false'}) {
          dispatchKeyboard(el, 'Enter');
          el.form?.requestSubmit?.();
        }

        return { ok: true, info: describeElement(el), value: nextValue };
      })()
    `);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not type into the requested field.');
    this._preview.clearStatus();
    return `Typed into ${formatElementLine(result.info)}\nValue: ${result.value}`;
  }

  async _clear(target) {
    if (!target) throw new Error('Target is required.');

    this._preview.setStatus(`Clearing ${target}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        let el = resolveTarget(${JSON.stringify(target)}, { preferTextField: true, allowFocused: true });
        if (!el) {
          const fallback = resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true });
          if (fallback) {
            focusElement(fallback);
            fallback.click?.();
            el = findNearbyTextField(document.activeElement) || findNearbyTextField(fallback);
          }
        }

        if (!el) return { ok: false, error: 'Field not found.' };
        if (!isTextLike(el)) return { ok: false, error: 'Target is not a text field.' };

        focusElement(el);
        setElementValue(el, '');

        return { ok: true, info: describeElement(el) };
      })()
    `);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not clear the requested field.');
    this._preview.clearStatus();
    return `Cleared ${formatElementLine(result.info)}`;
  }

  async _pressKey(key, target = null) {
    if (!key) throw new Error('Key is required.');

    this._preview.setStatus(`Pressing ${key}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const el = ${target ? `resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true })` : '(document.activeElement || document.body)'};
        if (!el) return { ok: false, error: 'No element is available to receive the key press.' };

        focusElement(el);
        dispatchKeyboard(el, ${JSON.stringify(String(key))});

        if (${JSON.stringify(String(key))} === 'Enter') {
          el.form?.requestSubmit?.();
        }

        return { ok: true, info: describeElement(el) };
      })()
    `);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not press the requested key.');
    this._preview.clearStatus();
    return `Pressed ${key}${result.info?.id ? ` on ${formatElementLine(result.info)}` : ''}`;
  }

  async _selectOption(target, value) {
    if (!target) throw new Error('Target is required.');
    if (value == null) throw new Error('Value is required.');

    this._preview.setStatus(`Selecting ${value}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const el = resolveTarget(${JSON.stringify(target)});
        if (!el) return { ok: false, error: 'Select element not found.' };
        const select = el instanceof HTMLSelectElement ? el : el.querySelector?.('select');
        if (!(select instanceof HTMLSelectElement)) {
          return { ok: false, error: 'Target is not a select element.' };
        }

        const requested = ${JSON.stringify(String(value))}.toLowerCase();
        const option = [...select.options].find(entry => {
          const byValue = String(entry.value || '').toLowerCase();
          const byLabel = String(entry.textContent || '').replace(/\\s+/g, ' ').trim().toLowerCase();
          return byValue === requested || byLabel === requested || byLabel.includes(requested);
        });

        if (!option) return { ok: false, error: 'Option not found.' };

        select.value = option.value;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));

        return { ok: true, info: describeElement(select), selected: option.textContent?.trim() || option.value };
      })()
    `);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not select the requested option.');
    this._preview.clearStatus();
    return `Selected "${result.selected}" in ${formatElementLine(result.info)}`;
  }

  async _scroll({ direction = 'down', amount = 600, target = null } = {}) {
    const normalizedDirection = String(direction ?? 'down').toLowerCase();
    const pixels = Number.isFinite(Number(amount)) ? Number(amount) : 600;
    this._preview.setStatus(`Scrolling ${normalizedDirection}`);

    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const scroller = ${target ? `resolveTarget(${JSON.stringify(target)}) || document.scrollingElement || document.documentElement` : 'document.scrollingElement || document.documentElement'};
        if (!scroller) return { ok: false, error: 'No scrollable target found.' };

        const isWindowScroll = scroller === document.scrollingElement || scroller === document.documentElement || scroller === document.body;
        const dx = ${normalizedDirection === 'left' ? -pixels : normalizedDirection === 'right' ? pixels : 0};
        const dy = ${normalizedDirection === 'up' ? -pixels : normalizedDirection === 'down' ? pixels : 0};

        if (${JSON.stringify(normalizedDirection)} === 'top') {
          if (isWindowScroll) window.scrollTo({ top: 0, behavior: 'instant' });
          else scroller.scrollTop = 0;
        } else if (${JSON.stringify(normalizedDirection)} === 'bottom') {
          if (isWindowScroll) window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
          else scroller.scrollTop = scroller.scrollHeight;
        } else if (isWindowScroll) {
          window.scrollBy({ left: dx, top: dy, behavior: 'instant' });
        } else {
          scroller.scrollBy({ left: dx, top: dy, behavior: 'instant' });
        }

        return {
          ok: true,
          top: isWindowScroll ? (window.scrollY || document.documentElement.scrollTop || 0) : scroller.scrollTop,
          left: isWindowScroll ? (window.scrollX || document.documentElement.scrollLeft || 0) : scroller.scrollLeft,
        };
      })()
    `, false);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not scroll the page.');
    this._preview.clearStatus();
    return `Scrolled ${normalizedDirection}.\nScroll position: top=${Math.round(result.top)}, left=${Math.round(result.left)}`;
  }

  async _wait(timeoutMs = 1000) {
    const timeout = normalizeTimeout(timeoutMs, 1000);
    this._preview.setStatus(`Waiting ${timeout}ms`);
    await wait(timeout);
    this._preview.clearStatus();
    return `Waited ${timeout}ms.`;
  }

  async _setChecked(target, checked) {
    if (!target) throw new Error('Target is required.');
    if (typeof checked !== 'boolean') throw new Error('Checked must be true or false.');

    this._preview.setStatus(`${checked ? 'Checking' : 'Unchecking'} ${target}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const el = resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true });
        if (!el) return { ok: false, error: 'Control not found.' };

        const control = el.matches?.('input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="switch"]')
          ? el
          : findInteractiveDescendant(el, false);

        if (!control) return { ok: false, error: 'Control not found.' };

        const getChecked = node => {
          if (node instanceof HTMLInputElement) return Boolean(node.checked);
          const ariaChecked = node.getAttribute?.('aria-checked');
          if (ariaChecked === 'true') return true;
          if (ariaChecked === 'false') return false;
          return null;
        };

        const before = getChecked(control);
        if (before == null) return { ok: false, error: 'Target is not a checkbox or switch-like control.' };

        if (before !== ${checked ? 'true' : 'false'}) {
          focusElement(control);
          control.click?.();
        }

        const after = getChecked(control);
        return { ok: true, info: describeElement(control), checked: Boolean(after) };
      })()
    `);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not update the requested control.');
    this._preview.clearStatus();
    return `${result.checked ? 'Checked' : 'Unchecked'} ${formatElementLine(result.info)}`;
  }

  async _listOptions(target) {
    if (!target) throw new Error('Target is required.');

    this._preview.setStatus(`Listing options for ${target}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const el = resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true });
        if (!el) return { ok: false, error: 'Control not found.' };

        const select = el instanceof HTMLSelectElement ? el : el.querySelector?.('select');
        if (select instanceof HTMLSelectElement) {
          return {
            ok: true,
            info: describeElement(select),
            options: [...select.options].map((option, index) => ({
              index: index + 1,
              label: normalizeText(option.textContent || option.label || option.value),
              value: String(option.value || ''),
              selected: option.selected,
            })),
          };
        }

        const listboxId = el.getAttribute?.('aria-controls');
        const listbox = listboxId ? document.getElementById(listboxId) : el.closest?.('[role="listbox"]') || document.querySelector('[role="listbox"]');
        const options = [...(listbox?.querySelectorAll?.('[role="option"]') || [])]
          .filter(isVisible)
          .map((option, index) => ({
            index: index + 1,
            label: getNodeText(option),
            value: String(option.getAttribute?.('data-value') || option.getAttribute?.('value') || ''),
            selected: option.getAttribute?.('aria-selected') === 'true',
          }));

        if (!options.length) return { ok: false, error: 'No visible options were found for that control.' };

        return {
          ok: true,
          info: describeElement(el),
          options,
        };
      })()
    `, false);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not list options for the requested control.');
    this._preview.clearStatus();

    return [
      `Options for ${formatElementLine(result.info)}:`,
      ...(result.options.length
        ? result.options.map(option => `${option.selected ? '*' : '-'} [${option.index}] ${option.label}${option.value ? ` (value: ${option.value})` : ''}`)
        : ['(none found)']),
    ].join('\n');
  }

  async _listLinks() {
    this._preview.setStatus('Listing visible actions');
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const selectors = ['a[href]', 'button', '[role="link"]', '[role="button"]'];
        const elements = [...document.querySelectorAll(selectors.join(','))]
          .filter(isVisible)
          .filter((el, index, arr) => arr.indexOf(el) === index)
          .slice(0, 120);

        elements.forEach((el, index) => {
          if (!el.dataset.owMcpId) el.dataset.owMcpId = 'ow-' + String(index + 1);
        });

        return elements.map(el => ({
          ...describeElement(el),
          href: el instanceof HTMLAnchorElement ? (el.href || '') : '',
        }));
      })()
    `, false);

    this._preview.clearStatus();

    return [
      'Visible links and actions:',
      ...(result.length
        ? result.map(entry => `${formatElementLine(entry)}${entry.href ? ` -> ${entry.href}` : ''}`)
        : ['(none found)']),
    ].join('\n');
  }

  async _findElements(query, limit = 10) {
    if (!query) throw new Error('Query is required.');

    const maxResults = Math.max(1, Math.min(20, Number.isFinite(Number(limit)) ? Number(limit) : 10));
    this._preview.setStatus(`Finding ${query}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const requested = normalizeText(${JSON.stringify(String(query))});
        const lowered = requested.toLowerCase();
        const selectorMatches = [];

        try {
          document.querySelectorAll(requested).forEach(node => {
            const candidate = findInteractiveDescendant(node, false) || node;
            if (candidate && isVisible(candidate)) selectorMatches.push(candidate);
          });
        } catch { /* ignore invalid selectors */ }

        const matches = (selectorMatches.length ? selectorMatches : assignStableIds().filter(candidate => {
          const values = [
            candidate.dataset.owMcpId,
            getElementLabel(candidate),
            getNodeText(candidate),
            candidate.placeholder,
            candidate.getAttribute?.('aria-label'),
            candidate.getAttribute?.('title'),
            candidate.name,
            candidate.id,
            candidate.getAttribute?.('role'),
            candidate.tagName,
          ]
            .map(value => normalizeText(value).toLowerCase())
            .filter(Boolean);

          return values.some(value => value === lowered || value.includes(lowered));
        }))
          .map(node => node.tagName === 'LABEL' && node.control ? node.control : node)
          .filter((node, index, arr) => node && arr.indexOf(node) === index)
          .slice(0, ${maxResults});

        matches.forEach((node, index) => {
          if (!node.dataset.owMcpId) node.dataset.owMcpId = 'ow-' + String(index + 1);
        });

        return matches.map(node => ({
          ...describeElement(node),
          text: getNodeText(node),
          href: node instanceof HTMLAnchorElement ? (node.href || '') : '',
          disabled: Boolean(node.disabled),
        }));
      })()
    `, false);

    this._preview.clearStatus();

    return [
      `Matches for "${query}":`,
      ...(result.length
        ? result.map(entry => `${formatElementLine(entry)}${entry.href ? ` -> ${entry.href}` : ''}${entry.disabled ? ' [disabled]' : ''}${entry.text ? ` | ${entry.text}` : ''}`)
        : ['(none found)']),
    ].join('\n');
  }

  async _listFormFields(target = null) {
    this._preview.setStatus(target ? `Listing fields in ${target}` : 'Listing visible form fields');
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const root = ${target ? `resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true }) || document` : 'document'};
        const fields = collectVisibleFields(root);

        fields.forEach((field, index) => {
          if (!field.dataset.owMcpId) field.dataset.owMcpId = 'ow-' + String(index + 1);
        });

        return fields.map(field => {
          const selectedText = field instanceof HTMLSelectElement
            ? normalizeText(field.options?.[field.selectedIndex]?.textContent || field.value || '')
            : '';
          const value = field instanceof HTMLSelectElement
            ? selectedText
            : normalizeText(field.value ?? (field.isContentEditable ? field.textContent : ''));

          return {
            ...describeElement(field),
            placeholder: normalizeText(field.placeholder || ''),
            value,
            checked: typeof field.checked === 'boolean' ? field.checked : null,
            required: Boolean(field.required || field.getAttribute?.('aria-required') === 'true'),
            disabled: Boolean(field.disabled || field.getAttribute?.('aria-disabled') === 'true'),
          };
        });
      })()
    `, false);

    this._preview.clearStatus();

    return [
      target ? `Visible form fields within "${target}":` : 'Visible form fields:',
      ...(result.length
        ? result.map(field => {
          const details = [
            field.placeholder ? `placeholder: ${field.placeholder}` : '',
            field.value ? `value: ${field.value}` : '',
            field.checked == null ? '' : `checked: ${field.checked ? 'yes' : 'no'}`,
            field.required ? 'required' : '',
            field.disabled ? 'disabled' : '',
          ].filter(Boolean).join(', ');

          return `${formatElementLine(field)}${details ? ` | ${details}` : ''}`;
        })
        : ['(none found)']),
    ].join('\n');
  }

  async _scrollIntoView(target) {
    if (!target) throw new Error('Target is required.');

    this._preview.setStatus(`Scrolling to ${target}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const el = resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true });
        if (!el) return { ok: false, error: 'Element not found.' };

        el.scrollIntoView?.({ block: 'center', inline: 'center', behavior: 'instant' });
        return { ok: true, info: describeElement(el) };
      })()
    `, false);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not scroll the requested element into view.');
    this._preview.clearStatus();
    return `Scrolled to ${formatElementLine(result.info)}`;
  }

  async _submitForm(target = null) {
    const webContents = await this._getWebContents();
    this._preview.setStatus(target ? `Submitting ${target}` : 'Submitting the current form');
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const targetNode = ${target
    ? `resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true })`
    : '(document.activeElement || null)'};

        if (!targetNode) return { ok: false, error: 'No form target is available.' };

        const form = targetNode.form || targetNode.closest?.('form');
        const submitSelector = 'button[type="submit"], input[type="submit"], [role="button"][aria-label*="submit" i], [role="button"][aria-label*="continue" i]';

        if (form) {
          const submitter = form.querySelector(submitSelector);
          if (submitter) {
            focusElement(submitter);
            submitter.click?.();
            return { ok: true, mode: 'click', info: describeElement(submitter) };
          }

          if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
            return { ok: true, mode: 'submit', info: describeElement(targetNode) };
          }
        }

        if (targetNode.matches?.('button, input[type="submit"], [role="button"]')) {
          focusElement(targetNode);
          targetNode.click?.();
          return { ok: true, mode: 'click', info: describeElement(targetNode) };
        }

        focusElement(targetNode);
        dispatchKeyboard(targetNode, 'Enter');
        targetNode.form?.requestSubmit?.();
        return { ok: true, mode: 'enter', info: describeElement(targetNode) };
      })()
    `);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not submit the requested form.');
    await wait(250);
    try {
      await this._waitForPotentialNavigation(webContents, 1500);
    } catch (err) {
      if (!/Timed out waiting for navigation/.test(String(err?.message ?? ''))) throw err;
    }
    this._preview.clearStatus();
    return `Submitted via ${result.mode}: ${formatElementLine(result.info)}`;
  }

  async _waitForElement(target, timeoutMs = 15000) {
    if (!target) throw new Error('Target is required.');

    const timeout = normalizeTimeout(timeoutMs, 15000);
    const deadline = Date.now() + timeout;
    this._preview.setStatus(`Waiting for ${target}`);

    while (Date.now() < deadline) {
      const result = await this._execute(`
        (() => {
          ${PAGE_HELPERS}
          const el = resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true });
          if (!el || !isVisible(el)) return { ok: false };
          return { ok: true, info: describeElement(el) };
        })()
      `, false);

      if (result?.ok) {
        this._preview.clearStatus();
        return `Element is visible: ${formatElementLine(result.info)}`;
      }

      await wait(250);
    }

    throw new Error(`Timed out waiting for "${target}" after ${timeout}ms.`);
  }

  async _readElement(target) {
    if (!target) throw new Error('Target is required.');

    this._preview.setStatus(`Reading ${target}`);
    const result = await this._execute(`
      (() => {
        ${PAGE_HELPERS}
        const el = resolveTarget(${JSON.stringify(target)}, { preferTextField: false, allowFocused: true });
        if (!el) return { ok: false, error: 'Element not found.' };

        const info = describeElement(el);
        const value = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement
          ? String(el.value ?? '')
          : (el.isContentEditable ? String(el.textContent ?? '') : '');
        const selectedText = el instanceof HTMLSelectElement
          ? String(el.options?.[el.selectedIndex]?.textContent ?? '').trim()
          : '';

        return {
          ok: true,
          info,
          text: getNodeText(el),
          value: normalizeText(value),
          checked: typeof el.checked === 'boolean' ? el.checked : null,
          disabled: Boolean(el.disabled),
          selectedText,
        };
      })()
    `, false);

    if (!result?.ok) throw new Error(result?.error ?? 'Could not read the requested element.');
    this._preview.clearStatus();

    return [
      `Element: ${formatElementLine(result.info)}`,
      result.text ? `Visible text: ${result.text}` : '',
      result.value ? `Value: ${result.value}` : '',
      result.selectedText ? `Selected option: ${result.selectedText}` : '',
      result.checked == null ? '' : `Checked: ${result.checked ? 'yes' : 'no'}`,
      `Disabled: ${result.disabled ? 'yes' : 'no'}`,
    ].filter(Boolean).join('\n');
  }

  async _waitForText(text, timeoutMs = 15000) {
    if (!text) throw new Error('Text is required.');

    const timeout = normalizeTimeout(timeoutMs, 15000);
    const deadline = Date.now() + timeout;
    const target = String(text).toLowerCase();
    this._preview.setStatus(`Waiting for "${text}"`);

    while (Date.now() < deadline) {
      const content = await this._execute(`(() => String(document.body?.innerText || '').replace(/\\s+/g, ' ').trim())()`, false);
      if (String(content).toLowerCase().includes(target)) {
        this._preview.clearStatus();
        return `Text found on the page: ${text}`;
      }
      await wait(300);
    }

    throw new Error(`Timed out waiting for "${text}" after ${timeout}ms.`);
  }

  async _waitForNavigation(timeoutMs = 15000) {
    const webContents = await this._getWebContents();
    const timeout = normalizeTimeout(timeoutMs, 15000);
    this._preview.setStatus('Waiting for navigation');
    const result = await this._waitForPotentialNavigation(webContents, timeout);
    this._preview.clearStatus();
    return result;
  }

  async _screenshot(fileName) {
    const webContents = await this._getWebContents();
    this._preview.setStatus('Capturing screenshot');
    const image = await webContents.capturePage();

    const safeName = String(fileName ?? '').trim().replace(/[<>:"/\\|?*]+/g, '-');
    const finalName = safeName ? (safeName.endsWith('.png') ? safeName : `${safeName}.png`) : `evelina-browser-${Date.now()}.png`;
    const screenshotPath = path.join(app.getPath('temp'), finalName);

    fs.writeFileSync(screenshotPath, image.toPNG());
    this._preview.clearStatus();
    return `Saved a browser screenshot to ${screenshotPath}`;
  }

  async _getState() {
    const webContents = await this._getWebContents();
    const url = webContents.getURL() || '(no page loaded)';
    const title = webContents.getTitle() || '(untitled page)';
    const excerpt = await this._getTextExcerpt();

    return [
      `Title: ${title}`,
      `URL: ${url}`,
      `Loading: ${webContents.isLoading() ? 'yes' : 'no'}`,
      excerpt ? `Visible text: ${excerpt}` : '',
    ].filter(Boolean).join('\n');
  }

  async _goBack() {
    const webContents = await this._getWebContents();
    if (!webContents.navigationHistory?.canGoBack?.()) {
      return 'No previous page is available in the built-in browser session.';
    }

    this._preview.setStatus('Going back');
    webContents.goBack();
    await this._waitForPotentialNavigation(webContents, 15000);
    this._preview.clearStatus();
    return 'Navigated back to the previous page.';
  }

  async _goForward() {
    const webContents = await this._getWebContents();
    if (!webContents.navigationHistory?.canGoForward?.()) {
      return 'No forward page is available in the built-in browser session.';
    }

    this._preview.setStatus('Going forward');
    webContents.goForward();
    await this._waitForPotentialNavigation(webContents, 15000);
    this._preview.clearStatus();
    return 'Navigated forward to the next page.';
  }

  async _refresh() {
    const webContents = await this._getWebContents();
    this._preview.setStatus('Refreshing page');
    webContents.reload();
    await this._waitForLoadStop(webContents, 20000);
    this._preview.clearStatus();
    return 'Refreshed the current page.';
  }
}

let _browserServer = null;

export function getBuiltinBrowserServer() {
  if (!_browserServer) _browserServer = new BrowserMCPServer();
  return _browserServer;
}
