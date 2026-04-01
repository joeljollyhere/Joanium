import { ACTION_META } from '../Config/Constants.js';
import { escapeHtml, capitalize, generateId, formatTrigger, timeAgo } from '../../../../../System/Utils.js';

export { escapeHtml, capitalize, generateId, formatTrigger };

export function formatActionsSummary(actions = []) {
    if (!actions.length) return 'No actions configured';
    const label = actions.length === 1 ? '1 action' : `${actions.length} actions`;
    const types = [...new Set(actions.map(action => {
        const meta = ACTION_META[action.type];
        const base = meta?.label || action.type;
        if (action.type === 'open_folder') return base + (action.openTerminal ? ' + terminal' : '');
        if (action.type === 'run_command') return base + (action.silent ? ' (silent)' : '');
        return base;
    }))];
    return `${label}: ${types.join(', ')}`;
}

export function formatLastRun(lastRun) {
    if (!lastRun) return '';
    return `Last run: ${timeAgo(lastRun)}`;
}
