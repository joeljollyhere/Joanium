const HANDLED = new Set([
  'calendar_get_today',
  'calendar_get_upcoming',
  'calendar_list_calendars',
  'calendar_search_events',
  'calendar_list_events',
  'calendar_create_event',
  'calendar_delete_event',
]);

export function handles(toolName) { return HANDLED.has(toolName); }

function formatEventTime(eventTime) {
  if (!eventTime) return 'N/A';
  if (eventTime.dateTime) {
    return new Date(eventTime.dateTime).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }
  if (eventTime.date) {
    return new Date(eventTime.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    }) + ' (all day)';
  }
  return 'N/A';
}

function formatEvent(event, index) {
  const start = formatEventTime(event.start);
  const end = formatEventTime(event.end);
  const lines = [
    `${index}. **${event.summary || '(No title)'}**`,
    `   🕐 ${start}${end && end !== start ? ` → ${end}` : ''}`,
  ];
  if (event.location) lines.push(`   📍 ${event.location}`);
  if (event.description) lines.push(`   📝 ${event.description.slice(0, 100)}${event.description.length > 100 ? '…' : ''}`);
  const attendeeCount = event.attendees?.length ?? 0;
  if (attendeeCount > 0) {
    const names = event.attendees.slice(0, 3).map(a => a.displayName || a.email).join(', ');
    lines.push(`   👥 ${names}${attendeeCount > 3 ? ` +${attendeeCount - 3} more` : ''}`);
  }
  if (event.id) lines.push(`   ID: \`${event.id}\``);
  return lines.join('\n');
}

export async function execute(toolName, params, onStage = () => {}) {
  switch (toolName) {

    case 'calendar_get_today': {
      onStage('[CALENDAR] Fetching today\'s events…');
      const res = await window.electronAPI?.calendarGetToday?.();
      if (!res?.ok) throw new Error(res?.error ?? 'Google Calendar not connected');
      const events = res.events ?? [];
      if (!events.length) return '📅 No events on your calendar today.';
      const formatted = events.map((e, i) => formatEvent(e, i + 1)).join('\n\n');
      return `📅 Today's calendar — ${events.length} event${events.length !== 1 ? 's' : ''}:\n\n${formatted}`;
    }

    case 'calendar_get_upcoming': {
      const days = params.days ?? 7;
      const maxResults = params.max_results ?? 20;
      onStage(`[CALENDAR] Fetching next ${days} days of events…`);
      const res = await window.electronAPI?.calendarGetUpcoming?.(days, maxResults);
      if (!res?.ok) throw new Error(res?.error ?? 'Google Calendar not connected');
      const events = res.events ?? [];
      if (!events.length) return `📅 No upcoming events in the next ${days} day${days !== 1 ? 's' : ''}.`;
      const formatted = events.map((e, i) => formatEvent(e, i + 1)).join('\n\n');
      return `📅 Upcoming events (next ${days} days) — ${events.length} event${events.length !== 1 ? 's' : ''}:\n\n${formatted}`;
    }

    case 'calendar_list_calendars': {
      onStage('[CALENDAR] Listing calendars…');
      const res = await window.electronAPI?.calendarListCalendars?.();
      if (!res?.ok) throw new Error(res?.error ?? 'Google Calendar not connected');
      const calendars = res.calendars ?? [];
      if (!calendars.length) return 'No Google Calendars found.';
      const lines = calendars.map((c, i) =>
        `${i + 1}. **${c.summary || c.id}**${c.primary ? ' *(primary)*' : ''}\n   ID: \`${c.id}\`${c.description ? `\n   ${c.description}` : ''}`
      ).join('\n\n');
      return `📅 Your Google Calendars (${calendars.length}):\n\n${lines}`;
    }

    case 'calendar_search_events': {
      const { query, max_results } = params;
      if (!query?.trim()) throw new Error('Missing required param: query');
      onStage(`[CALENDAR] Searching calendar for "${query}"…`);
      const res = await window.electronAPI?.calendarSearchEvents?.(query, max_results ?? 20);
      if (!res?.ok) throw new Error(res?.error ?? 'Google Calendar not connected');
      const events = res.events ?? [];
      if (!events.length) return `📅 No calendar events found matching "${query}".`;
      const formatted = events.map((e, i) => formatEvent(e, i + 1)).join('\n\n');
      return `📅 Calendar search "${query}" — ${events.length} result${events.length !== 1 ? 's' : ''}:\n\n${formatted}`;
    }

    case 'calendar_list_events': {
      const calendarId = params.calendar_id?.trim() || 'primary';
      const opts = {};
      if (params.time_min) opts.timeMin = params.time_min;
      if (params.time_max) opts.timeMax = params.time_max;
      if (params.max_results) opts.maxResults = Number(params.max_results);
      onStage(`[CALENDAR] Listing events from ${calendarId}…`);
      const res = await window.electronAPI?.calendarListEvents?.(calendarId, opts);
      if (!res?.ok) throw new Error(res?.error ?? 'Google Calendar not connected');
      const events = res.events ?? [];
      if (!events.length) return 'No events found in the specified date range.';
      const formatted = events.map((e, i) => formatEvent(e, i + 1)).join('\n\n');
      return `📅 Calendar events — ${events.length} event${events.length !== 1 ? 's' : ''}:\n\n${formatted}`;
    }

    case 'calendar_create_event': {
      const { summary, start_datetime, end_datetime, description, location, attendees, all_day, calendar_id } = params;
      if (!summary?.trim()) throw new Error('Missing required param: summary (event title)');
      if (!start_datetime?.trim()) throw new Error('Missing required param: start_datetime');
      onStage(`[CALENDAR] Creating event "${summary}"…`);

      // Build end_datetime if not provided (1 hour after start)
      let endDt = end_datetime;
      if (!endDt && !all_day) {
        try {
          const startDate = new Date(start_datetime);
          startDate.setHours(startDate.getHours() + 1);
          endDt = startDate.toISOString();
        } catch {
          endDt = start_datetime;
        }
      }

      const attendeeList = attendees
        ? String(attendees).split(',').map(e => e.trim()).filter(Boolean)
        : [];

      const calId = calendar_id?.trim() || 'primary';
      const eventData = {
        summary: summary.trim(),
        startDateTime: start_datetime.trim(),
        endDateTime: endDt,
        description: description?.trim() || '',
        location: location?.trim() || '',
        attendees: attendeeList,
        allDay: Boolean(all_day),
      };

      const res = await window.electronAPI?.calendarCreateEvent?.(calId, eventData);
      if (!res?.ok) throw new Error(res?.error ?? 'Google Calendar not connected');
      const event = res.event ?? {};
      return [
        `✅ Event created in Google Calendar`,
        `**Title:** ${event.summary ?? summary}`,
        `**When:** ${formatEventTime(event.start)}`,
        event.location ? `**Where:** ${event.location}` : '',
        attendeeList.length ? `**Invited:** ${attendeeList.join(', ')}` : '',
        event.id ? `**ID:** \`${event.id}\`` : '',
        event.htmlLink ? `🔗 ${event.htmlLink}` : '',
      ].filter(Boolean).join('\n');
    }

    case 'calendar_delete_event': {
      const { event_id, calendar_id } = params;
      if (!event_id?.trim()) throw new Error('Missing required param: event_id');
      const calId = calendar_id?.trim() || 'primary';
      onStage(`[CALENDAR] Deleting event ${event_id}…`);
      const res = await window.electronAPI?.calendarDeleteEvent?.(calId, event_id.trim());
      if (!res?.ok) throw new Error(res?.error ?? 'Google Calendar not connected');
      return `✅ Event \`${event_id}\` deleted from your Google Calendar.`;
    }

    default:
      throw new Error(`CalendarExecutor: unknown tool "${toolName}"`);
  }
}
