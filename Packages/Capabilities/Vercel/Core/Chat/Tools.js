export const VERCEL_TOOLS = [
  // ─── Projects ──────────────────────────────────────────────────────────────
  {
    name: 'vercel_list_projects',
    description:
      "List all of the user's Vercel projects with framework, latest deployment state, and domains.",
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {},
  },
  {
    name: 'vercel_get_project',
    description: 'Get detailed info about a specific Vercel project by its name or ID.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      idOrName: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
    },
  },
  {
    name: 'vercel_create_project',
    description: 'Create a new Vercel project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      name: {
        type: 'string',
        description: 'Name of the new project',
        required: true,
      },
      framework: {
        type: 'string',
        description: 'Framework preset (e.g. nextjs, vite, nuxtjs)',
        required: false,
      },
    },
  },
  {
    name: 'vercel_update_project',
    description: 'Update settings (name, framework, etc.) of an existing Vercel project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      idOrName: {
        type: 'string',
        description: 'The project ID or name to update',
        required: true,
      },
      updates: {
        type: 'object',
        description: 'Key-value pairs to update (e.g. { "name": "new-name", "framework": "vite" })',
        required: true,
      },
    },
  },
  {
    name: 'vercel_delete_project',
    description: 'Permanently delete a Vercel project. Use with caution.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      idOrName: {
        type: 'string',
        description: 'The project ID or name to delete',
        required: true,
      },
    },
  },
  {
    name: 'vercel_pause_project',
    description:
      'Pause a Vercel project, preventing new deployments and disabling serving. Use when you want to temporarily suspend a project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      idOrName: {
        type: 'string',
        description: 'The project ID or name to pause',
        required: true,
      },
    },
  },
  {
    name: 'vercel_unpause_project',
    description: 'Unpause (resume) a previously paused Vercel project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      idOrName: {
        type: 'string',
        description: 'The project ID or name to unpause',
        required: true,
      },
    },
  },

  // ─── Deployments ───────────────────────────────────────────────────────────
  {
    name: 'vercel_list_deployments_by_project',
    description: 'List recent deployments scoped to a specific Vercel project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
      limit: {
        type: 'number',
        description: 'Max number of deployments to return (default 20)',
        required: false,
      },
    },
  },
  {
    name: 'vercel_get_deployment',
    description: 'Get detailed info about a specific Vercel deployment by its ID or URL.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      deploymentId: {
        type: 'string',
        description: 'The deployment UID or URL',
        required: true,
      },
    },
  },
  {
    name: 'vercel_delete_deployment',
    description:
      'Permanently delete a specific Vercel deployment by its ID. Use with caution — this cannot be undone.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      deploymentId: {
        type: 'string',
        description: 'The deployment UID to delete',
        required: true,
      },
    },
  },
  {
    name: 'vercel_cancel_deployment',
    description: 'Cancel an in-progress Vercel deployment.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      deploymentId: {
        type: 'string',
        description: 'The deployment UID to cancel',
        required: true,
      },
    },
  },
  {
    name: 'vercel_redeploy',
    description: 'Redeploy an existing Vercel deployment to production.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      deploymentId: {
        type: 'string',
        description: 'The deployment UID to redeploy',
        required: true,
      },
    },
  },
  {
    name: 'vercel_promote_deployment',
    description:
      'Promote a specific deployment to be the active production deployment for a project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
      deploymentId: {
        type: 'string',
        description: 'The deployment UID to promote to production',
        required: true,
      },
    },
  },
  {
    name: 'vercel_get_deployment_logs',
    description: 'Fetch build and runtime log events for a specific Vercel deployment.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      deploymentId: {
        type: 'string',
        description: 'The deployment UID to fetch logs for',
        required: true,
      },
    },
  },
  {
    name: 'vercel_get_deployment_files',
    description: 'List the file tree of a Vercel deployment — all files that were deployed.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      deploymentId: {
        type: 'string',
        description: 'The deployment UID',
        required: true,
      },
    },
  },
  {
    name: 'vercel_get_deployment_file_content',
    description: 'Retrieve the raw content of a specific file from a Vercel deployment.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      deploymentId: {
        type: 'string',
        description: 'The deployment UID',
        required: true,
      },
      fileId: {
        type: 'string',
        description: 'The file UID from vercel_get_deployment_files',
        required: true,
      },
    },
  },
  {
    name: 'vercel_list_deployment_checks',
    description: 'List all checks (CI integrations, quality gates) for a given deployment.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      deploymentId: {
        type: 'string',
        description: 'The deployment UID',
        required: true,
      },
    },
  },

  // ─── Domains ───────────────────────────────────────────────────────────────
  {
    name: 'vercel_list_domains',
    description: "List all domains registered in the user's Vercel account.",
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {},
  },
  {
    name: 'vercel_get_domain',
    description: 'Get detailed information about a specific domain, including DNS and expiry.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      domain: {
        type: 'string',
        description: 'The domain name (e.g. example.com)',
        required: true,
      },
    },
  },
  {
    name: 'vercel_check_domain_availability',
    description: 'Check whether a domain name is available for purchase through Vercel.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      domainName: {
        type: 'string',
        description: 'The domain name to check (e.g. myapp.com)',
        required: true,
      },
    },
  },
  {
    name: 'vercel_check_domain_price',
    description: 'Get the purchase price for a domain name through Vercel.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      domainName: {
        type: 'string',
        description: 'The domain name to check pricing for (e.g. myapp.com)',
        required: true,
      },
    },
  },
  {
    name: 'vercel_list_project_domains',
    description: 'List all domains attached to a specific Vercel project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
    },
  },
  {
    name: 'vercel_add_project_domain',
    description: 'Attach a domain to a Vercel project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
      domain: {
        type: 'string',
        description: 'The domain name to attach (e.g. example.com)',
        required: true,
      },
    },
  },
  {
    name: 'vercel_remove_project_domain',
    description: 'Remove a domain from a Vercel project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
      domain: {
        type: 'string',
        description: 'The domain name to remove',
        required: true,
      },
    },
  },
  {
    name: 'vercel_verify_project_domain',
    description:
      'Trigger domain verification for a domain attached to a project. Useful after updating DNS records.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
      domain: {
        type: 'string',
        description: 'The domain name to verify',
        required: true,
      },
    },
  },

  // ─── DNS Records ───────────────────────────────────────────────────────────
  {
    name: 'vercel_list_dns_records',
    description: 'List all DNS records for a domain managed by Vercel.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      domain: {
        type: 'string',
        description: 'The domain name (e.g. example.com)',
        required: true,
      },
    },
  },
  {
    name: 'vercel_create_dns_record',
    description: 'Create a new DNS record for a Vercel-managed domain.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      domain: {
        type: 'string',
        description: 'The domain name to add the record to',
        required: true,
      },
      type: {
        type: 'string',
        description: 'Record type: A, AAAA, CNAME, MX, TXT, SRV, etc.',
        required: true,
      },
      name: {
        type: 'string',
        description: 'Subdomain or @ for the apex (e.g. "www" or "@")',
        required: true,
      },
      value: {
        type: 'string',
        description: 'Record value (e.g. IP address, target hostname, or TXT string)',
        required: true,
      },
      ttl: {
        type: 'number',
        description: 'TTL in seconds (optional, defaults to 60)',
        required: false,
      },
    },
  },
  {
    name: 'vercel_delete_dns_record',
    description: 'Delete a DNS record from a Vercel-managed domain.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      domain: {
        type: 'string',
        description: 'The domain name',
        required: true,
      },
      recordId: {
        type: 'string',
        description: 'The DNS record ID (from vercel_list_dns_records)',
        required: true,
      },
    },
  },

  // ─── Certificates ──────────────────────────────────────────────────────────
  {
    name: 'vercel_list_certs',
    description: 'List SSL certificates in the Vercel account, optionally filtered by domain name.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      domain: {
        type: 'string',
        description: 'Optional domain name to filter certificates',
        required: false,
      },
    },
  },
  {
    name: 'vercel_issue_cert',
    description:
      "Issue a new SSL certificate for one or more domains. Vercel will provision it via Let's Encrypt.",
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      domains: {
        type: 'array',
        description:
          'Array of domain names to issue a cert for (e.g. ["example.com", "www.example.com"])',
        required: true,
      },
    },
  },
  {
    name: 'vercel_delete_cert',
    description: 'Delete an SSL certificate by its ID.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      certId: {
        type: 'string',
        description: 'The certificate ID to delete',
        required: true,
      },
    },
  },

  // ─── Environment Variables ─────────────────────────────────────────────────
  {
    name: 'vercel_list_env_vars',
    description: 'List all environment variables for a Vercel project (values are not decrypted).',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
    },
  },
  {
    name: 'vercel_create_env_var',
    description: 'Create a new environment variable for a Vercel project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
      key: {
        type: 'string',
        description: 'Environment variable key (e.g. DATABASE_URL)',
        required: true,
      },
      value: {
        type: 'string',
        description: 'The value for the environment variable',
        required: true,
      },
      target: {
        type: 'array',
        description: 'Targets: production, preview, development (defaults to all)',
        required: false,
      },
      type: {
        type: 'string',
        description: 'Variable type: plain, secret, or system (defaults to plain)',
        required: false,
      },
    },
  },
  {
    name: 'vercel_update_env_var',
    description: 'Update the value or target of an existing environment variable.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
      envId: {
        type: 'string',
        description: 'The env var ID (from vercel_list_env_vars)',
        required: true,
      },
      value: {
        type: 'string',
        description: 'New value for the environment variable',
        required: false,
      },
      target: {
        type: 'array',
        description: 'New targets: production, preview, development',
        required: false,
      },
    },
  },
  {
    name: 'vercel_delete_env_var',
    description: 'Delete an environment variable from a Vercel project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID or name',
        required: true,
      },
      envId: {
        type: 'string',
        description: 'The env var ID to delete',
        required: true,
      },
    },
  },

  // ─── Aliases ───────────────────────────────────────────────────────────────
  {
    name: 'vercel_list_aliases',
    description: 'List recent deployment aliases in the Vercel account.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      limit: {
        type: 'number',
        description: 'Max number of aliases to return (default 20)',
        required: false,
      },
    },
  },
  {
    name: 'vercel_delete_alias',
    description: 'Delete a deployment alias by its ID.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      aliasId: {
        type: 'string',
        description: 'The alias UID or domain to delete',
        required: true,
      },
    },
  },

  // ─── Secrets ───────────────────────────────────────────────────────────────
  {
    name: 'vercel_list_secrets',
    description: 'List all secrets stored in the Vercel account (names only, not values).',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {},
  },
  {
    name: 'vercel_create_secret',
    description:
      'Create a new named secret in the Vercel account for use in environment variables.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      name: {
        type: 'string',
        description: 'The secret name (lowercase, no spaces)',
        required: true,
      },
      value: {
        type: 'string',
        description: 'The secret value',
        required: true,
      },
    },
  },
  {
    name: 'vercel_rename_secret',
    description: 'Rename an existing Vercel secret.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      nameOrId: {
        type: 'string',
        description: 'The existing secret name or UID',
        required: true,
      },
      newName: {
        type: 'string',
        description: 'The new name for the secret',
        required: true,
      },
    },
  },
  {
    name: 'vercel_delete_secret',
    description: 'Delete a secret from the Vercel account by name or UID.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      nameOrId: {
        type: 'string',
        description: 'The secret name or UID to delete',
        required: true,
      },
    },
  },

  // ─── Teams ─────────────────────────────────────────────────────────────────
  {
    name: 'vercel_list_teams',
    description: 'List all teams the authenticated user belongs to.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {},
  },
  {
    name: 'vercel_get_team',
    description: 'Get details about a specific Vercel team.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      teamId: {
        type: 'string',
        description: 'The team ID',
        required: true,
      },
    },
  },
  {
    name: 'vercel_list_team_members',
    description: 'List all members of a Vercel team.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      teamId: {
        type: 'string',
        description: 'The team ID',
        required: true,
      },
    },
  },
  {
    name: 'vercel_invite_team_member',
    description: 'Invite a user to a Vercel team by email address.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      teamId: {
        type: 'string',
        description: 'The team ID to invite the member to',
        required: true,
      },
      email: {
        type: 'string',
        description: 'Email address of the person to invite',
        required: true,
      },
      role: {
        type: 'string',
        description:
          'Role to assign: OWNER, MEMBER, DEVELOPER, VIEWER, BILLING (defaults to MEMBER)',
        required: false,
      },
    },
  },
  {
    name: 'vercel_remove_team_member',
    description: 'Remove a member from a Vercel team.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      teamId: {
        type: 'string',
        description: 'The team ID',
        required: true,
      },
      userId: {
        type: 'string',
        description: 'The UID of the member to remove',
        required: true,
      },
    },
  },

  // ─── Webhooks ──────────────────────────────────────────────────────────────
  {
    name: 'vercel_list_webhooks',
    description: 'List all webhooks configured in the Vercel account or team.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {},
  },
  {
    name: 'vercel_create_webhook',
    description: 'Create a new webhook to receive Vercel events at a URL.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      url: {
        type: 'string',
        description: 'The HTTPS endpoint to receive webhook events',
        required: true,
      },
      events: {
        type: 'array',
        description:
          'List of event types to subscribe to (e.g. ["deployment.created", "deployment.error"])',
        required: true,
      },
    },
  },
  {
    name: 'vercel_delete_webhook',
    description: 'Delete a webhook by its ID.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      webhookId: {
        type: 'string',
        description: 'The webhook ID to delete',
        required: true,
      },
    },
  },

  // ─── Log Drains ────────────────────────────────────────────────────────────
  {
    name: 'vercel_list_log_drains',
    description: 'List all log drain integrations configured in the account.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {},
  },
  {
    name: 'vercel_create_log_drain',
    description: 'Create a new log drain to stream Vercel logs to an external endpoint.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      name: {
        type: 'string',
        description: 'Display name for the log drain',
        required: true,
      },
      url: {
        type: 'string',
        description: 'The HTTPS endpoint to stream logs to',
        required: true,
      },
      sources: {
        type: 'array',
        description: 'Log sources to drain: lambda, static, edge, build (defaults to all)',
        required: false,
      },
      projectIds: {
        type: 'array',
        description: 'Restrict the drain to specific project IDs (defaults to all)',
        required: false,
      },
    },
  },
  {
    name: 'vercel_delete_log_drain',
    description: 'Delete a log drain by its ID.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      logDrainId: {
        type: 'string',
        description: 'The log drain ID to delete',
        required: true,
      },
    },
  },

  // ─── Edge Config ───────────────────────────────────────────────────────────
  {
    name: 'vercel_list_edge_configs',
    description: 'List all Edge Config stores in the Vercel account.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {},
  },
  {
    name: 'vercel_get_edge_config_items',
    description: 'Retrieve all key-value items stored inside a specific Edge Config.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      edgeConfigId: {
        type: 'string',
        description: 'The Edge Config ID or slug',
        required: true,
      },
    },
  },
  {
    name: 'vercel_create_edge_config',
    description: 'Create a new Edge Config store in the Vercel account.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      slug: {
        type: 'string',
        description: 'A unique slug identifier for the new Edge Config',
        required: true,
      },
    },
  },
  {
    name: 'vercel_delete_edge_config',
    description: 'Delete an Edge Config store and all its items.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      edgeConfigId: {
        type: 'string',
        description: 'The Edge Config ID to delete',
        required: true,
      },
    },
  },
  {
    name: 'vercel_update_edge_config_items',
    description:
      'Upsert or delete key-value items inside an Edge Config store in a single batch operation.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      edgeConfigId: {
        type: 'string',
        description: 'The Edge Config ID',
        required: true,
      },
      items: {
        type: 'array',
        description:
          'Array of operations, each with { operation: "upsert"|"delete", key: string, value?: any }',
        required: true,
      },
    },
  },

  // ─── Firewall ──────────────────────────────────────────────────────────────
  {
    name: 'vercel_get_firewall_config',
    description: 'Retrieve the current Web Application Firewall (WAF) configuration for a project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID',
        required: true,
      },
    },
  },
  {
    name: 'vercel_update_firewall_config',
    description: 'Update the WAF firewall rules and settings for a Vercel project.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      projectId: {
        type: 'string',
        description: 'The project ID',
        required: true,
      },
      firewallConfig: {
        type: 'object',
        description: 'The full firewall configuration object (rules, managed rulesets, etc.)',
        required: true,
      },
    },
  },

  // ─── Integrations ──────────────────────────────────────────────────────────
  {
    name: 'vercel_list_integrations',
    description: 'List all third-party integration configurations connected to the Vercel account.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {},
  },
  {
    name: 'vercel_delete_integration',
    description: 'Remove a third-party integration configuration from the Vercel account.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {
      integrationId: {
        type: 'string',
        description: 'The integration configuration ID to delete',
        required: true,
      },
    },
  },

  // ─── User ──────────────────────────────────────────────────────────────────
  {
    name: 'vercel_get_user',
    description: 'Get the authenticated Vercel user profile, including username and email.',
    category: 'vercel',
    connectorId: 'vercel',
    parameters: {},
  },
];
