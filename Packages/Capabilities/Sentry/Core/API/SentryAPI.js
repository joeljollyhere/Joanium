const BASE = 'https://sentry.io/api/0';

function headers(creds) {
  return { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' };
}

async function sFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? `Sentry API error: ${res.status}`);
  }
  return res.json();
}

async function sMutate(path, creds, method = 'PUT', body = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(creds),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? `Sentry API error: ${res.status}`);
  }
  return res.json();
}

// ─── Organizations ────────────────────────────────────────────────────────────

export async function listOrganizations(creds) {
  const orgs = await sFetch('/organizations/', creds);
  return (orgs ?? []).map((o) => ({
    id: o.id,
    slug: o.slug,
    name: o.name,
    dateCreated: o.dateCreated,
    status: o.status?.id ?? 'active',
  }));
}

/** GET /organizations/{org_slug}/ */
export async function getOrganization(creds, orgSlug) {
  const o = await sFetch(`/organizations/${orgSlug}/`, creds);
  return {
    id: o.id,
    slug: o.slug,
    name: o.name,
    dateCreated: o.dateCreated,
    memberCount: o.memberCount,
    features: o.features ?? [],
    status: o.status?.id ?? 'active',
  };
}

/** GET /organizations/{org_slug}/members/ */
export async function listMembers(creds, orgSlug) {
  const members = await sFetch(`/organizations/${orgSlug}/members/`, creds);
  return (members ?? []).map((m) => ({
    id: m.id,
    email: m.email,
    name: m.name,
    role: m.role,
    roleName: m.roleName,
    dateCreated: m.dateCreated,
  }));
}

/** GET /organizations/{org_slug}/teams/ */
export async function listTeams(creds, orgSlug) {
  const teams = await sFetch(`/organizations/${orgSlug}/teams/`, creds);
  return (teams ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    memberCount: t.memberCount,
    dateCreated: t.dateCreated,
  }));
}

/** GET /organizations/{org_slug}/environments/ */
export async function listEnvironments(creds, orgSlug) {
  const envs = await sFetch(`/organizations/${orgSlug}/environments/`, creds);
  return (envs ?? []).map((e) => ({ id: e.id, name: e.name }));
}

/** GET /organizations/{org_slug}/stats_v2/ */
export async function getOrgStats(creds, orgSlug) {
  const params = new URLSearchParams({
    field: 'sum(quantity)',
    category: 'error',
    interval: '1d',
    statsPeriod: '14d',
  });
  const data = await sFetch(`/organizations/${orgSlug}/stats_v2/?${params}`, creds);
  return data;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function listProjects(creds, orgSlug) {
  const projects = await sFetch(`/organizations/${orgSlug}/projects/`, creds);
  return (projects ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    platform: p.platform ?? 'unknown',
    status: p.status,
    dateCreated: p.dateCreated,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/ */
export async function getProject(creds, orgSlug, projectSlug) {
  const p = await sFetch(`/projects/${orgSlug}/${projectSlug}/`, creds);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    platform: p.platform ?? 'unknown',
    status: p.status,
    dateCreated: p.dateCreated,
    team: p.team ? { id: p.team.id, slug: p.team.slug, name: p.team.name } : null,
    latestRelease: p.latestRelease
      ? { version: p.latestRelease.version, dateCreated: p.latestRelease.dateCreated }
      : null,
  };
}

/** GET /projects/{org_slug}/{project_slug}/issues/ */
export async function listProjectIssues(creds, orgSlug, projectSlug, limit = 25) {
  const issues = await sFetch(
    `/projects/${orgSlug}/${projectSlug}/issues/?query=is:unresolved&limit=${limit}&sort=date`,
    creds,
  );
  return (issues ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    level: i.level,
    count: i.count,
    userCount: i.userCount,
    firstSeen: i.firstSeen,
    lastSeen: i.lastSeen,
    permalink: i.permalink,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/events/ */
export async function listProjectEvents(creds, orgSlug, projectSlug, limit = 25) {
  const events = await sFetch(`/projects/${orgSlug}/${projectSlug}/events/?limit=${limit}`, creds);
  return (events ?? []).map((e) => ({
    id: e.id,
    eventID: e.eventID,
    title: e.title,
    platform: e.platform,
    dateCreated: e.dateCreated,
    groupID: e.groupID,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/releases/ */
export async function listProjectReleases(creds, orgSlug, projectSlug, limit = 25) {
  const releases = await sFetch(
    `/projects/${orgSlug}/${projectSlug}/releases/?limit=${limit}`,
    creds,
  );
  return (releases ?? []).map((r) => ({
    version: r.version,
    dateCreated: r.dateCreated,
    dateReleased: r.dateReleased,
    newGroups: r.newGroups,
    commitCount: r.commitCount,
    deployCount: r.deployCount,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/rules/ */
export async function listAlertRules(creds, orgSlug, projectSlug) {
  const rules = await sFetch(`/projects/${orgSlug}/${projectSlug}/rules/`, creds);
  return (rules ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    conditions: (r.conditions ?? []).map((c) => c.name ?? c.id),
    actions: (r.actions ?? []).map((a) => a.name ?? a.id),
    dateCreated: r.dateCreated,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/user-feedback/ */
export async function listUserFeedback(creds, orgSlug, projectSlug, limit = 25) {
  const feedback = await sFetch(
    `/projects/${orgSlug}/${projectSlug}/user-feedback/?limit=${limit}`,
    creds,
  );
  return (feedback ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    email: f.email,
    comments: f.comments,
    dateCreated: f.dateCreated,
    issue: f.issue ? { id: f.issue.id, title: f.issue.title } : null,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/files/dsyms/ */
export async function listDsymFiles(creds, orgSlug, projectSlug) {
  const files = await sFetch(`/projects/${orgSlug}/${projectSlug}/files/dsyms/`, creds);
  return (files ?? []).map((f) => ({
    id: f.id,
    uuid: f.uuid,
    objectName: f.objectName,
    cpuName: f.cpuName,
    symbolType: f.symbolType,
    dateCreated: f.dateCreated,
    size: f.size,
  }));
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export async function listIssues(creds, orgSlug, limit = 25) {
  const issues = await sFetch(
    `/organizations/${orgSlug}/issues/?query=is:unresolved&limit=${limit}&sort=date`,
    creds,
  );
  return (issues ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    level: i.level,
    count: i.count,
    userCount: i.userCount,
    project: i.project?.slug ?? 'unknown',
    firstSeen: i.firstSeen,
    lastSeen: i.lastSeen,
    permalink: i.permalink,
  }));
}

/** GET /organizations/{org_slug}/issues/{issue_id}/ */
export async function getIssue(creds, orgSlug, issueId) {
  const i = await sFetch(`/organizations/${orgSlug}/issues/${issueId}/`, creds);
  return {
    id: i.id,
    title: i.title,
    culprit: i.culprit,
    level: i.level,
    status: i.status,
    count: i.count,
    userCount: i.userCount,
    project: i.project ? { id: i.project.id, slug: i.project.slug, name: i.project.name } : null,
    assignedTo: i.assignedTo,
    firstSeen: i.firstSeen,
    lastSeen: i.lastSeen,
    permalink: i.permalink,
    type: i.type,
    platform: i.platform,
  };
}

/** PUT /organizations/{org_slug}/issues/{issue_id}/ — resolve */
export async function resolveIssue(creds, orgSlug, issueId) {
  return sMutate(`/organizations/${orgSlug}/issues/${issueId}/`, creds, 'PUT', {
    status: 'resolved',
  });
}

/** PUT /organizations/{org_slug}/issues/{issue_id}/ — ignore */
export async function ignoreIssue(creds, orgSlug, issueId) {
  return sMutate(`/organizations/${orgSlug}/issues/${issueId}/`, creds, 'PUT', {
    status: 'ignored',
  });
}

/** PUT /organizations/{org_slug}/issues/{issue_id}/ — assign */
export async function assignIssue(creds, orgSlug, issueId, assignee) {
  return sMutate(`/organizations/${orgSlug}/issues/${issueId}/`, creds, 'PUT', {
    assignedTo: assignee,
  });
}

/** PUT /organizations/{org_slug}/issues/ — bulk update multiple issues */
export async function bulkUpdateIssues(creds, orgSlug, issueIds, update) {
  const ids = issueIds.map((id) => `id=${id}`).join('&');
  return sMutate(`/organizations/${orgSlug}/issues/?${ids}`, creds, 'PUT', update);
}

/** GET /issues/{issue_id}/events/ */
export async function listIssueEvents(creds, issueId, limit = 10) {
  const events = await sFetch(`/issues/${issueId}/events/?limit=${limit}`, creds);
  return (events ?? []).map((e) => ({
    id: e.id,
    eventID: e.eventID,
    title: e.title,
    platform: e.platform,
    dateCreated: e.dateCreated,
    user: e.user ? { id: e.user.id, email: e.user.email } : null,
  }));
}

/** GET /issues/{issue_id}/events/latest/ */
export async function getLatestEvent(creds, issueId) {
  const e = await sFetch(`/issues/${issueId}/events/latest/`, creds);
  return {
    id: e.id,
    eventID: e.eventID,
    title: e.title,
    platform: e.platform,
    dateCreated: e.dateCreated,
    message: e.message,
    user: e.user ? { id: e.user.id, email: e.user.email, ip: e.user.ipAddress } : null,
    tags: (e.tags ?? []).map((t) => ({ key: t.key, value: t.value })),
    entries: e.entries ?? [],
  };
}

/** GET /issues/{issue_id}/tags/ */
export async function listIssueTags(creds, issueId) {
  const tags = await sFetch(`/issues/${issueId}/tags/`, creds);
  return (tags ?? []).map((t) => ({
    key: t.key,
    name: t.name,
    totalValues: t.totalValues,
    topValues: (t.topValues ?? []).map((v) => ({
      value: v.value,
      count: v.count,
      firstSeen: v.firstSeen,
      lastSeen: v.lastSeen,
    })),
  }));
}

/** GET /issues/{issue_id}/hashes/ */
export async function listIssueHashes(creds, issueId) {
  const hashes = await sFetch(`/issues/${issueId}/hashes/`, creds);
  return (hashes ?? []).map((h) => ({
    id: h.id,
    latestEvent: h.latestEvent
      ? { id: h.latestEvent.id, dateCreated: h.latestEvent.dateCreated }
      : null,
  }));
}

// ─── Releases ─────────────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/releases/ */
export async function listOrgReleases(creds, orgSlug, limit = 25) {
  const releases = await sFetch(`/organizations/${orgSlug}/releases/?limit=${limit}`, creds);
  return (releases ?? []).map((r) => ({
    version: r.version,
    dateCreated: r.dateCreated,
    dateReleased: r.dateReleased,
    newGroups: r.newGroups,
    firstEvent: r.firstEvent,
    lastEvent: r.lastEvent,
    commitCount: r.commitCount,
    deployCount: r.deployCount,
    projects: (r.projects ?? []).map((p) => p.slug),
  }));
}

/** GET /organizations/{org_slug}/releases/{version}/ */
export async function getRelease(creds, orgSlug, version) {
  const r = await sFetch(
    `/organizations/${orgSlug}/releases/${encodeURIComponent(version)}/`,
    creds,
  );
  return {
    version: r.version,
    dateCreated: r.dateCreated,
    dateReleased: r.dateReleased,
    newGroups: r.newGroups,
    commitCount: r.commitCount,
    deployCount: r.deployCount,
    authors: (r.authors ?? []).map((a) => ({ name: a.name, email: a.email })),
    projects: (r.projects ?? []).map((p) => ({ id: p.id, slug: p.slug, name: p.name })),
    ref: r.ref,
    url: r.url,
  };
}

/** GET /organizations/{org_slug}/releases/{version}/deploys/ */
export async function listDeploys(creds, orgSlug, version) {
  const deploys = await sFetch(
    `/organizations/${orgSlug}/releases/${encodeURIComponent(version)}/deploys/`,
    creds,
  );
  return (deploys ?? []).map((d) => ({
    id: d.id,
    environment: d.environment,
    dateStarted: d.dateStarted,
    dateFinished: d.dateFinished,
    name: d.name,
    url: d.url,
  }));
}

// ─── Teams ────────────────────────────────────────────────────────────────────

/** GET /teams/{org_slug}/{team_slug}/projects/ */
export async function listTeamProjects(creds, orgSlug, teamSlug) {
  const projects = await sFetch(`/teams/${orgSlug}/${teamSlug}/projects/`, creds);
  return (projects ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    platform: p.platform ?? 'unknown',
    dateCreated: p.dateCreated,
  }));
}

// ─── Search ───────────────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/issues/?query=... */
export async function searchIssues(creds, orgSlug, query, limit = 25) {
  const params = new URLSearchParams({ query, limit, sort: 'date' });
  const issues = await sFetch(`/organizations/${orgSlug}/issues/?${params}`, creds);
  return (issues ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    level: i.level,
    count: i.count,
    userCount: i.userCount,
    project: i.project?.slug ?? 'unknown',
    firstSeen: i.firstSeen,
    lastSeen: i.lastSeen,
    permalink: i.permalink,
  }));
}

/** GET /organizations/{org_slug}/issues/?query=is:unresolved level:fatal */
export async function listFatalIssues(creds, orgSlug, limit = 25) {
  return searchIssues(creds, orgSlug, 'is:unresolved level:fatal', limit);
}

// ─── Issue Comments ───────────────────────────────────────────────────────────

/** GET /issues/{issue_id}/comments/ */
export async function listIssueComments(creds, issueId) {
  const comments = await sFetch(`/issues/${issueId}/comments/`, creds);
  return (comments ?? []).map((c) => ({
    id: c.id,
    text: c.data?.text ?? '',
    dateCreated: c.dateCreated,
    user: c.user ? { id: c.user.id, name: c.user.name, email: c.user.email } : null,
  }));
}

/** POST /issues/{issue_id}/comments/ */
export async function createIssueComment(creds, issueId, text) {
  return sMutate(`/issues/${issueId}/comments/`, creds, 'POST', { text });
}

/** DELETE /issues/{issue_id}/comments/{comment_id}/ */
export async function deleteIssueComment(creds, issueId, commentId) {
  const res = await fetch(`${BASE}/issues/${issueId}/comments/${commentId}/`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? `Sentry API error: ${res.status}`);
  }
  return { deleted: true };
}

// ─── Similar Issues ───────────────────────────────────────────────────────────

/** GET /issues/{issue_id}/similar-issues/ */
export async function listSimilarIssues(creds, issueId, limit = 10) {
  const results = await sFetch(`/issues/${issueId}/similar-issues/?limit=${limit}`, creds);
  return (results ?? []).map((item) => {
    const i = Array.isArray(item) ? item[0] : item;
    return {
      id: i.id,
      title: i.title,
      level: i.level,
      count: i.count,
      firstSeen: i.firstSeen,
      lastSeen: i.lastSeen,
      permalink: i.permalink,
    };
  });
}

// ─── Issue Attachments ────────────────────────────────────────────────────────

/** GET /issues/{issue_id}/attachments/ */
export async function listIssueAttachments(creds, issueId) {
  const attachments = await sFetch(`/issues/${issueId}/attachments/`, creds);
  return (attachments ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    mimetype: a.mimetype,
    size: a.size,
    type: a.type,
    dateCreated: a.dateCreated,
    event: a.event ? { id: a.event.id, eventID: a.event.eventID } : null,
  }));
}

// ─── Issue Tag Values ─────────────────────────────────────────────────────────

/** GET /issues/{issue_id}/tags/{key}/values/ */
export async function listIssueTagValues(creds, issueId, key, limit = 25) {
  const values = await sFetch(
    `/issues/${issueId}/tags/${encodeURIComponent(key)}/values/?limit=${limit}`,
    creds,
  );
  return (values ?? []).map((v) => ({
    value: v.value,
    count: v.count,
    firstSeen: v.firstSeen,
    lastSeen: v.lastSeen,
  }));
}

// ─── Issue Mutations ──────────────────────────────────────────────────────────

/** PUT /organizations/{org_slug}/issues/{issue_id}/ — reopen */
export async function reopenIssue(creds, orgSlug, issueId) {
  return sMutate(`/organizations/${orgSlug}/issues/${issueId}/`, creds, 'PUT', {
    status: 'unresolved',
  });
}

/** PUT /organizations/{org_slug}/issues/{issue_id}/ — bookmark / unbookmark */
export async function bookmarkIssue(creds, orgSlug, issueId, bookmark = true) {
  return sMutate(`/organizations/${orgSlug}/issues/${issueId}/`, creds, 'PUT', {
    isBookmarked: bookmark,
  });
}

/** DELETE /organizations/{org_slug}/issues/{issue_id}/ */
export async function deleteIssue(creds, orgSlug, issueId) {
  const res = await fetch(`${BASE}/organizations/${orgSlug}/issues/${issueId}/`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? `Sentry API error: ${res.status}`);
  }
  return { deleted: true };
}

// ─── Project Tags, Keys & Ownership ──────────────────────────────────────────

/** GET /projects/{org_slug}/{project_slug}/tags/ */
export async function listProjectTags(creds, orgSlug, projectSlug) {
  const tags = await sFetch(`/projects/${orgSlug}/${projectSlug}/tags/`, creds);
  return (tags ?? []).map((t) => ({
    key: t.key,
    name: t.name,
    totalValues: t.totalValues,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/keys/ */
export async function listProjectKeys(creds, orgSlug, projectSlug) {
  const keys = await sFetch(`/projects/${orgSlug}/${projectSlug}/keys/`, creds);
  return (keys ?? []).map((k) => ({
    id: k.id,
    name: k.name,
    isActive: k.isActive,
    dsn: k.dsn ? { public: k.dsn.public, csp: k.dsn.csp, security: k.dsn.security } : null,
    dateCreated: k.dateCreated,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/ownership/ */
export async function getProjectOwnership(creds, orgSlug, projectSlug) {
  const o = await sFetch(`/projects/${orgSlug}/${projectSlug}/ownership/`, creds);
  return {
    raw: o.raw ?? '',
    fallthrough: o.fallthrough ?? false,
    dateCreated: o.dateCreated,
    lastUpdated: o.lastUpdated,
  };
}

/** GET /projects/{org_slug}/{project_slug}/events/{event_id}/ */
export async function getProjectEvent(creds, orgSlug, projectSlug, eventId) {
  const e = await sFetch(`/projects/${orgSlug}/${projectSlug}/events/${eventId}/`, creds);
  return {
    id: e.id,
    eventID: e.eventID,
    title: e.title,
    platform: e.platform,
    dateCreated: e.dateCreated,
    message: e.message,
    groupID: e.groupID,
    user: e.user ? { id: e.user.id, email: e.user.email } : null,
    tags: (e.tags ?? []).map((t) => ({ key: t.key, value: t.value })),
    entries: e.entries ?? [],
  };
}

/** GET /projects/{org_slug}/{project_slug}/hooks/ */
export async function listProjectServiceHooks(creds, orgSlug, projectSlug) {
  const hooks = await sFetch(`/projects/${orgSlug}/${projectSlug}/hooks/`, creds);
  return (hooks ?? []).map((h) => ({
    id: h.id,
    url: h.url,
    status: h.status,
    events: h.events ?? [],
    dateCreated: h.dateCreated,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/releases/{version}/files/ */
export async function listReleaseFiles(creds, orgSlug, projectSlug, version) {
  const files = await sFetch(
    `/projects/${orgSlug}/${projectSlug}/releases/${encodeURIComponent(version)}/files/`,
    creds,
  );
  return (files ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    dist: f.dist,
    size: f.size,
    dateCreated: f.dateCreated,
  }));
}

// ─── Monitors (Cron Jobs) ─────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/monitors/ */
export async function listMonitors(creds, orgSlug) {
  const monitors = await sFetch(`/organizations/${orgSlug}/monitors/`, creds);
  return (monitors ?? []).map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    status: m.status,
    type: m.type,
    project: m.project?.slug ?? null,
    nextCheckIn: m.nextCheckIn,
    lastCheckIn: m.lastCheckIn,
    dateCreated: m.dateCreated,
  }));
}

/** GET /organizations/{org_slug}/monitors/{monitor_slug}/ */
export async function getMonitor(creds, orgSlug, monitorSlug) {
  const m = await sFetch(`/organizations/${orgSlug}/monitors/${monitorSlug}/`, creds);
  return {
    id: m.id,
    slug: m.slug,
    name: m.name,
    status: m.status,
    type: m.type,
    config: m.config ?? {},
    project: m.project ? { id: m.project.id, slug: m.project.slug } : null,
    nextCheckIn: m.nextCheckIn,
    lastCheckIn: m.lastCheckIn,
    dateCreated: m.dateCreated,
    environments: (m.environments ?? []).map((e) => ({
      name: e.name,
      status: e.status,
      lastCheckIn: e.lastCheckIn,
    })),
  };
}

/** GET /organizations/{org_slug}/monitors/{monitor_slug}/checkins/ */
export async function listMonitorCheckins(creds, orgSlug, monitorSlug, limit = 25) {
  const checkins = await sFetch(
    `/organizations/${orgSlug}/monitors/${monitorSlug}/checkins/?limit=${limit}`,
    creds,
  );
  return (checkins ?? []).map((c) => ({
    id: c.id,
    status: c.status,
    duration: c.duration,
    dateCreated: c.dateCreated,
    environment: c.environment,
  }));
}

// ─── Dashboards ───────────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/dashboards/ */
export async function listDashboards(creds, orgSlug) {
  const dashboards = await sFetch(`/organizations/${orgSlug}/dashboards/`, creds);
  return (dashboards ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    dateCreated: d.dateCreated,
    createdBy: d.createdBy ? { id: d.createdBy.id, name: d.createdBy.name } : null,
    widgetCount: Array.isArray(d.widgets) ? d.widgets.length : 0,
  }));
}

/** GET /organizations/{org_slug}/dashboards/{dashboard_id}/ */
export async function getDashboard(creds, orgSlug, dashboardId) {
  const d = await sFetch(`/organizations/${orgSlug}/dashboards/${dashboardId}/`, creds);
  return {
    id: d.id,
    title: d.title,
    dateCreated: d.dateCreated,
    createdBy: d.createdBy ? { id: d.createdBy.id, name: d.createdBy.name } : null,
    widgets: (d.widgets ?? []).map((w) => ({
      id: w.id,
      title: w.title,
      displayType: w.displayType,
      queries: (w.queries ?? []).map((q) => ({
        name: q.name,
        conditions: q.conditions,
        fields: q.fields,
      })),
    })),
  };
}

// ─── Saved Searches ───────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/searches/ */
export async function listSavedSearches(creds, orgSlug) {
  const searches = await sFetch(`/organizations/${orgSlug}/searches/`, creds);
  return (searches ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    query: s.query,
    type: s.type,
    isDefault: s.isDefault,
    dateCreated: s.dateCreated,
  }));
}

// ─── Integrations ─────────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/integrations/ */
export async function listIntegrations(creds, orgSlug) {
  const integrations = await sFetch(`/organizations/${orgSlug}/integrations/`, creds);
  return (integrations ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    provider: i.provider ? { key: i.provider.key, name: i.provider.name } : null,
    status: i.status,
    domainName: i.domainName,
    dateCreated: i.dateCreated,
  }));
}

// ─── Release Commits ──────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/releases/{version}/commits/ */
export async function listReleaseCommits(creds, orgSlug, version) {
  const commits = await sFetch(
    `/organizations/${orgSlug}/releases/${encodeURIComponent(version)}/commits/`,
    creds,
  );
  return (commits ?? []).map((c) => ({
    id: c.id,
    message: c.message,
    dateCreated: c.dateCreated,
    author: c.author ? { name: c.author.name, email: c.author.email } : null,
    repository: c.repository?.name ?? null,
  }));
}

// ─── Team Members & Member Details ───────────────────────────────────────────

/** GET /teams/{org_slug}/{team_slug}/members/ */
export async function listTeamMembers(creds, orgSlug, teamSlug) {
  const members = await sFetch(`/teams/${orgSlug}/${teamSlug}/members/`, creds);
  return (members ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    dateCreated: m.dateCreated,
  }));
}

/** GET /organizations/{org_slug}/members/{member_id}/ */
export async function getMember(creds, orgSlug, memberId) {
  const m = await sFetch(`/organizations/${orgSlug}/members/${memberId}/`, creds);
  return {
    id: m.id,
    email: m.email,
    name: m.name,
    role: m.role,
    roleName: m.roleName,
    dateCreated: m.dateCreated,
    pending: m.pending ?? false,
    teams: m.teams ?? [],
    teamRoles: m.teamRoles ?? [],
  };
}

// ─── Replays ──────────────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/replays/ */
export async function listReplays(creds, orgSlug, limit = 25) {
  const params = new URLSearchParams({ per_page: limit });
  const data = await sFetch(`/organizations/${orgSlug}/replays/?${params}`, creds);
  const replays = data?.data ?? data ?? [];
  return (replays ?? []).map((r) => ({
    id: r.id,
    projectId: r.project_id,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    duration: r.duration,
    countErrors: r.count_errors,
    platform: r.platform,
    user: r.user ? { id: r.user.id, email: r.user.email, ip: r.user.ip_address } : null,
    sdk: r.sdk ? { name: r.sdk.name, version: r.sdk.version } : null,
    errorIds: r.error_ids ?? [],
  }));
}

// ─── Org Activity ─────────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/activity/ */
export async function listOrgActivity(creds, orgSlug, limit = 25) {
  const activity = await sFetch(`/organizations/${orgSlug}/activity/?limit=${limit}`, creds);
  return (activity ?? []).map((a) => ({
    id: a.id,
    type: a.type,
    dateCreated: a.dateCreated,
    user: a.user ? { id: a.user.id, name: a.user.name, email: a.user.email } : null,
    issue: a.issue ? { id: a.issue.id, title: a.issue.title } : null,
    project: a.project?.slug ?? null,
    data: a.data ?? {},
  }));
}

// ─── Event Stats ──────────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/events-stats/ */
export async function getEventStats(
  creds,
  orgSlug,
  query = '',
  statsPeriod = '14d',
  interval = '1d',
) {
  const params = new URLSearchParams({ query, statsPeriod, interval, yAxis: 'count()' });
  return sFetch(`/organizations/${orgSlug}/events-stats/?${params}`, creds);
}

// ─── Sentry Apps ──────────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/sentry-apps/ */
export async function listSentryApps(creds, orgSlug) {
  const apps = await sFetch(`/organizations/${orgSlug}/sentry-apps/`, creds);
  return (apps ?? []).map((a) => ({
    uuid: a.uuid,
    slug: a.slug,
    name: a.name,
    status: a.status,
    author: a.author,
    isInternal: a.isInternal ?? false,
    scopes: a.scopes ?? [],
    datePublished: a.datePublished,
  }));
}
