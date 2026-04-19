export const MEMORY_TOOLS = [
  {
    name: 'list_personal_memory_files',
    description: 'List personal memory files and how much each file contains.',
    category: 'utility',
    parameters: {},
  },
  {
    name: 'search_personal_memory',
    description: "Search the user's personal memory files for relevant topics.",
    category: 'utility',
    parameters: {
      query: {
        type: 'string',
        required: true,
        description: 'What to look for in personal memory.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Max matching files (default 5, max 12).',
      },
    },
  },
  {
    name: 'read_personal_memory_files',
    description: 'Read one or more personal memory files by filename.',
    category: 'utility',
    parameters: {
      files: { type: 'array', required: true, description: 'Array of memory filenames to read.' },
    },
  },
  {
    name: 'get_chats_by_date',
    description:
      'Get all chat conversations from a specific day. Use when the user asks what they were chatting about on a given day — e.g. "yesterday", "today", "Monday", "last Tuesday", or a date like "2024-01-15". Returns a list of chats with their titles, times, message counts, and summaries.',
    category: 'utility',
    parameters: {
      date: {
        type: 'string',
        required: true,
        description:
          'Natural language date like "yesterday", "today", "Monday", "last Tuesday", "2 days ago", or an ISO date like "2024-01-15".',
      },
    },
  },
  {
    name: 'get_chats_in_time_range',
    description:
      'Get chat conversations within a specific time range on a given day. Use when the user narrows down to a time — e.g. "yesterday morning", "this afternoon", "last night", "around 3pm yesterday". Supports named slots (morning, afternoon, evening, night) or specific hours.',
    category: 'utility',
    parameters: {
      date: {
        type: 'string',
        required: true,
        description: 'The day to search — same format as get_chats_by_date.',
      },
      time_range: {
        type: 'string',
        required: true,
        description:
          'Time slot or range. Named slots: "morning" (6am–12pm), "afternoon" (12pm–6pm), "evening" (6pm–10pm), "night" (10pm–6am). Or specific like "around 3pm", "between 2pm and 4pm", "before noon".',
      },
    },
  },
  {
    name: 'read_chat_detail',
    description:
      'Read the content of a specific chat conversation by its ID (from get_chats_by_date or get_chats_in_time_range results). For large chats, intelligently returns the opening messages (user intent), a compacted mid-section summary, and the closing messages (final conclusion) — so you get the full picture without loading everything.',
    category: 'utility',
    parameters: {
      chat_id: {
        type: 'string',
        required: true,
        description: 'The chat ID to read (e.g. "2024-01-15_10-30-00").',
      },
    },
  },
];
