export const SENTRY_TOOLS = [
  // ─── Issues ──────────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_issues',
    description:
      'List the most recent unresolved Sentry issues across the default organization, with error level and occurrence count.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_get_issue',
    description:
      'Get full details of a single Sentry issue by its issue ID, including culprit, status, level, affected user count, and permalink.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
    },
  },
  {
    name: 'sentry_resolve_issue',
    description:
      'Mark a Sentry issue as resolved by its issue ID. Use this when a fix has been confirmed.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: {
        type: 'string',
        description: 'The numeric Sentry issue ID to resolve.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_ignore_issue',
    description:
      'Ignore a Sentry issue by its issue ID so it no longer appears in the active issue list.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: {
        type: 'string',
        description: 'The numeric Sentry issue ID to ignore.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_assign_issue',
    description: 'Assign a Sentry issue to a team member by their username or email address.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: {
        type: 'string',
        description: 'The numeric Sentry issue ID to assign.',
        required: true,
      },
      assignee: {
        type: 'string',
        description: 'Username or email of the member to assign the issue to.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_bulk_resolve_issues',
    description: 'Resolve multiple Sentry issues at once by providing a list of issue IDs.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of numeric Sentry issue IDs to resolve.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_search_issues',
    description:
      'Search Sentry issues using a custom query string (e.g. "is:unresolved browser:Chrome", "assigned:me", "times_seen:>100").',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      query: { type: 'string', description: 'Sentry search query string.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_list_fatal_issues',
    description:
      'List only fatal-level unresolved Sentry issues — the highest severity errors requiring immediate attention.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      limit: {
        type: 'number',
        description: 'Maximum number of results (default 25).',
        required: false,
      },
    },
  },

  // ─── Issue Events & Tags ──────────────────────────────────────────────────────
  {
    name: 'sentry_list_issue_events',
    description:
      'List recent individual events (occurrences) for a specific Sentry issue, including timestamps and affected users.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of events to return (default 10).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_get_latest_event',
    description:
      'Get the most recent event for a Sentry issue, including full stack trace entries, tags, and user context.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
    },
  },
  {
    name: 'sentry_list_issue_tags',
    description:
      'List all tags for a Sentry issue (e.g. browser, OS, environment, release) with top values and counts, useful for spotting patterns.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
    },
  },
  {
    name: 'sentry_list_issue_hashes',
    description:
      'List the fingerprint hashes grouped under a Sentry issue. Useful for understanding how many unique stack trace variants are grouped together.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
    },
  },

  // ─── Projects ─────────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_projects',
    description:
      'List all Sentry projects in the connected organization, including platform, status, and creation date.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_get_project',
    description:
      'Get detailed information about a specific Sentry project by its slug, including owning team and latest release.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: {
        type: 'string',
        description: 'The project slug (e.g. "my-app").',
        required: true,
      },
    },
  },
  {
    name: 'sentry_list_project_issues',
    description: 'List unresolved issues scoped to a specific Sentry project.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of issues to return (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_list_project_events',
    description: 'List the most recent events captured in a specific Sentry project.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of events to return (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_list_project_releases',
    description:
      'List releases deployed for a specific Sentry project, including commit counts, new issue counts, and deploy counts.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of releases (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_list_alert_rules',
    description:
      'List all alert rules configured for a specific Sentry project, including conditions and notification actions.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
    },
  },
  {
    name: 'sentry_list_user_feedback',
    description:
      'List user-submitted feedback attached to Sentry events for a specific project, including comments and reporter email.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of feedback entries (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_list_dsym_files',
    description:
      'List debug symbol (dSYM / ProGuard / Breakpad) files uploaded to a Sentry project. Useful for verifying symbolication is set up correctly.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
    },
  },

  // ─── Organizations ────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_organizations',
    description: 'List all Sentry organizations accessible with the connected auth token.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_get_organization',
    description:
      'Get detailed information about the connected Sentry organization, including member count and enabled features.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_list_members',
    description:
      'List all members of the connected Sentry organization, including their roles and email addresses.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_list_environments',
    description:
      'List all environments defined in the Sentry organization (e.g. production, staging, development).',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_get_org_stats',
    description:
      'Get organization-wide error event volume statistics for the past 14 days using the Sentry Stats V2 API.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },

  // ─── Teams ────────────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_teams',
    description: 'List all teams in the connected Sentry organization, including member counts.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_list_team_projects',
    description: 'List all Sentry projects assigned to a specific team.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      teamSlug: { type: 'string', description: 'The team slug.', required: true },
    },
  },

  // ─── Releases ─────────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_org_releases',
    description:
      'List all releases across the connected Sentry organization, showing version, deploy count, new issues, and associated projects.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      limit: {
        type: 'number',
        description: 'Maximum number of releases (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_get_release',
    description:
      'Get detailed information about a specific release version in Sentry, including authors, commit count, and associated projects.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      version: {
        type: 'string',
        description: 'The release version string (e.g. "2.3.1" or a commit SHA).',
        required: true,
      },
    },
  },
  {
    name: 'sentry_list_deploys',
    description:
      'List all deploys for a specific release version in Sentry, showing environment, start time, and finish time.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      version: { type: 'string', description: 'The release version string.', required: true },
    },
  },

  // ─── NEW: Issue Comments ──────────────────────────────────────────────────────
  {
    name: 'sentry_list_issue_comments',
    description:
      'List all notes and comments left by team members on a Sentry issue, including author and timestamp.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
    },
  },
  {
    name: 'sentry_create_issue_comment',
    description:
      'Post a new comment or note on a Sentry issue. Useful for leaving investigation notes or status updates directly on the issue.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
      text: {
        type: 'string',
        description: 'The comment text to post. Supports markdown.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_delete_issue_comment',
    description: 'Delete an existing comment on a Sentry issue by its comment ID.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
      commentId: {
        type: 'string',
        description: 'The ID of the comment to delete.',
        required: true,
      },
    },
  },

  // ─── NEW: Similar Issues ──────────────────────────────────────────────────────
  {
    name: 'sentry_list_similar_issues',
    description:
      'Find Sentry issues similar to a given issue based on stack trace fingerprinting. Useful for identifying duplicates or related root causes.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of similar issues to return (default 10).',
        required: false,
      },
    },
  },

  // ─── NEW: Issue Attachments ───────────────────────────────────────────────────
  {
    name: 'sentry_list_issue_attachments',
    description:
      'List file attachments on a Sentry issue, such as crash reports, log files, or screenshots uploaded alongside events.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
    },
  },

  // ─── NEW: Issue Tag Values ────────────────────────────────────────────────────
  {
    name: 'sentry_list_issue_tag_values',
    description:
      'List all distinct values for a specific tag on a Sentry issue (e.g. all browser versions, OS versions, or release versions affected), with occurrence counts.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
      key: {
        type: 'string',
        description: 'The tag key to retrieve values for (e.g. "browser", "os", "release").',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of values to return (default 25).',
        required: false,
      },
    },
  },

  // ─── NEW: Issue Mutations ─────────────────────────────────────────────────────
  {
    name: 'sentry_reopen_issue',
    description:
      'Reopen a previously resolved or ignored Sentry issue, setting its status back to unresolved.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: {
        type: 'string',
        description: 'The numeric Sentry issue ID to reopen.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_bookmark_issue',
    description:
      'Bookmark or unbookmark a Sentry issue to mark it for personal follow-up. Bookmarked issues are easy to find in your personal queue.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: {
        type: 'string',
        description: 'The numeric Sentry issue ID.',
        required: true,
      },
      bookmark: {
        type: 'boolean',
        description: 'Set to true to bookmark, false to remove bookmark (default true).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_delete_issue',
    description:
      'Permanently delete a Sentry issue and all its associated events. This action is irreversible — use with caution.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: {
        type: 'string',
        description: 'The numeric Sentry issue ID to permanently delete.',
        required: true,
      },
    },
  },

  // ─── NEW: Project Tools ───────────────────────────────────────────────────────
  {
    name: 'sentry_list_project_tags',
    description:
      'List all tag keys captured across events in a Sentry project (e.g. browser, device, url, release), useful for understanding what context is being collected.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
    },
  },
  {
    name: 'sentry_list_project_keys',
    description:
      'List all DSN (client key) configurations for a Sentry project. Shows public DSN URLs used to initialize the Sentry SDK in your app.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
    },
  },
  {
    name: 'sentry_get_project_ownership',
    description:
      'Retrieve the ownership rules for a Sentry project — the rules that automatically assign issues to teams or individuals based on file path or URL patterns.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
    },
  },
  {
    name: 'sentry_get_project_event',
    description:
      'Fetch full details of a single event by its event ID within a project, including stack trace entries, tags, and user context.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
      eventId: {
        type: 'string',
        description: 'The Sentry event ID (UUID format).',
        required: true,
      },
    },
  },
  {
    name: 'sentry_list_project_service_hooks',
    description:
      'List all service hooks (outbound webhooks) configured on a Sentry project, showing the target URL and subscribed event types.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
    },
  },
  {
    name: 'sentry_list_release_files',
    description:
      'List source map and artifact files uploaded for a specific release version in a project. Useful for verifying source map coverage for stack trace symbolication.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
      version: { type: 'string', description: 'The release version string.', required: true },
    },
  },

  // ─── NEW: Team Members & Member Details ──────────────────────────────────────
  {
    name: 'sentry_list_team_members',
    description:
      'List all members belonging to a specific Sentry team, including their roles within the team.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      teamSlug: { type: 'string', description: 'The team slug.', required: true },
    },
  },
  {
    name: 'sentry_get_member',
    description:
      'Get detailed information about a specific organization member by their member ID, including role, team memberships, and pending invite status.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      memberId: {
        type: 'string',
        description: 'The numeric Sentry member ID.',
        required: true,
      },
    },
  },

  // ─── NEW: Releases — Commits ──────────────────────────────────────────────────
  {
    name: 'sentry_list_release_commits',
    description:
      'List all commits associated with a Sentry release, including commit message, author, and repository. Useful for tracing which code changes introduced new errors.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      version: {
        type: 'string',
        description: 'The release version string.',
        required: true,
      },
    },
  },

  // ─── NEW: Monitors (Cron Jobs) ────────────────────────────────────────────────
  {
    name: 'sentry_list_monitors',
    description:
      'List all cron job monitors configured in the Sentry organization, including their status, last check-in time, and next expected check-in.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_get_monitor',
    description:
      'Get detailed information about a specific cron monitor by its slug, including its schedule config, environments, and recent health status.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      monitorSlug: {
        type: 'string',
        description: 'The monitor slug.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_list_monitor_checkins',
    description:
      'List recent check-in records for a cron monitor, showing whether each run succeeded, failed, or timed out, along with duration.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      monitorSlug: {
        type: 'string',
        description: 'The monitor slug.',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Maximum number of check-in records to return (default 25).',
        required: false,
      },
    },
  },

  // ─── NEW: Dashboards ──────────────────────────────────────────────────────────
  {
    name: 'sentry_list_dashboards',
    description:
      'List all custom dashboards in the Sentry organization, including title, creator, and widget count.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_get_dashboard',
    description:
      'Get the full contents of a specific Sentry dashboard by ID, including all widgets, their display types, and Discover queries powering them.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      dashboardId: {
        type: 'string',
        description: 'The numeric Sentry dashboard ID.',
        required: true,
      },
    },
  },

  // ─── NEW: Saved Searches ──────────────────────────────────────────────────────
  {
    name: 'sentry_list_saved_searches',
    description:
      'List all saved issue searches in the Sentry organization, including the search query string and whether it is the default view.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },

  // ─── NEW: Integrations & Apps ─────────────────────────────────────────────────
  {
    name: 'sentry_list_integrations',
    description:
      'List all third-party integrations connected to the Sentry organization (e.g. GitHub, Slack, Jira, PagerDuty), including their connection status.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_list_sentry_apps',
    description:
      'List all Sentry Apps (internal or published) installed in the organization, including their permission scopes and publication status.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },

  // ─── NEW: Replays ─────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_replays',
    description:
      'List recent Session Replay recordings captured by Sentry, including duration, error count, and the user who triggered the session. Requires the Replays feature to be enabled.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      limit: {
        type: 'number',
        description: 'Maximum number of replays to return (default 25).',
        required: false,
      },
    },
  },

  // ─── NEW: Org Activity & Event Stats ─────────────────────────────────────────
  {
    name: 'sentry_list_org_activity',
    description:
      'List the recent activity feed for the Sentry organization — issue resolutions, assignments, comments, and other actions taken by team members.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      limit: {
        type: 'number',
        description: 'Maximum number of activity entries to return (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_get_event_stats',
    description:
      'Retrieve time-series error event volume for the organization using the Sentry Discover Events Stats API. Supports custom query filters, time periods, and intervals.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      query: {
        type: 'string',
        description:
          'Optional Sentry search query to filter events (e.g. "project:my-app level:error").',
        required: false,
      },
      statsPeriod: {
        type: 'string',
        description: 'Time window for stats, e.g. "24h", "7d", "14d" (default "14d").',
        required: false,
      },
      interval: {
        type: 'string',
        description: 'Bucketing interval, e.g. "1h", "1d" (default "1d").',
        required: false,
      },
    },
  },
];
