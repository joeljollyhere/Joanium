import http from 'http';
import { shell } from 'electron';

/* ══════════════════════════════════════════
   CONFIG
══════════════════════════════════════════ */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL       = 'https://oauth2.googleapis.com/token';
const USERINFO_URL    = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GMAIL_BASE      = 'https://gmail.googleapis.com/gmail/v1/users/me';

const CALLBACK_PORT = 42813;
const REDIRECT_URI  = `http://localhost:${CALLBACK_PORT}/oauth/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

/* ══════════════════════════════════════════
   OAUTH FLOW
══════════════════════════════════════════ */
export function startGmailOAuthFlow(clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    let settled = false;

    function settle(fn) {
      if (settled) return;
      settled = true;
      fn();
    }

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
        if (url.pathname !== '/oauth/callback') return res.end();

        const code  = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h2>${error ? '❌ Failed' : '✅ Connected'}</h2>`);

        server.close();

        if (error || !code) {
          return settle(() => reject(new Error(error || 'No code')));
        }

        const tokens = await exchangeCode(code, clientId, clientSecret);
        settle(() => resolve(tokens));
      } catch (err) {
        server.close();
        settle(() => reject(err));
      }
    });

    server.listen(CALLBACK_PORT, 'localhost', () => {
      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set('client_id',     clientId);
      authUrl.searchParams.set('redirect_uri',  REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope',         SCOPES);
      authUrl.searchParams.set('access_type',   'offline');
      authUrl.searchParams.set('prompt',        'consent');

      shell.openExternal(authUrl.toString());
    });
  });
}

async function exchangeCode(code, clientId, clientSecret) {
  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
    }),
  });

  const data = await res.json();

  const profileRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const profile = await profileRes.json();

  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiry:  Date.now() + (data.expires_in ?? 3600) * 1000,
    email:        profile.email,
    clientId,
    clientSecret,
  };
}

/* ══════════════════════════════════════════
   TOKEN REFRESH
══════════════════════════════════════════ */

let _connectorEngine = null;
export function setConnectorEngine(engine) { _connectorEngine = engine; }

async function getFreshCreds(creds) {
  const bufferMs = 2 * 60 * 1000;
  const isExpired = !creds.tokenExpiry || Date.now() > (creds.tokenExpiry - bufferMs);

  if (!isExpired) return creds;

  if (!creds.refreshToken) {
    throw new Error('Gmail token expired and no refresh token available. Please reconnect Gmail in Settings → Connectors.');
  }

  console.warn('[Gmail] Access token expired - refreshing...');

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type:    'refresh_token',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${err.error_description ?? err.error ?? res.status}. Please reconnect Gmail.`);
  }

  const data = await res.json();

  const updated = {
    ...creds,
    accessToken:  data.access_token,
    tokenExpiry:  Date.now() + (data.expires_in ?? 3600) * 1000,
    ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
  };

  _connectorEngine?.updateCredentials('gmail', {
    accessToken:  updated.accessToken,
    tokenExpiry:  updated.tokenExpiry,
    ...(data.refresh_token ? { refreshToken: updated.refreshToken } : {}),
  });

  console.info('[Gmail] Token refreshed successfully.');
  return updated;
}

/* ══════════════════════════════════════════
   INTERNAL FETCH HELPER
══════════════════════════════════════════ */
async function gmailFetch(creds, url, options = {}) {
  const fresh = await getFreshCreds(creds);

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${fresh.accessToken}`,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Gmail API error (${res.status}): ${body.error?.message ?? JSON.stringify(body)}`);
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

/* ── Shared header parser ─────────────────── */
function parseHeaders(headers = []) {
  const get = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
  return { subject: get('Subject'), from: get('From'), to: get('To'), date: get('Date'), messageId: get('Message-ID') };
}

/* ══════════════════════════════════════════
   VALIDATE
══════════════════════════════════════════ */
export async function validateCredentials(creds) {
  const data = await gmailFetch(creds, `${GMAIL_BASE}/profile`);
  return data.emailAddress;
}

/* ══════════════════════════════════════════
   GET UNREAD EMAILS
══════════════════════════════════════════ */
export async function getUnreadEmails(creds, maxResults = 10) {
  const list = await gmailFetch(
    creds,
    `${GMAIL_BASE}/messages?q=is:unread&maxResults=${maxResults}`
  );

  const messages = list.messages || [];
  const emails   = [];

  for (const msg of messages) {
    const detail  = await gmailFetch(creds, `${GMAIL_BASE}/messages/${msg.id}`);
    const h = parseHeaders(detail.payload.headers);
    emails.push({ id: msg.id, threadId: detail.threadId, ...h, snippet: detail.snippet });
  }

  return emails;
}

/* ══════════════════════════════════════════
   EMAIL BRIEF
══════════════════════════════════════════ */
export async function getEmailBrief(creds, maxResults = 10) {
  const emails = await getUnreadEmails(creds, maxResults);
  if (!emails.length) return { count: 0, text: '' };
  const text = emails.map((e, i) =>
    `${i + 1}. ${e.subject} — ${e.from}\n${e.snippet}`
  ).join('\n\n');
  return { count: emails.length, text };
}

/* ══════════════════════════════════════════
   SEARCH EMAILS
══════════════════════════════════════════ */
export async function searchEmails(creds, query, maxResults = 10) {
  const list = await gmailFetch(
    creds,
    `${GMAIL_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
  );

  const messages = list.messages || [];
  const emails   = [];

  for (const msg of messages) {
    const detail = await gmailFetch(creds, `${GMAIL_BASE}/messages/${msg.id}`);
    const h = parseHeaders(detail.payload.headers);
    emails.push({ id: msg.id, threadId: detail.threadId, ...h, snippet: detail.snippet });
  }

  return emails;
}

/* ══════════════════════════════════════════
   SEND EMAIL
══════════════════════════════════════════ */
export async function sendEmail(creds, to, subject, body, cc = '', bcc = '') {
  const fresh = await getFreshCreds(creds);

  const message = [
    `To: ${to}`,
    ...(cc  ? [`Cc: ${cc}`]   : []),
    ...(bcc ? [`Bcc: ${bcc}`] : []),
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n');

  const raw = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`${GMAIL_BASE}/messages/send`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${fresh.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to send email: ${err.error?.message ?? res.status}`);
  }

  return true;
}

export async function replyToEmail(creds, messageId, replyBody) {
  const fresh  = await getFreshCreds(creds);
  const detail = await gmailFetch(creds, `${GMAIL_BASE}/messages/${messageId}?format=full`);
  const h      = parseHeaders(detail.payload.headers);

  const replyTo = h.from || '';
  const subject = h.subject.startsWith('Re:') ? h.subject : `Re: ${h.subject}`;
  const refs    = h.messageId;

  const message = [
    `To: ${replyTo}`,
    `Subject: ${subject}`,
    `In-Reply-To: ${refs}`,
    `References: ${refs}`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    '',
    replyBody,
  ].join('\r\n');

  const raw = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`${GMAIL_BASE}/messages/send`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${fresh.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw, threadId: detail.threadId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to send reply: ${err.error?.message ?? res.status}`);
  }

  return true;
}

export async function forwardEmail(creds, messageId, forwardTo, extraNote = '') {
  const fresh  = await getFreshCreds(creds);
  const detail = await gmailFetch(creds, `${GMAIL_BASE}/messages/${messageId}?format=full`);
  const h      = parseHeaders(detail.payload.headers);

  let originalBody = '';
  const walk = (parts = []) => {
    for (const p of parts) {
      if (p.mimeType === 'text/plain' && p.body?.data) {
        originalBody = Buffer.from(p.body.data, 'base64').toString('utf-8');
        return;
      }
      if (p.parts) walk(p.parts);
    }
  };
  if (detail.payload.body?.data) {
    originalBody = Buffer.from(detail.payload.body.data, 'base64').toString('utf-8');
  } else {
    walk(detail.payload.parts ?? []);
  }

  const fwdBody = [
    ...(extraNote ? [extraNote, ''] : []),
    `---------- Forwarded message ----------`,
    `From: ${h.from}`,
    `Date: ${h.date}`,
    `Subject: ${h.subject}`,
    `To: ${h.to}`,
    '',
    originalBody,
  ].join('\n');

  const subject = h.subject.startsWith('Fwd:') ? h.subject : `Fwd: ${h.subject}`;

  const message = [
    `To: ${forwardTo}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    '',
    fwdBody,
  ].join('\r\n');

  const raw = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`${GMAIL_BASE}/messages/send`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${fresh.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to forward email: ${err.error?.message ?? res.status}`);
  }

  return true;
}

export async function modifyMessage(creds, messageId, { addLabels = [], removeLabels = [] }) {
  return gmailFetch(creds, `${GMAIL_BASE}/messages/${messageId}/modify`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ addLabelIds: addLabels, removeLabelIds: removeLabels }),
  });
}

export async function markAsRead(creds, messageId) {
  return modifyMessage(creds, messageId, { removeLabels: ['UNREAD'] });
}

export async function markAsUnread(creds, messageId) {
  return modifyMessage(creds, messageId, { addLabels: ['UNREAD'] });
}

export async function archiveMessage(creds, messageId) {
  return modifyMessage(creds, messageId, { removeLabels: ['INBOX'] });
}

export async function trashMessage(creds, messageId) {
  return gmailFetch(creds, `${GMAIL_BASE}/messages/${messageId}/trash`, {
    method: 'POST',
  });
}

export async function untrashMessage(creds, messageId) {
  return gmailFetch(creds, `${GMAIL_BASE}/messages/${messageId}/untrash`, {
    method: 'POST',
  });
}

export async function markAllRead(creds) {
  const list = await gmailFetch(
    creds,
    `${GMAIL_BASE}/messages?q=is:unread&maxResults=500`
  );
  const messages = list.messages ?? [];
  if (!messages.length) return 0;

  await gmailFetch(creds, `${GMAIL_BASE}/messages/batchModify`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      ids:            messages.map(m => m.id),
      removeLabelIds: ['UNREAD'],
    }),
  });

  return messages.length;
}

export async function archiveReadEmails(creds, maxResults = 100) {
  const list = await gmailFetch(
    creds,
    `${GMAIL_BASE}/messages?q=in:inbox -is:unread&maxResults=${maxResults}`
  );
  const messages = list.messages ?? [];
  if (!messages.length) return 0;

  await gmailFetch(creds, `${GMAIL_BASE}/messages/batchModify`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      ids:            messages.map(m => m.id),
      removeLabelIds: ['INBOX'],
    }),
  });

  return messages.length;
}

export async function trashEmailsByQuery(creds, query, maxResults = 50) {
  const list = await gmailFetch(
    creds,
    `${GMAIL_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
  );
  const messages = list.messages ?? [];
  if (!messages.length) return 0;

  await gmailFetch(creds, `${GMAIL_BASE}/messages/batchModify`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      ids:         messages.map(m => m.id),
      addLabelIds: ['TRASH'],
    }),
  });

  return messages.length;
}

export async function listLabels(creds) {
  const data = await gmailFetch(creds, `${GMAIL_BASE}/labels`);
  return data.labels ?? [];
}

export async function createLabel(creds, name, { textColor = '#ffffff', backgroundColor = '#16a766' } = {}) {
  return gmailFetch(creds, `${GMAIL_BASE}/labels`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      name,
      labelListVisibility:    'labelShow',
      messageListVisibility:  'show',
      color: { textColor, backgroundColor },
    }),
  });
}

export async function getLabelId(creds, labelName) {
  const labels = await listLabels(creds);
  return labels.find(l => l.name.toLowerCase() === labelName.toLowerCase())?.id ?? null;
}

export async function createDraft(creds, to, subject, body, cc = '') {
  const fresh = await getFreshCreds(creds);

  const message = [
    `To: ${to}`,
    ...(cc ? [`Cc: ${cc}`] : []),
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n');

  const raw = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`${GMAIL_BASE}/drafts`, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${fresh.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw } }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to create draft: ${err.error?.message ?? res.status}`);
  }

  return res.json();
}

export async function getInboxStats(creds) {
  const [profile, unreadList, inboxList] = await Promise.all([
    gmailFetch(creds, `${GMAIL_BASE}/profile`),
    gmailFetch(creds, `${GMAIL_BASE}/messages?q=is:unread&maxResults=1`),
    gmailFetch(creds, `${GMAIL_BASE}/messages?q=in:inbox&maxResults=1`),
  ]);

  return {
    email:         profile.emailAddress,
    totalMessages: profile.messagesTotal,
    totalThreads:  profile.threadsTotal,
    unreadEstimate: unreadList.resultSizeEstimate ?? 0,
    inboxEstimate:  inboxList.resultSizeEstimate ?? 0,
  };
}
