export function formatDue(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatTask(task, index) {
  const done = task.status === 'completed';
  const lines = [
    `${index}. ${done ? '~~' : ''}**${task.title ?? '(Untitled)'}**${done ? '~~' : ''} ${done ? '✅' : ''}`,
    `   ID: \`${task.id}\``,
    task.notes
      ? `   Notes: ${task.notes.slice(0, 100)}${task.notes.length > 100 ? '...' : ''}`
      : '',
    task.due ? `   Due: ${formatDue(task.due)}` : '',
    done && task.completed ? `   Completed: ${formatDue(task.completed)}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isOverdue(task) {
  if (!task.due || task.status === 'completed') return false;
  return new Date(task.due) < startOfDay();
}

export function isDueToday(task) {
  if (!task.due || task.status === 'completed') return false;
  const due = new Date(task.due);
  return due >= startOfDay() && due <= endOfDay();
}

export function isDueThisWeek(task) {
  if (!task.due || task.status === 'completed') return false;
  const due = new Date(task.due);
  const weekOut = endOfDay(new Date(Date.now() + 6 * 24 * 60 * 60 * 1000));
  return due >= startOfDay() && due <= weekOut;
}

export async function resolveTasks(credentials, task_list_id, { showCompleted = false } = {}) {
  if (task_list_id) {
    const tasks = await TasksAPI.listTasks(credentials, task_list_id, {
      showCompleted,
      maxResults: 100,
    });
    return tasks.map((t) => ({ ...t, _listId: task_list_id }));
  }
  const lists = await TasksAPI.listTaskLists(credentials);
  const results = await Promise.all(
    lists.map(async (l) => {
      const tasks = await TasksAPI.listTasks(credentials, l.id, { showCompleted, maxResults: 100 });
      return tasks.map((t) => ({ ...t, _listId: l.id, _listTitle: l.title }));
    }),
  );
  return results.flat();
}
