export const HUBSPOT_TOOLS = [
  // ─── Contacts (existing + 5 new) ──────────────────────────────────────────
  {
    name: 'hubspot_list_contacts',
    description: "List the user's HubSpot contacts with name, email, phone, and company.",
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {},
  },
  {
    name: 'hubspot_get_contact',
    description: 'Fetch full details for a single HubSpot contact by their ID.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      id: { type: 'string', description: 'The HubSpot contact ID.', required: true },
    },
  },
  {
    name: 'hubspot_create_contact',
    description: 'Create a new contact in HubSpot CRM.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      firstname: { type: 'string', description: 'First name.' },
      lastname: { type: 'string', description: 'Last name.' },
      email: { type: 'string', description: 'Email address.' },
      phone: { type: 'string', description: 'Phone number.' },
      company: { type: 'string', description: 'Company name.' },
      jobtitle: { type: 'string', description: 'Job title.' },
    },
  },
  {
    name: 'hubspot_update_contact',
    description: 'Update properties on an existing HubSpot contact.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      id: { type: 'string', description: 'The HubSpot contact ID.', required: true },
      props: { type: 'object', description: 'Key/value properties to update.', required: true },
    },
  },
  {
    name: 'hubspot_delete_contact',
    description: 'Archive (delete) a HubSpot contact by ID.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      id: { type: 'string', description: 'The HubSpot contact ID to delete.', required: true },
    },
  },
  {
    name: 'hubspot_search_contacts',
    description: 'Search HubSpot contacts by name, email, or company using a text query.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      query: { type: 'string', description: 'Search query string.', required: true },
    },
  },

  // ─── Deals (existing + 5 new) ─────────────────────────────────────────────
  {
    name: 'hubspot_list_deals',
    description: "List the user's HubSpot deals with name, stage, amount, and close date.",
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {},
  },
  {
    name: 'hubspot_get_deal',
    description: 'Fetch full details for a single HubSpot deal by its ID.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      id: { type: 'string', description: 'The HubSpot deal ID.', required: true },
    },
  },
  {
    name: 'hubspot_create_deal',
    description: 'Create a new deal in the HubSpot CRM.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      dealname: { type: 'string', description: 'Deal name.', required: true },
      dealstage: { type: 'string', description: 'Pipeline stage ID.' },
      amount: { type: 'string', description: 'Deal value (as a string number).' },
      closedate: { type: 'string', description: 'Expected close date (ISO 8601).' },
      pipeline: { type: 'string', description: 'Pipeline ID.' },
    },
  },
  {
    name: 'hubspot_update_deal',
    description: 'Update properties on an existing HubSpot deal.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      id: { type: 'string', description: 'The HubSpot deal ID.', required: true },
      props: { type: 'object', description: 'Key/value properties to update.', required: true },
    },
  },
  {
    name: 'hubspot_delete_deal',
    description: 'Archive (delete) a HubSpot deal by ID.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      id: { type: 'string', description: 'The HubSpot deal ID to delete.', required: true },
    },
  },
  {
    name: 'hubspot_search_deals',
    description: 'Search HubSpot deals by name or keyword.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      query: { type: 'string', description: 'Search query string.', required: true },
    },
  },

  // ─── Companies (5 new) ────────────────────────────────────────────────────
  {
    name: 'hubspot_list_companies',
    description:
      "List the user's HubSpot companies with name, domain, industry, and employee count.",
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {},
  },
  {
    name: 'hubspot_get_company',
    description: 'Fetch full details for a single HubSpot company by its ID.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      id: { type: 'string', description: 'The HubSpot company ID.', required: true },
    },
  },
  {
    name: 'hubspot_create_company',
    description: 'Create a new company in HubSpot CRM.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      name: { type: 'string', description: 'Company name.', required: true },
      domain: { type: 'string', description: 'Company website domain.' },
      industry: { type: 'string', description: 'Industry.' },
      numberofemployees: { type: 'string', description: 'Number of employees.' },
      city: { type: 'string', description: 'City.' },
      country: { type: 'string', description: 'Country.' },
    },
  },
  {
    name: 'hubspot_update_company',
    description: 'Update properties on an existing HubSpot company.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      id: { type: 'string', description: 'The HubSpot company ID.', required: true },
      props: { type: 'object', description: 'Key/value properties to update.', required: true },
    },
  },
  {
    name: 'hubspot_search_companies',
    description: 'Search HubSpot companies by name, domain, or industry.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      query: { type: 'string', description: 'Search query string.', required: true },
    },
  },

  // ─── Tickets (3 new) ──────────────────────────────────────────────────────
  {
    name: 'hubspot_list_tickets',
    description: 'List open support tickets in HubSpot with subject, priority, and pipeline stage.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {},
  },
  {
    name: 'hubspot_create_ticket',
    description: 'Create a new support ticket in HubSpot.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      subject: { type: 'string', description: 'Ticket subject.', required: true },
      hs_ticket_priority: {
        type: 'string',
        description: 'Priority: LOW, MEDIUM, HIGH, or CRITICAL.',
      },
      hs_pipeline: { type: 'string', description: 'Pipeline ID.' },
      hs_pipeline_stage: { type: 'string', description: 'Pipeline stage ID.' },
    },
  },
  {
    name: 'hubspot_update_ticket',
    description: 'Update an existing HubSpot support ticket.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      id: { type: 'string', description: 'The HubSpot ticket ID.', required: true },
      props: { type: 'object', description: 'Key/value properties to update.', required: true },
    },
  },

  // ─── Notes (2 new) ────────────────────────────────────────────────────────
  {
    name: 'hubspot_list_notes',
    description: 'List recent notes logged in HubSpot CRM.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {},
  },
  {
    name: 'hubspot_create_note',
    description: 'Log a new note in HubSpot, optionally associated with a contact or deal.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      body: { type: 'string', description: 'Note content.', required: true },
      contactId: { type: 'string', description: 'Associate note with this contact ID.' },
      dealId: { type: 'string', description: 'Associate note with this deal ID.' },
      companyId: { type: 'string', description: 'Associate note with this company ID.' },
    },
  },

  // ─── Tasks (3 new) ────────────────────────────────────────────────────────
  {
    name: 'hubspot_list_tasks',
    description: 'List upcoming or open tasks in HubSpot CRM.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {},
  },
  {
    name: 'hubspot_create_task',
    description: 'Create a follow-up task in HubSpot CRM.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      hs_task_subject: { type: 'string', description: 'Task subject/title.', required: true },
      hs_timestamp: { type: 'string', description: 'Due date/time (ISO 8601).' },
      hs_task_priority: { type: 'string', description: 'Priority: LOW, MEDIUM, or HIGH.' },
      hs_task_body: { type: 'string', description: 'Task notes or description.' },
    },
  },
  {
    name: 'hubspot_update_task',
    description: 'Update an existing HubSpot task, e.g. mark it complete.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      id: { type: 'string', description: 'The HubSpot task ID.', required: true },
      props: {
        type: 'object',
        description: 'Key/value properties to update (e.g. { hs_task_status: "COMPLETED" }).',
        required: true,
      },
    },
  },

  // ─── Pipelines (2 new) ────────────────────────────────────────────────────
  {
    name: 'hubspot_list_pipelines',
    description: 'List all deal pipelines configured in HubSpot.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {},
  },
  {
    name: 'hubspot_get_pipeline_stages',
    description: 'Get all stages for a specific HubSpot deal pipeline.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      pipelineId: {
        type: 'string',
        description: 'The pipeline ID (from hubspot_list_pipelines).',
        required: true,
      },
    },
  },

  // ─── Owners (2 new) ───────────────────────────────────────────────────────
  {
    name: 'hubspot_list_owners',
    description: 'List all HubSpot CRM owners (sales reps / team members).',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {},
  },
  {
    name: 'hubspot_get_owner',
    description: 'Get details for a specific HubSpot owner by their ID.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      ownerId: { type: 'string', description: 'The HubSpot owner ID.', required: true },
    },
  },

  // ─── Associations (2 new) ─────────────────────────────────────────────────
  {
    name: 'hubspot_associate_contact_to_deal',
    description: 'Associate a HubSpot contact with a deal.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      contactId: { type: 'string', description: 'The contact ID.', required: true },
      dealId: { type: 'string', description: 'The deal ID.', required: true },
    },
  },
  {
    name: 'hubspot_associate_company_to_contact',
    description: 'Associate a HubSpot company with a contact.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      companyId: { type: 'string', description: 'The company ID.', required: true },
      contactId: { type: 'string', description: 'The contact ID.', required: true },
    },
  },
  {
    name: 'hubspot_list_associations',
    description: 'List all associated objects of a given type linked to a HubSpot record.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      fromType: {
        type: 'string',
        description: 'Object type: contacts, deals, companies, tickets.',
        required: true,
      },
      fromId: { type: 'string', description: 'The source object ID.', required: true },
      toType: {
        type: 'string',
        description: 'Target object type: contacts, deals, companies, tickets.',
        required: true,
      },
    },
  },

  // ─── Analytics & Search (2 new) ───────────────────────────────────────────
  {
    name: 'hubspot_get_deal_summary',
    description:
      'Get a pipeline summary: total deal count, total value, deals by stage, and deals closing within 30 days.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {},
  },
  {
    name: 'hubspot_search_crm',
    description:
      'Search across all HubSpot CRM objects (contacts, deals, companies) with a single query.',
    category: 'hubspot',
    connectorId: 'hubspot',
    parameters: {
      query: { type: 'string', description: 'Search query string.', required: true },
    },
  },
];
