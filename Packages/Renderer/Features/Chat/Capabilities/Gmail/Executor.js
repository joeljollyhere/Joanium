const HANDLED = new Set([
    'gmail_send_email', 'gmail_read_inbox', 'gmail_search_emails',
    'gmail_reply', 'gmail_forward', 'gmail_create_draft',
    'gmail_mark_as_read', 'gmail_mark_as_unread', 'gmail_archive_message',
    'gmail_trash_message', 'gmail_get_inbox_stats', 'gmail_list_labels',
    'gmail_mark_all_read',
    'gmail_send_with_cc', 'gmail_get_unread_emails', 'gmail_archive_read_emails',
    'gmail_trash_by_query', 'gmail_create_label', 'gmail_add_label',
    'gmail_remove_label', 'gmail_get_label_id', 'gmail_get_sent_emails',
    'gmail_get_starred_emails',
]);

export function handles(toolName) { return HANDLED.has(toolName); }

export async function execute(toolName, params, onStage = () => { }) {
    switch (toolName) {

        case 'gmail_send_email': {
            const { to, subject, body } = params;
            if (!to || !subject || !body) throw new Error('Missing required params: to, subject, body');
            onStage(`[GMAIL] Sending email to ${to}…`);
            const res = await window.electronAPI?.gmailSend?.(to, subject, body);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to send email');
            return `Email sent successfully to ${to} with subject "${subject}".`;
        }

        case 'gmail_read_inbox': {
            const maxResults = params.maxResults ?? 15;
            onStage(`[GMAIL] Connecting to Gmail…`);
            onStage(`[GMAIL] Fetching unread emails…`);
            const res = await window.electronAPI?.gmailGetBrief?.(maxResults);
            if (!res?.ok) throw new Error(res?.error ?? 'Gmail not connected');
            onStage(`[GMAIL] Reading ${res.count} email${res.count !== 1 ? 's' : ''}…`);
            if (res.count === 0) return 'Inbox is empty — no unread emails.';
            return `Found ${res.count} unread email(s):\n\n${res.text}`;
        }

        case 'gmail_search_emails': {
            const { query, maxResults = 10 } = params;
            if (!query) throw new Error('Missing required param: query');
            onStage(`[GMAIL] Searching for "${query}"…`);
            const res = await window.electronAPI?.gmailSearch?.(query, maxResults);
            if (!res?.ok) throw new Error(res?.error ?? 'Gmail error');
            if (!res.emails?.length) return `No emails found matching "${query}".`;
            const lines = res.emails.map((e, i) =>
                `${i + 1}. Subject: "${e.subject}" | From: ${e.from}\n   ID: ${e.id}\n   Preview: ${e.snippet}`
            ).join('\n\n');
            return `Found ${res.emails.length} email(s) matching "${query}":\n\n${lines}`;
        }

        case 'gmail_reply': {
            const { messageId, body } = params;
            if (!messageId || !body) throw new Error('Missing required params: messageId, body');
            onStage(`[GMAIL] Replying to message ${messageId}…`);
            const res = await window.electronAPI?.gmailReply?.(messageId, body);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to send reply');
            return `✅ Reply sent successfully for message ${messageId}.`;
        }

        case 'gmail_forward': {
            const { messageId, to, note = '' } = params;
            if (!messageId || !to) throw new Error('Missing required params: messageId, to');
            onStage(`[GMAIL] Forwarding message ${messageId} to ${to}…`);
            const res = await window.electronAPI?.gmailForward?.(messageId, to, note);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to forward email');
            return `✅ Email forwarded to ${to} successfully.`;
        }

        case 'gmail_create_draft': {
            const { to, subject, body, cc = '' } = params;
            if (!to || !subject || !body) throw new Error('Missing required params: to, subject, body');
            onStage(`[GMAIL] Saving draft to ${to}…`);
            const res = await window.electronAPI?.gmailCreateDraft?.(to, subject, body, cc);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to create draft');
            const draft = res.draft;
            return [
                `✅ Draft saved`,
                `To: ${to}`,
                `Subject: "${subject}"`,
                cc ? `CC: ${cc}` : '',
                draft?.id ? `Draft ID: ${draft.id}` : '',
            ].filter(Boolean).join('\n');
        }

        case 'gmail_mark_as_read': {
            const { messageId } = params;
            if (!messageId) throw new Error('Missing required param: messageId');
            onStage(`[GMAIL] Marking message as read…`);
            const res = await window.electronAPI?.gmailMarkAsRead?.(messageId);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to mark as read');
            return `✅ Message ${messageId} marked as read.`;
        }

        case 'gmail_mark_as_unread': {
            const { messageId } = params;
            if (!messageId) throw new Error('Missing required param: messageId');
            onStage(`[GMAIL] Marking message as unread…`);
            const res = await window.electronAPI?.gmailMarkAsUnread?.(messageId);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to mark as unread');
            return `✅ Message ${messageId} marked as unread.`;
        }

        case 'gmail_archive_message': {
            const { messageId } = params;
            if (!messageId) throw new Error('Missing required param: messageId');
            onStage(`[GMAIL] Archiving message ${messageId}…`);
            const res = await window.electronAPI?.gmailArchiveMessage?.(messageId);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to archive message');
            return `✅ Message ${messageId} archived and removed from inbox.`;
        }

        case 'gmail_trash_message': {
            const { messageId } = params;
            if (!messageId) throw new Error('Missing required param: messageId');
            onStage(`[GMAIL] Moving message ${messageId} to trash…`);
            const res = await window.electronAPI?.gmailTrashMessage?.(messageId);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to trash message');
            return `✅ Message ${messageId} moved to trash.`;
        }

        case 'gmail_get_inbox_stats': {
            onStage(`[GMAIL] Fetching inbox stats…`);
            const res = await window.electronAPI?.gmailInboxStats?.();
            if (!res?.ok) throw new Error(res?.error ?? 'Gmail not connected');
            const stats = res.stats ?? {};
            const lines = [
                `📬 Gmail Inbox Overview`,
                ``,
                stats.unread != null ? `Unread: ${stats.unread}` : '',
                stats.total != null ? `Total messages: ${stats.total}` : '',
                stats.threads != null ? `Threads: ${stats.threads}` : '',
                stats.unreadThreads != null ? `Unread threads: ${stats.unreadThreads}` : '',
            ].filter(Boolean);
            if (stats.labels?.length) {
                lines.push(``, `Label breakdown:`);
                stats.labels.slice(0, 10).forEach(label => {
                    const name = label.name ?? label.id ?? 'Unknown';
                    const unread = label.messagesUnread != null ? ` (${label.messagesUnread} unread)` : '';
                    lines.push(`  • ${name}${unread}`);
                });
            }
            return lines.join('\n');
        }

        case 'gmail_list_labels': {
            onStage(`[GMAIL] Fetching labels…`);
            const res = await window.electronAPI?.gmailListLabels?.();
            if (!res?.ok) throw new Error(res?.error ?? 'Gmail not connected');
            const labels = res.labels ?? [];
            if (!labels.length) return 'No labels found in this Gmail account.';
            const system = labels.filter(l => l.type === 'system');
            const custom = labels.filter(l => l.type !== 'system');
            const lines = [`📋 Gmail Labels (${labels.length} total)`, ``];
            if (system.length) {
                lines.push(`**System labels (${system.length}):**`);
                system.forEach(l => lines.push(`  • ${l.name ?? l.id}`));
            }
            if (custom.length) {
                lines.push(``, `**Custom labels (${custom.length}):**`);
                custom.forEach(l => lines.push(`  • ${l.name ?? l.id}`));
            }
            return lines.join('\n');
        }

        case 'gmail_mark_all_read': {
            onStage(`[GMAIL] Marking all emails as read…`);
            const res = await window.electronAPI?.gmailMarkAllRead?.();
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to mark all as read');
            const count = res.count ?? 0;
            return count > 0
                ? `✅ Marked ${count} email${count !== 1 ? 's' : ''} as read.`
                : '✅ No unread emails to mark — inbox is already clean.';
        }

        case 'gmail_send_with_cc': {
            const { to, subject, body, cc = '', bcc = '' } = params;
            if (!to || !subject || !body) throw new Error('Missing required params: to, subject, body');
            onStage(`[GMAIL] Sending email to ${to}${cc ? ` (CC: ${cc})` : ''}…`);
            const res = await window.electronAPI?.gmailSend?.(to, subject, body, cc, bcc);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to send email');
            return [
                `✅ Email sent to ${to}`,
                cc ? `CC: ${cc}` : '',
                bcc ? `BCC: ${bcc}` : '',
                `Subject: "${subject}"`,
            ].filter(Boolean).join('\n');
        }

        case 'gmail_get_unread_emails': {
            const { maxResults = 20 } = params;
            onStage(`[GMAIL] Fetching unread emails…`);
            const res = await window.electronAPI?.gmailGetUnread?.(maxResults);
            if (!res?.ok) throw new Error(res?.error ?? 'Gmail not connected');
            const emails = res.emails ?? [];
            if (!emails.length) return 'No unread emails found.';
            const lines = emails.map((e, i) => [
                `${i + 1}. **${e.subject || '(no subject)'}**`,
                `   From: ${e.from}`,
                `   ID: ${e.id}`,
                e.snippet ? `   Preview: ${e.snippet.slice(0, 100)}` : '',
            ].filter(Boolean).join('\n')).join('\n\n');
            return `${emails.length} unread email${emails.length !== 1 ? 's' : ''}:\n\n${lines}`;
        }

        case 'gmail_archive_read_emails': {
            const { maxResults = 100 } = params;
            onStage(`[GMAIL] Archiving read emails from inbox…`);
            const res = await window.electronAPI?.gmailArchiveRead?.(maxResults);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to archive read emails');
            const count = res.count ?? 0;
            return count > 0
                ? `✅ Archived ${count} read email${count !== 1 ? 's' : ''} from your inbox.`
                : '✅ No read emails found to archive — inbox is already clean.';
        }

        case 'gmail_trash_by_query': {
            const { query, maxResults = 50 } = params;
            if (!query) throw new Error('Missing required param: query');
            onStage(`[GMAIL] Trashing emails matching "${query}"…`);
            const res = await window.electronAPI?.gmailTrashByQuery?.(query, maxResults);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to trash emails');
            const count = res.count ?? 0;
            return count > 0
                ? `✅ Moved ${count} email${count !== 1 ? 's' : ''} matching "${query}" to trash.`
                : `No emails found matching "${query}" — nothing was trashed.`;
        }

        case 'gmail_create_label': {
            const { name, text_color, background_color } = params;
            if (!name) throw new Error('Missing required param: name');
            onStage(`[GMAIL] Creating label "${name}"…`);
            const colors = {};
            if (text_color) colors.textColor = text_color;
            if (background_color) colors.backgroundColor = background_color;
            const res = await window.electronAPI?.gmailCreateLabel?.(name, colors);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to create label');
            const label = res.label;
            return [
                `✅ Label created: "${name}"`,
                label?.id ? `Label ID: ${label.id}` : '',
            ].filter(Boolean).join('\n');
        }

        case 'gmail_add_label': {
            const { messageId, label_name } = params;
            if (!messageId || !label_name) throw new Error('Missing required params: messageId, label_name');
            onStage(`[GMAIL] Looking up label "${label_name}"…`);
            const idRes = await window.electronAPI?.gmailGetLabelId?.(label_name);
            if (!idRes?.ok || !idRes.id) {
                throw new Error(`Label "${label_name}" not found. Use gmail_list_labels to see available labels.`);
            }
            onStage(`[GMAIL] Adding label "${label_name}" to message…`);
            const res = await window.electronAPI?.gmailModifyMessage?.(messageId, [idRes.id], []);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to add label');
            return `✅ Label "${label_name}" added to message ${messageId}.`;
        }

        case 'gmail_remove_label': {
            const { messageId, label_name } = params;
            if (!messageId || !label_name) throw new Error('Missing required params: messageId, label_name');
            onStage(`[GMAIL] Looking up label "${label_name}"…`);
            const idRes = await window.electronAPI?.gmailGetLabelId?.(label_name);
            if (!idRes?.ok || !idRes.id) {
                throw new Error(`Label "${label_name}" not found. Use gmail_list_labels to see available labels.`);
            }
            onStage(`[GMAIL] Removing label "${label_name}" from message…`);
            const res = await window.electronAPI?.gmailModifyMessage?.(messageId, [], [idRes.id]);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to remove label');
            return `✅ Label "${label_name}" removed from message ${messageId}.`;
        }

        case 'gmail_get_label_id': {
            const { label_name } = params;
            if (!label_name) throw new Error('Missing required param: label_name');
            onStage(`[GMAIL] Looking up ID for label "${label_name}"…`);
            const res = await window.electronAPI?.gmailGetLabelId?.(label_name);
            if (!res?.ok) throw new Error(res?.error ?? 'Failed to get label ID');
            if (!res.id) return `No label named "${label_name}" was found. Use gmail_list_labels to see all labels.`;
            return [
                `🏷️ Label: "${label_name}"`,
                `ID: ${res.id}`,
            ].join('\n');
        }

        case 'gmail_get_sent_emails': {
            const { maxResults = 10 } = params;
            onStage(`[GMAIL] Fetching sent emails…`);
            const res = await window.electronAPI?.gmailSearch?.('in:sent', maxResults);
            if (!res?.ok) throw new Error(res?.error ?? 'Gmail not connected');
            const emails = res.emails ?? [];
            if (!emails.length) return 'No sent emails found.';
            const lines = emails.map((e, i) => [
                `${i + 1}. **${e.subject || '(no subject)'}**`,
                `   To: ${e.to || 'unknown'}`,
                `   ID: ${e.id}`,
                e.snippet ? `   Preview: ${e.snippet.slice(0, 100)}` : '',
            ].filter(Boolean).join('\n')).join('\n\n');
            return `${emails.length} sent email${emails.length !== 1 ? 's' : ''}:\n\n${lines}`;
        }

        case 'gmail_get_starred_emails': {
            const { maxResults = 10 } = params;
            onStage(`[GMAIL] Fetching starred emails…`);
            const res = await window.electronAPI?.gmailSearch?.('is:starred', maxResults);
            if (!res?.ok) throw new Error(res?.error ?? 'Gmail not connected');
            const emails = res.emails ?? [];
            if (!emails.length) return 'No starred emails found.';
            const lines = emails.map((e, i) => [
                `${i + 1}. ⭐ **${e.subject || '(no subject)'}**`,
                `   From: ${e.from}`,
                `   ID: ${e.id}`,
                e.snippet ? `   Preview: ${e.snippet.slice(0, 100)}` : '',
            ].filter(Boolean).join('\n')).join('\n\n');
            return `${emails.length} starred email${emails.length !== 1 ? 's' : ''}:\n\n${lines}`;
        }

        default:
            throw new Error(`GmailExecutor: unknown tool "${toolName}"`);
    }
}