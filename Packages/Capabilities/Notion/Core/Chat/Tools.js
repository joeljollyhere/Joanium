export const NOTION_TOOLS = [
  // ─── Pages ─────────────────────────────────────────────────────────────────
  {
    name: 'notion_search_pages',
    description: 'Search Notion pages and return their titles, URLs, and last-edited times.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      query: {
        type: 'string',
        required: false,
        description: 'Search query. Leave blank to get the most recently edited pages.',
      },
    },
  },
  {
    name: 'notion_get_page',
    description:
      'Retrieve full metadata for a single Notion page by its ID, including all properties, URL, and timestamps.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The Notion page ID (UUID format).',
      },
    },
  },
  {
    name: 'notion_create_page',
    description: 'Create a new Notion page as a child of an existing page or database.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      parent_id: {
        type: 'string',
        required: true,
        description: 'ID of the parent page or database.',
      },
      parent_type: {
        type: 'string',
        required: false,
        description: 'Either "page_id" (default) or "database_id".',
      },
      title: {
        type: 'string',
        required: false,
        description: 'Title of the new page.',
      },
    },
  },
  {
    name: 'notion_update_page_title',
    description: 'Rename an existing Notion page by updating its title property.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The ID of the page to rename.',
      },
      new_title: {
        type: 'string',
        required: true,
        description: 'The new title for the page.',
      },
    },
  },
  {
    name: 'notion_archive_page',
    description:
      'Archive (soft-delete) a Notion page so it no longer appears in search or the workspace.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The ID of the page to archive.',
      },
    },
  },
  {
    name: 'notion_get_page_property',
    description: 'Retrieve the value of a specific property on a Notion page by property ID.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The Notion page ID.',
      },
      property_id: {
        type: 'string',
        required: true,
        description: 'The property ID to retrieve (visible in notion_get_page results).',
      },
    },
  },
  {
    name: 'notion_create_page_with_content',
    description:
      'Create a new Notion page and immediately populate it with one or more paragraph blocks of text.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      parent_id: {
        type: 'string',
        required: true,
        description: 'ID of the parent page.',
      },
      title: {
        type: 'string',
        required: false,
        description: 'Title of the new page.',
      },
      content_blocks: {
        type: 'array',
        required: true,
        description: 'Array of strings — each becomes a paragraph block in the page body.',
      },
    },
  },

  // ─── Blocks ─────────────────────────────────────────────────────────────────
  {
    name: 'notion_get_page_content',
    description:
      'Retrieve all top-level content blocks of a Notion page, including their type, text, and whether they have nested children.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'Page ID or block ID to read children from.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of blocks to return (default 50).',
      },
    },
  },
  {
    name: 'notion_append_text_block',
    description: 'Append a plain paragraph of text to the end of a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'The paragraph text to append.',
      },
    },
  },
  {
    name: 'notion_append_todo_block',
    description: 'Append a to-do (checkbox) item to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'The to-do item text.',
      },
      checked: {
        type: 'boolean',
        required: false,
        description: 'Whether the to-do should start as checked. Defaults to false.',
      },
    },
  },
  {
    name: 'notion_append_heading_block',
    description: 'Append a heading (H1, H2, or H3) to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'Heading text.',
      },
      level: {
        type: 'number',
        required: false,
        description: 'Heading level: 1, 2, or 3. Defaults to 2.',
      },
    },
  },
  {
    name: 'notion_append_bullet_list',
    description: 'Append one or more bulleted list items to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      items: {
        type: 'array',
        required: true,
        description: 'Array of strings — each becomes a separate bullet item.',
      },
    },
  },
  {
    name: 'notion_append_numbered_list',
    description: 'Append one or more numbered list items to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      items: {
        type: 'array',
        required: true,
        description: 'Array of strings — each becomes a sequential numbered list item.',
      },
    },
  },
  {
    name: 'notion_append_code_block',
    description: 'Append a code block with syntax highlighting to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      code: {
        type: 'string',
        required: true,
        description: 'The code content to display.',
      },
      language: {
        type: 'string',
        required: false,
        description:
          'Programming language for syntax highlighting (e.g. "javascript", "python"). Defaults to "plain text".',
      },
    },
  },
  {
    name: 'notion_append_divider',
    description:
      'Append a horizontal divider line to a Notion page or block to visually separate sections.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append the divider to.',
      },
    },
  },
  {
    name: 'notion_delete_block',
    description:
      'Permanently delete (archive) a specific block from a Notion page by its block ID.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'The ID of the block to delete.',
      },
    },
  },
  {
    name: 'notion_get_block_children',
    description:
      'Retrieve the nested child blocks of any Notion block, useful for reading toggle lists, columns, or synced blocks.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'The parent block ID whose children you want to retrieve.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of child blocks to return (default 50).',
      },
    },
  },

  // ─── Databases ───────────────────────────────────────────────────────────────
  {
    name: 'notion_search_databases',
    description:
      'List all Notion databases the integration can access, sorted by most recently edited.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of databases to return (default 20).',
      },
    },
  },
  {
    name: 'notion_get_database',
    description: 'Retrieve metadata and property names for a specific Notion database.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID.',
      },
    },
  },
  {
    name: 'notion_get_database_schema',
    description:
      'Return the full property schema (column definitions) of a Notion database, including each property name, type, and ID.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID.',
      },
    },
  },
  {
    name: 'notion_query_database',
    description:
      'Retrieve all entries (pages) in a Notion database, returning their IDs, URLs, and raw properties.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to query.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of entries to return (default 20).',
      },
    },
  },
  {
    name: 'notion_filter_database',
    description:
      'Query a Notion database with a filter condition, such as matching a select property, checkbox, date range, or text value.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to filter.',
      },
      filter: {
        type: 'object',
        required: true,
        description:
          'A Notion filter object, e.g. { "property": "Status", "select": { "equals": "In Progress" } }.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of results (default 20).',
      },
    },
  },
  {
    name: 'notion_create_database',
    description:
      'Create a new inline Notion database as a child of an existing page, with a given title and optional property schema.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      parent_page_id: {
        type: 'string',
        required: true,
        description: 'ID of the page that will contain the new database.',
      },
      title: {
        type: 'string',
        required: true,
        description: 'Title of the new database.',
      },
      properties: {
        type: 'object',
        required: false,
        description:
          'Optional Notion property schema object for additional columns (Name/title column is always added automatically).',
      },
    },
  },
  {
    name: 'notion_create_database_entry',
    description:
      'Create a new row (page) in a Notion database with a title and optional property values.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to add the entry to.',
      },
      title: {
        type: 'string',
        required: false,
        description: 'Value for the Name/title property of the new entry.',
      },
      properties: {
        type: 'object',
        required: false,
        description:
          'Additional Notion property values to set on the entry (using Notion property value shape).',
      },
    },
  },
  {
    name: 'notion_update_database_entry',
    description: 'Update one or more property values on an existing Notion database entry (page).',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID of the database entry to update.',
      },
      properties: {
        type: 'object',
        required: true,
        description: 'Notion property values to update, keyed by property name.',
      },
    },
  },
  {
    name: 'notion_archive_database_entry',
    description:
      'Archive (remove) an entry from a Notion database without permanently deleting it.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID of the database entry to archive.',
      },
    },
  },

  // ─── Comments ────────────────────────────────────────────────────────────────
  {
    name: 'notion_get_comments',
    description: 'Retrieve all comments on a Notion page, including their text and timestamps.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'The page or block ID to fetch comments for.',
      },
    },
  },
  {
    name: 'notion_add_comment',
    description: 'Post a new comment on a Notion page.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID to comment on.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'The comment text to post.',
      },
    },
  },

  // ─── Users ───────────────────────────────────────────────────────────────────
  {
    name: 'notion_get_users',
    description:
      'List all members (people and bots) in the Notion workspace, including their names and email addresses.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of users to return (default 50).',
      },
    },
  },
  {
    name: 'notion_get_user',
    description:
      'Retrieve profile information for a specific Notion workspace member by their user ID.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      user_id: {
        type: 'string',
        required: true,
        description: 'The Notion user ID (UUID format).',
      },
    },
  },
  {
    name: 'notion_get_bot_info',
    description:
      "Return information about the integration's bot user, including its name and the workspace it belongs to.",
    category: 'notion',
    connectorId: 'notion',
    parameters: {},
  },

  // ─── Existing extended tools ─────────────────────────────────────────────────
  {
    name: 'notion_restore_page',
    description:
      'Restore (un-archive) a previously archived Notion page, making it visible in search and the workspace again.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The ID of the archived page to restore.',
      },
    },
  },
  {
    name: 'notion_set_page_icon',
    description:
      'Set or replace the icon on a Notion page — either an emoji character or an external image URL.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: { type: 'string', required: true, description: 'The page ID to update.' },
      type: {
        type: 'string',
        required: false,
        description: '"emoji" (default) or "external" for an image URL.',
      },
      value: {
        type: 'string',
        required: true,
        description: 'The emoji character (e.g. "🚀") or the image URL if type is "external".',
      },
    },
  },
  {
    name: 'notion_set_page_cover',
    description: 'Set or replace the cover image on a Notion page using an external image URL.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: { type: 'string', required: true, description: 'The page ID to update.' },
      image_url: {
        type: 'string',
        required: true,
        description: 'Publicly accessible URL of the cover image.',
      },
    },
  },
  {
    name: 'notion_update_page_properties',
    description:
      'Update one or more properties on a Notion page using the full Notion property value shape.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: { type: 'string', required: true, description: 'The page ID to update.' },
      properties: {
        type: 'object',
        required: true,
        description: 'Map of property names to Notion property value objects.',
      },
    },
  },
  {
    name: 'notion_get_child_pages',
    description: 'List all immediate sub-pages nested inside a Notion page.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The parent page ID to look for child pages in.',
      },
    },
  },
  {
    name: 'notion_get_block',
    description: 'Retrieve a single Notion block by its ID.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: { type: 'string', required: true, description: 'The block ID to fetch.' },
    },
  },
  {
    name: 'notion_update_block_text',
    description: 'Update the text content of an existing Notion block in-place.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: { type: 'string', required: true, description: 'The block ID to update.' },
      text: { type: 'string', required: true, description: 'The new text content for the block.' },
    },
  },
  {
    name: 'notion_get_full_page_content',
    description: 'Recursively fetch all blocks in a Notion page up to a configurable depth.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: { type: 'string', required: true, description: 'The page ID to read.' },
      depth: {
        type: 'number',
        required: false,
        description: 'How many levels of nesting to fetch (default 2).',
      },
    },
  },
  {
    name: 'notion_export_page_as_text',
    description: 'Read a Notion page and return its full content as a single plain-text string.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: { type: 'string', required: true, description: 'The page ID to export.' },
    },
  },
  {
    name: 'notion_clear_page_content',
    description: 'Delete all top-level blocks from a Notion page, leaving it blank.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: { type: 'string', required: true, description: 'The page ID to clear.' },
    },
  },
  {
    name: 'notion_append_toggle_block',
    description: 'Append a collapsible toggle block to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'The toggle label text shown when collapsed.',
      },
    },
  },
  {
    name: 'notion_append_callout_block',
    description:
      'Append a callout block (highlighted box with an emoji icon) to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      text: { type: 'string', required: true, description: 'The callout message text.' },
      emoji: {
        type: 'string',
        required: false,
        description: 'Emoji icon for the callout (default: 💡).',
      },
    },
  },
  {
    name: 'notion_append_quote_block',
    description: 'Append a styled block quote to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      text: { type: 'string', required: true, description: 'The quoted text.' },
    },
  },
  {
    name: 'notion_append_image_block',
    description: 'Append an external image to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      image_url: {
        type: 'string',
        required: true,
        description: 'Publicly accessible URL of the image to embed.',
      },
    },
  },
  {
    name: 'notion_append_video_block',
    description:
      'Append an external video to a Notion page or block (e.g. a YouTube or Vimeo URL).',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      video_url: { type: 'string', required: true, description: 'URL of the video to embed.' },
    },
  },
  {
    name: 'notion_append_embed_block',
    description: 'Append an embed block to a Notion page, rendering an external URL inline.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      url: { type: 'string', required: true, description: 'The URL to embed.' },
    },
  },
  {
    name: 'notion_append_bookmark_block',
    description: 'Append a bookmark card to a Notion page.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      url: { type: 'string', required: true, description: 'The URL to bookmark.' },
      caption: {
        type: 'string',
        required: false,
        description: 'Optional caption text displayed below the bookmark.',
      },
    },
  },
  {
    name: 'notion_append_table_of_contents',
    description: 'Append a table of contents block to a Notion page.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append the table of contents to.',
      },
    },
  },
  {
    name: 'notion_append_table_block',
    description: 'Append a table with a header row to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      headers: { type: 'array', required: true, description: 'Array of column header strings.' },
      rows: {
        type: 'array',
        required: false,
        description: 'Array of rows, each an array of cell strings.',
      },
    },
  },
  {
    name: 'notion_sort_database',
    description: 'Query a Notion database with a sort order applied.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to query.',
      },
      sorts: { type: 'array', required: true, description: 'Array of Notion sort objects.' },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of results (default 20).',
      },
    },
  },
  {
    name: 'notion_filter_and_sort_database',
    description:
      'Query a Notion database applying both a filter condition and a sort order simultaneously.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to query.',
      },
      filter: {
        type: 'object',
        required: true,
        description: 'A Notion filter object to narrow results.',
      },
      sorts: {
        type: 'array',
        required: true,
        description: 'Array of Notion sort objects to order results.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of results (default 20).',
      },
    },
  },
  {
    name: 'notion_search_database_by_title',
    description:
      'Search for entries inside a specific Notion database whose Name/title property contains a given string.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to search within.',
      },
      query: {
        type: 'string',
        required: true,
        description: 'Substring to match against the title/Name property.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of results (default 20).',
      },
    },
  },
  {
    name: 'notion_count_database_entries',
    description: 'Count the total number of entries in a Notion database, optionally filtered.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: { type: 'string', required: true, description: 'The Notion database ID.' },
      filter: { type: 'object', required: false, description: 'Optional Notion filter object.' },
    },
  },
  {
    name: 'notion_update_database',
    description: "Update a Notion database's title or description.",
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to update.',
      },
      title: { type: 'string', required: false, description: 'New title for the database.' },
      description: {
        type: 'string',
        required: false,
        description: 'New description for the database.',
      },
    },
  },
  {
    name: 'notion_bulk_create_database_entries',
    description: 'Create multiple entries in a Notion database in a single call.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to add entries to.',
      },
      entries: {
        type: 'array',
        required: true,
        description: 'Array of entry objects, each with optional "title" and "properties".',
      },
    },
  },
  {
    name: 'notion_restore_database_entry',
    description: 'Restore (un-archive) a previously archived Notion database entry.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID of the archived database entry to restore.',
      },
    },
  },
  {
    name: 'notion_search_all',
    description: 'Search all Notion content — both pages and databases — by a query string.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      query: {
        type: 'string',
        required: false,
        description: 'Search query. Leave blank to get the most recently edited content.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of results to return (default 20).',
      },
    },
  },
  {
    name: 'notion_get_workspace_info',
    description: "Return workspace-level information derived from the integration's bot user.",
    category: 'notion',
    connectorId: 'notion',
    parameters: {},
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── NEW TOOLS (30) ────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Pages (new) ─────────────────────────────────────────────────────────────

  {
    name: 'notion_get_all_pages',
    description:
      'Retrieve every page the integration can access by paginating through all results — no limit cap. Returns total count alongside the full list. Use for workspace-wide audits or inventories.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      query: {
        type: 'string',
        required: false,
        description: 'Optional search query to filter pages by title. Leave blank for all pages.',
      },
    },
  },
  {
    name: 'notion_get_all_databases',
    description:
      'Retrieve every database the integration can access by paginating through all results — no limit cap. Returns total count alongside the full list.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {},
  },
  {
    name: 'notion_get_recently_created_pages',
    description:
      'Return pages sorted by creation time (newest first) rather than last-edited time. Useful for seeing what has been added to the workspace most recently.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of pages to return (default 20).',
      },
    },
  },
  {
    name: 'notion_duplicate_page',
    description:
      'Create a copy of an existing Notion page under the same parent. The new page title is prefixed with "Copy of" and all top-level text blocks are duplicated.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The ID of the page to duplicate.',
      },
    },
  },
  {
    name: 'notion_remove_page_icon',
    description: 'Remove the current icon from a Notion page, leaving it without any icon.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The ID of the page to remove the icon from.',
      },
    },
  },
  {
    name: 'notion_remove_page_cover',
    description: 'Remove the current cover image from a Notion page, leaving it without a cover.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The ID of the page to remove the cover from.',
      },
    },
  },
  {
    name: 'notion_get_subpage_tree',
    description:
      'Recursively map all sub-pages nested inside a page up to a configurable depth. Returns a nested tree of { id, title, children } nodes — useful for generating sitemaps or outlines of a wiki.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The root page ID to start the tree from.',
      },
      depth: {
        type: 'number',
        required: false,
        description: 'How many levels of sub-pages to recurse into (default 2, max recommended 3).',
      },
    },
  },

  // ─── Blocks (new) ────────────────────────────────────────────────────────────

  {
    name: 'notion_append_rich_text_block',
    description:
      'Append a paragraph to a Notion page where individual text segments can carry inline formatting — bold, italic, inline code, strikethrough, underline, colour, or hyperlinks. Pass an array of segments, each with its own annotations.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      segments: {
        type: 'array',
        required: true,
        description:
          'Array of text segment objects. Each segment: { text: string, bold?: boolean, italic?: boolean, code?: boolean, strikethrough?: boolean, underline?: boolean, color?: string, link?: string }. color accepts Notion color names such as "red", "blue_background", etc.',
      },
    },
  },
  {
    name: 'notion_append_equation_block',
    description: 'Append a display-mode LaTeX / KaTeX equation block to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      expression: {
        type: 'string',
        required: true,
        description: 'A valid KaTeX expression, e.g. "E = mc^2" or "\\\\sum_{i=1}^{n} i".',
      },
    },
  },
  {
    name: 'notion_append_file_block',
    description:
      'Append an external file attachment block to a Notion page (links to a publicly accessible file URL).',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      file_url: {
        type: 'string',
        required: true,
        description: 'Publicly accessible URL of the file to attach.',
      },
      caption: {
        type: 'string',
        required: false,
        description: 'Optional caption text displayed below the file block.',
      },
    },
  },
  {
    name: 'notion_append_pdf_block',
    description: 'Append an inline PDF viewer block to a Notion page using an external PDF URL.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      pdf_url: {
        type: 'string',
        required: true,
        description: 'Publicly accessible URL of the PDF to embed.',
      },
      caption: {
        type: 'string',
        required: false,
        description: 'Optional caption text displayed below the PDF block.',
      },
    },
  },
  {
    name: 'notion_set_todo_checked',
    description:
      'Check or uncheck an existing to-do block by its block ID — without changing the text.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'The ID of the to_do block to update.',
      },
      checked: {
        type: 'boolean',
        required: true,
        description: 'true to mark the to-do as complete; false to mark it as incomplete.',
      },
    },
  },
  {
    name: 'notion_find_blocks_by_type',
    description:
      'Return all top-level blocks on a page that match a given block type (e.g. "to_do", "heading_1", "bulleted_list_item", "image"). Useful for extracting all tasks, headings, or code blocks from a page.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID to scan.',
      },
      block_type: {
        type: 'string',
        required: true,
        description:
          'The Notion block type to filter for, e.g. "to_do", "heading_2", "code", "image", "bulleted_list_item".',
      },
    },
  },
  {
    name: 'notion_search_page_content',
    description:
      'Search the top-level blocks of a Notion page for any block whose text contains a given substring. Returns matching blocks with their IDs and types.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID to search within.',
      },
      query: {
        type: 'string',
        required: true,
        description: 'The text substring to search for (case-insensitive).',
      },
    },
  },
  {
    name: 'notion_get_block_type_summary',
    description:
      "Return a breakdown of how many blocks of each type exist on a page. Useful for quickly understanding a page's structure without reading all its content.",
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID to analyse.',
      },
    },
  },

  // ─── Databases (new) ─────────────────────────────────────────────────────────

  {
    name: 'notion_get_all_database_entries',
    description:
      'Retrieve every entry in a Notion database using cursor-based pagination — no limit cap. Optionally accepts a filter. Use when you need a complete snapshot of a database.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to retrieve all entries from.',
      },
      filter: {
        type: 'object',
        required: false,
        description: 'Optional Notion filter object to limit which entries are returned.',
      },
    },
  },
  {
    name: 'notion_get_database_entry',
    description:
      'Retrieve a single database entry (page) with all property values parsed into plain human-readable strings — no need to decode raw Notion property shapes.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID of the database entry to retrieve.',
      },
    },
  },
  {
    name: 'notion_export_database_as_text',
    description:
      'Read a Notion database and return all its entries as a formatted plain-text document. Each entry shows its title and all non-empty property values. Ideal for summarising or feeding database content into AI prompts.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to export.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of entries to include (default 50).',
      },
    },
  },
  {
    name: 'notion_batch_update_database_entries',
    description:
      'Update properties on multiple database entries in a single call. Each item in the updates array targets a different page ID with its own property changes.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      updates: {
        type: 'array',
        required: true,
        description:
          'Array of update objects, each with "pageId" (string) and "properties" (Notion property value map).',
      },
    },
  },
  {
    name: 'notion_batch_archive_database_entries',
    description:
      'Archive multiple database entries in a single call by providing an array of page IDs.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_ids: {
        type: 'array',
        required: true,
        description: 'Array of page IDs (strings) to archive.',
      },
    },
  },
  {
    name: 'notion_add_database_property',
    description:
      'Add a new property (column) to an existing Notion database. Provide the property name and a Notion property schema config object describing its type.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to modify.',
      },
      property_name: {
        type: 'string',
        required: true,
        description: 'The display name for the new column.',
      },
      property_config: {
        type: 'object',
        required: true,
        description:
          'Notion property schema object defining the column type, e.g. { "select": { "options": [] } }, { "checkbox": {} }, { "number": { "format": "dollar" } }.',
      },
    },
  },
  {
    name: 'notion_remove_database_property',
    description:
      'Remove an existing property (column) from a Notion database. This permanently deletes the column and all data stored in it.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to modify.',
      },
      property_name: {
        type: 'string',
        required: true,
        description: 'The exact name of the property to remove.',
      },
    },
  },
  {
    name: 'notion_rename_database_property',
    description:
      'Rename an existing property (column) in a Notion database without changing any other configuration.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to modify.',
      },
      current_name: {
        type: 'string',
        required: true,
        description: 'The current exact name of the property to rename.',
      },
      new_name: {
        type: 'string',
        required: true,
        description: 'The new name for the property.',
      },
    },
  },
  {
    name: 'notion_update_database_property',
    description:
      'Update the configuration of an existing database property — for example, adding new options to a select column, changing a number format, or modifying date configuration.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to modify.',
      },
      property_name: {
        type: 'string',
        required: true,
        description: 'The exact name of the property to update.',
      },
      property_config: {
        type: 'object',
        required: true,
        description:
          'Partial Notion property schema config to merge — e.g. { "select": { "options": [{ "name": "New Option", "color": "blue" }] } }.',
      },
    },
  },
  {
    name: 'notion_get_database_property_options',
    description:
      "List all available options for a select, multi-select, or status property in a database. Returns each option's name, ID, and colour.",
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID.',
      },
      property_name: {
        type: 'string',
        required: true,
        description: 'The name of the select, multi-select, or status property to inspect.',
      },
    },
  },
  {
    name: 'notion_filter_database_by_date',
    description:
      'Filter a Notion database by a date property using one or more range bounds. All date values must be ISO 8601 strings (e.g. "2024-06-01" or "2024-06-01T09:00:00Z").',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to filter.',
      },
      property_name: {
        type: 'string',
        required: true,
        description: 'The name of the date property to filter on.',
      },
      after: {
        type: 'string',
        required: false,
        description: 'Return entries with a date strictly after this ISO 8601 value.',
      },
      before: {
        type: 'string',
        required: false,
        description: 'Return entries with a date strictly before this ISO 8601 value.',
      },
      on_or_after: {
        type: 'string',
        required: false,
        description: 'Return entries with a date on or after this ISO 8601 value.',
      },
      on_or_before: {
        type: 'string',
        required: false,
        description: 'Return entries with a date on or before this ISO 8601 value.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of results (default 20).',
      },
    },
  },
  {
    name: 'notion_filter_database_by_checkbox',
    description:
      'Filter a Notion database to return only entries where a checkbox property is checked (true) or unchecked (false).',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to filter.',
      },
      property_name: {
        type: 'string',
        required: true,
        description: 'The name of the checkbox property to filter on.',
      },
      checked: {
        type: 'boolean',
        required: false,
        description: 'true to return only checked entries (default); false for only unchecked.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of results (default 20).',
      },
    },
  },

  // ─── Comments (new) ──────────────────────────────────────────────────────────

  {
    name: 'notion_get_page_comments_count',
    description:
      'Return the total number of comments on a Notion page along with the full comment list.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID to count comments on.',
      },
    },
  },

  // ─── Users (new) ─────────────────────────────────────────────────────────────

  {
    name: 'notion_find_user_by_name',
    description:
      "Search workspace members by name substring (case-insensitive). Useful for looking up a user's ID before assigning them to a database property.",
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      name: {
        type: 'string',
        required: true,
        description: 'The name (or partial name) to search for.',
      },
    },
  },

  // ─── Workspace (new) ─────────────────────────────────────────────────────────

  {
    name: 'notion_get_workspace_stats',
    description:
      'Return a high-level summary of the workspace: accessible page count, database count, member count, and workspace name. All counts are limited to what the integration has been granted access to.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {},
  },
];
