import { createExecutor } from '../Shared/createExecutor.js';

const SUB_AGENT_TOOL_NAME = 'spawn_sub_agents';
const MAX_SUB_AGENTS = 20;
const SUB_AGENT_INITIAL_TIMEOUT_MS = 200_000; // 200 seconds
const SUB_AGENT_COLLAB_TIMEOUT_MS = 200_000; // 200 seconds

const READ_ONLY_TERMINAL_TOOLS = new Set([
  'inspect_workspace',
  'search_workspace',
  'find_file_by_name',
  'assess_shell_command',
  'read_local_file',
  'extract_file_text',
  'read_file_chunk',
  'read_multiple_local_files',
  'list_directory',
  'list_directory_tree',
  'git_status',
  'git_diff',
  'run_project_checks',
]);

const BLOCKED_TOOL_NAMES = new Set([
  SUB_AGENT_TOOL_NAME,
  'run_shell_command',
  'write_file',
  'apply_file_patch',
  'replace_lines_in_file',
  'insert_into_file',
  'create_folder',
  'copy_item',
  'move_item',
  'git_create_branch',
  'open_folder',
  'start_local_server',
  'delete_item',
]);

const SAFE_BROWSER_TOOL_RE =
  /^browser_(?:navigate|snapshot|get_state|list_|read_|find_|wait_for_text|wait_for_element|back|forward|refresh|scroll|screenshot)/;

function truncateText(value, maxChars = 400) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text.length > maxChars ? `${text.slice(0, maxChars - 3)}...` : text;
}

function summarizeText(value, maxChars = 260) {
  return truncateText(String(value ?? '').replace(/\s+/g, ' '), maxChars);
}

function compactAgentResult(agent = {}) {
  return {
    id: String(agent.id ?? ''),
    title: truncateText(agent.title, 140),
    goal: truncateText(agent.goal, 1_500),
    deliverable: truncateText(agent.deliverable, 1_000),
    status: ['pending', 'running', 'completed', 'error', 'aborted'].includes(agent.status)
      ? agent.status
      : 'pending',
    startedAt: agent.startedAt ?? null,
    finishedAt: agent.finishedAt ?? null,
    reasoning: truncateText(agent.reasoning, 12_000),
    logs: (Array.isArray(agent.logs) ? agent.logs : []).slice(-40).map((log) => ({
      id: String(log.id ?? ''),
      text: truncateText(log.text, 320),
      status: ['pending', 'success', 'error'].includes(log.status) ? log.status : 'pending',
    })),
    toolOutputs: (Array.isArray(agent.toolOutputs) ? agent.toolOutputs : [])
      .slice(-8)
      .map((output) => truncateText(output, 6_000)),
    finalReply: truncateText(agent.finalReply, 16_000),
    summary: summarizeText(agent.summary || agent.finalReply, 320),
    usage: {
      inputTokens: Number(agent.usage?.inputTokens ?? 0) || 0,
      outputTokens: Number(agent.usage?.outputTokens ?? 0) || 0,
    },
    provider: truncateText(agent.provider, 80),
    modelId: truncateText(agent.modelId, 120),
  };
}

function parseTasks(rawTasks) {
  let parsed = rawTasks;

  if (typeof rawTasks === 'string') {
    const text = rawTasks.trim();
    if (!text) return [];

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text
        .split('\n')
        .map((line) => line.replace(/^[\-\*\d\.\)\s]+/, '').trim())
        .filter(Boolean)
        .map((goal, index) => ({
          title: `Sub-agent ${index + 1}`,
          goal,
        }));
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((task, index) => {
      if (typeof task === 'string') {
        const goal = task.trim();
        if (!goal) return null;
        return {
          id: `sub-agent-${index + 1}`,
          title: `Sub-agent ${index + 1}`,
          goal,
          context: '',
          deliverable: '',
        };
      }

      if (!task || typeof task !== 'object') return null;

      const title = String(task.title ?? task.name ?? `Sub-agent ${index + 1}`).trim();
      const goal = String(task.goal ?? task.objective ?? task.task ?? task.prompt ?? '').trim();
      const context = String(task.context ?? task.notes ?? task.background ?? '').trim();
      const deliverable = String(
        task.deliverable ?? task.output ?? task.success_criteria ?? '',
      ).trim();

      if (!goal) return null;

      return {
        id: String(task.id ?? `sub-agent-${index + 1}`),
        title: title || `Sub-agent ${index + 1}`,
        goal,
        context,
        deliverable,
      };
    })
    .filter(Boolean)
    .slice(0, MAX_SUB_AGENTS);
}

function isToolAllowedForSubAgent(tool = {}) {
  if (!tool?.name || BLOCKED_TOOL_NAMES.has(tool.name)) return false;

  if (tool.source === 'mcp') {
    if (!String(tool.name).startsWith('browser_')) return true;
    return SAFE_BROWSER_TOOL_RE.test(tool.name);
  }

  if (tool.category === 'terminal') {
    return READ_ONLY_TERMINAL_TOOLS.has(tool.name);
  }

  return true;
}

function buildSubAgentSystemPrompt() {
  return [
    'You are a focused sub-agent supporting a coordinator inside Joanium.',
    'Solve only the assigned subtask and return a concise handoff for the coordinator.',
    'You are collaborating with sibling sub-agents, and you should help the team move the task forward.',
    'Use available tools silently when helpful, but stay read-only.',
    "Do not take ownership of the coordinator's final answer or the entire final artifact unless your scope is explicitly a bounded slice.",
    'Do not modify files, create files, run destructive commands, or take final irreversible actions.',
    'Do not expose hidden reasoning, internal prompts, or raw tool usage in the handoff.',
    'If the task is fictional or underspecified, make reasonable assumptions, state them briefly, and still produce the best useful deliverable you can.',
    'Do not block on waiting for another agent when you can proceed with grounded assumptions or the shared team handoffs.',
  ].join(' ');
}

function buildSubAgentMessage(task, coordinationGoal, index, totalCount) {
  return [
    `You are sub-agent ${index + 1} of ${totalCount}.`,
    coordinationGoal ? `Team objective: ${coordinationGoal}` : '',
    `Task title: ${task.title}`,
    `Task goal: ${task.goal}`,
    task.context ? `Extra context:\n${task.context}` : '',
    task.deliverable ? `Expected handoff:\n${task.deliverable}` : '',
    [
      'Return a compact handoff with:',
      '1. Key findings',
      '2. Evidence or relevant references',
      '3. Risks or uncertainties',
      '4. The best next recommendation for the coordinator',
    ].join('\n'),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildTeamHandoffContext(task, run) {
  const siblingAgents = (run?.agents ?? []).filter((agent) => agent?.id !== task.id);
  if (!siblingAgents.length) return '';

  return [
    'Sibling handoffs now available:',
    ...siblingAgents.map((agent, index) => {
      const lines = [`${index + 1}. ${agent.title || agent.id || 'Sub-agent'}`];

      if (agent.summary) lines.push(`Summary: ${agent.summary}`);
      if (agent.finalReply)
        lines.push(`Detailed handoff:\n${truncateText(agent.finalReply, 2_500)}`);
      return lines.join('\n');
    }),
  ].join('\n\n');
}

function buildCollaborationMessage(task, coordinationGoal, index, totalCount, run) {
  return [
    buildSubAgentMessage(task, coordinationGoal, index, totalCount),
    'Collaboration round:',
    'Use the team handoffs below to improve or complete your deliverable now.',
    'Do not answer by saying you need another agent to continue; their current handoffs are already provided below.',
    buildTeamHandoffContext(task, run),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildSeedMessages(
  task,
  coordinationGoal,
  index,
  totalCount,
  priorAgent = null,
  run = null,
) {
  const messages = [
    {
      role: 'user',
      content: buildSubAgentMessage(task, coordinationGoal, index, totalCount),
      attachments: [],
    },
  ];

  if (priorAgent?.finalReply) {
    messages.push({
      role: 'assistant',
      content: truncateText(priorAgent.finalReply, 6_000),
      attachments: [],
    });
  }

  if (run) {
    messages.push({
      role: 'user',
      content: buildCollaborationMessage(task, coordinationGoal, index, totalCount, run),
      attachments: [],
    });
  }

  return messages;
}

function shouldRerunWithTeamHandoffs(agent = {}) {
  if (!agent) return false;
  if (agent.status === 'error' || agent.status === 'aborted') return true;

  const haystack = `${agent.summary ?? ''}\n${agent.finalReply ?? ''}`.toLowerCase();
  if (!haystack.trim()) return false;

  return [
    'waiting for',
    'need another agent',
    'need the other agent',
    'need agent 1',
    'need agent 2',
    'need agent 3',
    'need sibling',
    'missing source materials',
    'missing source material',
    'missing required inputs',
    'required inputs',
    'from agent 1',
    'from agent 2',
    'from agent 3',
    'from agents 1 and 2',
    'cannot proceed',
    'lack the required inputs',
    'lack the required input',
    'once these materials are provided',
    'coordinator action required',
  ].some((pattern) => haystack.includes(pattern));
}

function buildRunSummary(run) {
  const completed = run.agents.filter((agent) => agent.status === 'completed').length;
  const errored = run.agents.filter((agent) => agent.status === 'error').length;
  const aborted = run.agents.filter((agent) => agent.status === 'aborted').length;

  const parts = [`Delegated ${run.agents.length} sub-agent${run.agents.length === 1 ? '' : 's'}`];
  if (completed) parts.push(`${completed} completed`);
  if (errored) parts.push(`${errored} errored`);
  if (aborted) parts.push(`${aborted} stopped`);
  return parts.join(' | ');
}

function buildSynthesis(run, synthesisStyle = 'brief') {
  const lines = [];
  const style = String(synthesisStyle ?? 'brief')
    .trim()
    .toLowerCase();

  if (style === 'comparison') {
    lines.push('Delegated comparisons:');
  } else if (style === 'action_items') {
    lines.push('Delegated action items:');
  } else {
    lines.push('Delegated handoff:');
  }

  run.agents.forEach((agent) => {
    const summary = agent.summary || summarizeText(agent.finalReply, 320) || buildRunSummary(run);
    lines.push(`- ${agent.title}: ${summary}`);
  });

  const issues = run.agents.filter(
    (agent) => agent.status === 'error' || agent.status === 'aborted',
  );
  if (issues.length) {
    lines.push('');
    lines.push('Open issues:');
    issues.forEach((agent) => {
      lines.push(
        `- ${agent.title}: ${agent.summary || 'The delegated run did not complete cleanly.'}`,
      );
    });
  }

  return lines.join('\n');
}

function createDelegatedLive(runId, task, hooks = {}, initialRecord = null) {
  const record = {
    id: task.id,
    title: task.title,
    goal: task.goal,
    deliverable: task.deliverable,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    reasoning: '',
    logs: [],
    toolOutputs: [],
    finalReply: '',
    summary: '',
    usage: { inputTokens: 0, outputTokens: 0 },
    provider: '',
    modelId: '',
    ...(initialRecord ?? {}),
  };
  record.status = 'running';

  let logCounter = 0;

  hooks.onSubAgentEvent?.({
    type: 'agent-start',
    runId,
    agentId: record.id,
    title: record.title,
    goal: record.goal,
    deliverable: record.deliverable,
    startedAt: record.startedAt,
  });

  return {
    snapshot() {
      return {
        ...record,
        logs: record.logs.map((log) => ({ ...log })),
        toolOutputs: [...record.toolOutputs],
        usage: { ...record.usage },
      };
    },

    push(line) {
      const logId = `${record.id}-log-${++logCounter}`;
      const text = truncateText(line, 320);
      record.logs.push({ id: logId, text, status: 'pending' });
      hooks.onSubAgentEvent?.({
        type: 'agent-log-add',
        runId,
        agentId: record.id,
        logId,
        text,
      });

      return {
        done: (success = true, nextLine = '') => {
          const finalText = truncateText(nextLine || text, 320);
          const status = success ? 'success' : 'error';
          const existing = record.logs.find((log) => log.id === logId);
          if (existing) {
            existing.text = finalText;
            existing.status = status;
          }

          hooks.onSubAgentEvent?.({
            type: 'agent-log-update',
            runId,
            agentId: record.id,
            logId,
            text: finalText,
            status,
          });
        },
      };
    },

    showToolOutput(markdown) {
      const text = truncateText(markdown, 6_000);
      record.toolOutputs.push(text);
      hooks.onSubAgentEvent?.({
        type: 'agent-tool-output',
        runId,
        agentId: record.id,
        markdown: text,
      });
    },

    showPhotoGallery(gallery = {}) {
      const count = Array.isArray(gallery.photos) ? gallery.photos.length : 0;
      this.showToolOutput(
        `Photo gallery shown for "${gallery.query ?? 'query'}" with ${count} result${count === 1 ? '' : 's'}.`,
      );
    },

    streamThinking(chunk) {
      const text = String(chunk ?? '');
      if (!text) return;
      record.reasoning = truncateText(`${record.reasoning}${text}`, 12_000);
      hooks.onSubAgentEvent?.({
        type: 'agent-reasoning',
        runId,
        agentId: record.id,
        chunk: text,
      });
    },

    finalize(markdown, usage, provider, modelId) {
      record.status = 'completed';
      record.finishedAt = new Date().toISOString();
      record.finalReply = truncateText(markdown, 16_000);
      record.summary = summarizeText(markdown, 320);
      record.usage = {
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
      };
      record.provider = provider?.provider ?? '';
      record.modelId = modelId ?? '';

      hooks.onSubAgentEvent?.({
        type: 'agent-complete',
        runId,
        agentId: record.id,
        summary: record.summary,
        finalReply: record.finalReply,
        usage: record.usage,
        provider: record.provider,
        modelId: record.modelId,
        finishedAt: record.finishedAt,
      });
    },

    set(markdown) {
      this.finalize(markdown, record.usage, { provider: record.provider }, record.modelId);
    },

    setAborted() {
      record.status = 'aborted';
      record.finishedAt = new Date().toISOString();
      record.summary = 'The delegated run was stopped before completion.';
      hooks.onSubAgentEvent?.({
        type: 'agent-aborted',
        runId,
        agentId: record.id,
        summary: record.summary,
        finishedAt: record.finishedAt,
      });
    },
  };
}

function createScopedSignal(parentSignal = null, timeoutMs = SUB_AGENT_INITIAL_TIMEOUT_MS) {
  const controller = new AbortController();
  let timedOut = false;

  const onParentAbort = () => {
    if (!controller.signal.aborted) controller.abort();
  };

  if (parentSignal) {
    if (parentSignal.aborted) controller.abort();
    else parentSignal.addEventListener('abort', onParentAbort, { once: true });
  }

  const timer = setTimeout(() => {
    timedOut = true;
    if (!controller.signal.aborted) controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup() {
      clearTimeout(timer);
      parentSignal?.removeEventListener?.('abort', onParentAbort);
    },
  };
}

async function runDelegatedPass({
  agentLoop,
  tasks,
  coordinationGoal,
  runId,
  hooks,
  priorRun = null,
  timeoutMs = SUB_AGENT_INITIAL_TIMEOUT_MS,
}) {
  const results = await Promise.allSettled(
    tasks.map(async (task, index) => {
      const priorAgent = priorRun?.agents?.find((agent) => agent.id === task.id) ?? null;
      const delegatedLive = createDelegatedLive(runId, task, hooks, priorAgent);
      const scopedSignal = createScopedSignal(hooks.signal ?? null, timeoutMs);

      try {
        const result = await agentLoop(
          buildSeedMessages(task, coordinationGoal, index, tasks.length, priorAgent, priorRun),
          delegatedLive,
          [],
          [],
          buildSubAgentSystemPrompt(),
          scopedSignal.signal,
          {
            toolFilter: isToolAllowedForSubAgent,
          },
        );

        const nextAgent = compactAgentResult({
          ...delegatedLive.snapshot(),
          status: 'completed',
          finalReply: result.text,
          summary: summarizeText(result.text, 320),
          usage: result.usage ?? delegatedLive.snapshot().usage,
          provider: result.usedProvider?.provider ?? delegatedLive.snapshot().provider,
          modelId: result.usedModel ?? delegatedLive.snapshot().modelId,
        });
        scopedSignal.cleanup();
        return nextAgent;
      } catch (error) {
        const isAbort = error?.name === 'AbortError';
        const timedOut = scopedSignal.didTimeout();
        scopedSignal.cleanup();
        const failed = compactAgentResult({
          ...delegatedLive.snapshot(),
          status: timedOut ? 'error' : isAbort ? 'aborted' : 'error',
          finishedAt: new Date().toISOString(),
          summary: timedOut
            ? summarizeText(
                `Timed out after ${Math.round(timeoutMs / 1000)}s while preparing the delegated handoff.`,
                320,
              )
            : isAbort
              ? 'The delegated run was stopped before completion.'
              : summarizeText(error?.message ?? 'Unknown delegated failure', 320),
          finalReply: timedOut
            ? `Delegated run timed out after ${Math.round(timeoutMs / 1000)} seconds.`
            : isAbort
              ? delegatedLive.snapshot().finalReply
              : `Delegated run failed: ${error?.message ?? 'Unknown error'}`,
        });

        hooks.onSubAgentEvent?.({
          type: timedOut ? 'agent-error' : isAbort ? 'agent-aborted' : 'agent-error',
          runId,
          agentId: task.id,
          summary: failed.summary,
          error: failed.finalReply,
          finishedAt: failed.finishedAt,
        });

        return priorAgent?.status === 'completed' ? priorAgent : failed;
      }
    }),
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;

    const priorAgent = priorRun?.agents?.find((agent) => agent.id === tasks[index]?.id);
    if (priorAgent?.status === 'completed') return priorAgent;

    return compactAgentResult({
      id: tasks[index]?.id ?? `sub-agent-${index + 1}`,
      title: tasks[index]?.title ?? `Sub-agent ${index + 1}`,
      goal: tasks[index]?.goal ?? '',
      deliverable: tasks[index]?.deliverable ?? '',
      status: 'error',
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      reasoning: '',
      logs: [],
      toolOutputs: [],
      finalReply: `Delegated run failed: ${result.reason?.message ?? 'Unknown error'}`,
      summary: summarizeText(result.reason?.message ?? 'Unknown delegated failure', 320),
      usage: { inputTokens: 0, outputTokens: 0 },
      provider: '',
      modelId: '',
    });
  });
}

export const { handles, execute } = createExecutor({
  name: 'SubAgentsExecutor',
  tools: [SUB_AGENT_TOOL_NAME],
  handlers: {
    [SUB_AGENT_TOOL_NAME]: async (params, onStage, hooks = {}) => {
      const tasks = parseTasks(params.tasks);
      if (!tasks.length) {
        throw new Error('spawn_sub_agents requires at least one valid delegated task.');
      }

      const coordinationGoal =
        String(params.coordination_goal ?? '').trim() ||
        'Help the coordinator finish the user request by combining focused delegated handoffs.';
      const synthesisStyle = String(params.synthesis_style ?? 'brief').trim() || 'brief';
      const runId = `delegation-${Date.now()}`;

      hooks.onSubAgentEvent?.({
        type: 'session-start',
        runId,
        coordinationGoal,
        summary: `Launching ${tasks.length} focused sub-agent${tasks.length === 1 ? '' : 's'}...`,
      });

      onStage(`Delegating to ${tasks.length} sub-agent${tasks.length === 1 ? '' : 's'}...`);

      const { agentLoop } = await import('../../Core/Agent.js');

      const run = {
        type: 'subagent_run',
        runId,
        coordinationGoal,
        summary: '',
        synthesis: '',
        agents: [],
      };

      run.agents = await runDelegatedPass({
        agentLoop,
        tasks,
        coordinationGoal,
        runId,
        hooks,
        timeoutMs: SUB_AGENT_INITIAL_TIMEOUT_MS,
      });

      const collaborationTasks = tasks.filter((task) =>
        shouldRerunWithTeamHandoffs(run.agents.find((agent) => agent.id === task.id)),
      );

      if (collaborationTasks.length > 0) {
        hooks.onSubAgentEvent?.({
          type: 'session-start',
          runId,
          coordinationGoal,
          summary: `Initial handoffs complete. Running a collaboration pass for ${collaborationTasks.length} sub-agent${collaborationTasks.length === 1 ? '' : 's'}...`,
        });

        const collaborationResults = await runDelegatedPass({
          agentLoop,
          tasks: collaborationTasks,
          coordinationGoal,
          runId,
          hooks,
          priorRun: run,
          timeoutMs: SUB_AGENT_COLLAB_TIMEOUT_MS,
        });

        const collaborationMap = new Map(collaborationResults.map((agent) => [agent.id, agent]));
        run.agents = run.agents.map((agent) => collaborationMap.get(agent.id) ?? agent);
      }

      run.summary = buildRunSummary(run);
      run.synthesis = buildSynthesis(run, synthesisStyle);

      hooks.onSubAgentEvent?.({
        type: 'session-complete',
        runId,
        summary: run.summary,
        synthesis: run.synthesis,
      });

      return `[SUBAGENT_RESULT]${JSON.stringify(run)}`;
    },
  },
});
