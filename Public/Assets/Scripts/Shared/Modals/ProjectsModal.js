import { state } from '../State.js';
import { syncModalOpenState } from '../DOM.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatRelativeDate(isoString) {
  if (!isoString) return '';

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const diff = Date.now() - date.getTime();
  const hour = 3_600_000;
  const day = 86_400_000;

  if (diff < hour) return 'Just now';
  if (diff < day) return `${Math.max(1, Math.round(diff / hour))}h ago`;
  if (diff < 7 * day) return `${Math.max(1, Math.round(diff / day))}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function initProjectsModal({
  onProjectOpen = async () => false,
  onProjectRemoved = async () => {},
  onClose = () => {},
} = {}) {
  const backdrop = document.getElementById('projects-modal-backdrop');
  const closeBtn = document.getElementById('projects-close');
  const listEl = document.getElementById('project-list');
  const nameInput = document.getElementById('project-name-input');
  const pathInput = document.getElementById('project-path-input');
  const contextInput = document.getElementById('project-context-input');
  const pathBtn = document.getElementById('project-path-btn');
  const createBtn = document.getElementById('project-create-btn');
  const statusEl = document.getElementById('project-create-status');

  const editBackdrop = document.getElementById('edit-project-backdrop');
  const editCloseBtn = document.getElementById('edit-project-close');
  const editNameInput = document.getElementById('project-edit-name-input');
  const editPathInput = document.getElementById('project-edit-path-input');
  const editContextInput = document.getElementById('project-edit-context-input');
  const editPathBtn = document.getElementById('project-edit-path-btn');
  const editSaveBtn = document.getElementById('project-edit-save-btn');
  const editCancelBtn = document.getElementById('project-edit-cancel-btn');
  const editStatusEl = document.getElementById('project-edit-status');

  const confirmBackdrop = document.getElementById('global-confirm-backdrop');
  const confirmTitle = document.getElementById('global-confirm-title');
  const confirmCopy = document.getElementById('global-confirm-copy');
  const confirmCancel = document.getElementById('global-confirm-cancel');
  const confirmAction = document.getElementById('global-confirm-action');

  if (!backdrop || !listEl) {
    return {
      open() {},
      close() {},
      isOpen: () => false,
      refreshProjects: async () => [],
    };
  }

  let projects = [];
  let editingProject = null;

  function showConfirm(title, copy) {
    return new Promise((resolve) => {
      if (!confirmBackdrop) return resolve(window.confirm(`${title}\n\n${copy}`));
      confirmTitle.textContent = title;
      confirmCopy.textContent = copy;
      confirmBackdrop.classList.add('open');

      const cleanup = () => {
        confirmCancel?.removeEventListener('click', onCancel);
        confirmAction?.removeEventListener('click', onAction);
        confirmBackdrop.classList.remove('open');
      };

      const onCancel = () => { cleanup(); resolve(false); };
      const onAction = () => { cleanup(); resolve(true); };

      confirmCancel?.addEventListener('click', onCancel);
      confirmAction?.addEventListener('click', onAction);
    });
  }

  function setStatus(message = '', tone = '') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `project-status${tone ? ` ${tone}` : ''}`;
  }

  function clearForm() {
    if (nameInput) nameInput.value = '';
    if (pathInput) pathInput.value = '';
    if (contextInput) contextInput.value = '';
  }

  async function chooseFolder() {
    const defaultPath = pathInput?.value?.trim() || state.activeProject?.rootPath || undefined;
    const result = await window.electronAPI?.selectDirectory?.({ defaultPath });
    if (result?.ok && result.path && pathInput) {
      pathInput.value = result.path;
    }
  }

  function renderProjectList() {
    if (!listEl) return;

    if (!projects.length) {
      listEl.innerHTML = '<div class="project-empty">No projects yet. Create one to keep its folder, notes, and chats together.</div>';
      return;
    }

    listEl.innerHTML = '';

    projects.forEach(project => {
      const item = document.createElement('article');
      item.className = `project-item${state.activeProject?.id === project.id ? ' active' : ''}${project.folderExists ? '' : ' is-missing'}`;

      const context = project.context?.trim() || 'No saved project notes yet.';
      const lastOpened = formatRelativeDate(project.lastOpenedAt ?? project.updatedAt);

      item.innerHTML = `
        <div class="project-item-main">
          <div class="project-item-head">
            <div class="project-item-title">${escapeHtml(project.name)}</div>
            <div class="project-item-badges">
              ${state.activeProject?.id === project.id ? '<span class="project-badge current">Current</span>' : ''}
              ${project.folderExists ? '' : '<span class="project-badge missing">Missing folder</span>'}
            </div>
          </div>
          <div class="project-item-path">${escapeHtml(project.rootPath)}</div>
          <div class="project-item-context">${escapeHtml(context)}</div>
          <div class="project-item-context">${lastOpened ? `Last opened ${escapeHtml(lastOpened)}` : ''}</div>
        </div>
        <div class="project-item-actions">
          <button class="project-icon-btn project-open-btn" type="button" title="Open project">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="project-icon-btn project-edit-btn" type="button" title="Edit project">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="project-icon-btn project-delete-btn" type="button" title="Remove project">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      `;

      item.querySelector('.project-open-btn')?.addEventListener('click', async () => {
        const opened = await onProjectOpen(project);
        if (opened) close();
      });

      item.querySelector('.project-edit-btn')?.addEventListener('click', () => {
        editingProject = project;
        if (editNameInput) editNameInput.value = project.name || '';
        if (editPathInput) editPathInput.value = project.rootPath || '';
        if (editContextInput) editContextInput.value = project.context || '';
        if (editStatusEl) editStatusEl.textContent = '';
        if (editBackdrop) editBackdrop.classList.add('open');
      });

      item.querySelector('.project-delete-btn')?.addEventListener('click', async () => {
        const confirmed = await showConfirm(
          'Remove project',
          `Remove "${project.name}" from Romelson and delete its saved project chats? Your local folder will not be touched.`
        );
        if (!confirmed) return;

        const result = await window.electronAPI?.deleteProject?.(project.id);
        if (!result?.ok) {
          setStatus(result?.error || 'Could not remove the project.', 'error');
          return;
        }

        if (state.activeProject?.id === project.id) {
          await onProjectRemoved(project);
        }

        setStatus(`Removed ${project.name}.`, 'success');
        await refreshProjects();
      });

      listEl.appendChild(item);
    });
  }

  async function refreshProjects() {
    try {
      projects = (await window.electronAPI?.getProjects?.()) ?? [];
    } catch {
      projects = [];
    }
    renderProjectList();
    return projects;
  }

  async function handleCreate() {
    const name = nameInput?.value?.trim() ?? '';
    const rootPath = pathInput?.value?.trim() ?? '';
    const context = contextInput?.value?.trim() ?? '';

    if (!name) {
      setStatus('Project name is required.', 'error');
      nameInput?.focus();
      return;
    }

    if (!rootPath) {
      setStatus('Choose a local directory for this project.', 'error');
      pathBtn?.focus();
      return;
    }

    setStatus('Creating project...');
    const result = await window.electronAPI?.createProject?.({ name, rootPath, context });
    if (!result?.ok || !result.project) {
      setStatus(result?.error || 'Could not create the project.', 'error');
      return;
    }

    clearForm();
    setStatus(`Created ${result.project.name}.`, 'success');
    await refreshProjects();
    const opened = await onProjectOpen(result.project);
    if (opened) close();
  }

  async function handleEditSave() {
    if (!editingProject) return;
    const name = editNameInput?.value?.trim() ?? '';
    const rootPath = editPathInput?.value?.trim() ?? '';
    const context = editContextInput?.value?.trim() ?? '';

    if (!name || !rootPath) {
      if (editStatusEl) {
        editStatusEl.textContent = 'Name and path are required.';
        editStatusEl.className = 'project-status error';
      }
      return;
    }

    if (editStatusEl) {
      editStatusEl.textContent = 'Saving...';
      editStatusEl.className = 'project-status';
    }

    const result = await window.electronAPI?.updateProject?.(editingProject.id, { name, rootPath, context });
    if (!result?.ok) {
      if (editStatusEl) {
        editStatusEl.textContent = result?.error || 'Could not update the project.';
        editStatusEl.className = 'project-status error';
      }
      return;
    }

    if (editBackdrop) editBackdrop.classList.remove('open');
    editingProject = null;
    await refreshProjects();
  }

  async function open() {
    backdrop.classList.add('open');
    syncModalOpenState();
    setStatus('');
    await refreshProjects();
    requestAnimationFrame(() => nameInput?.focus());
  }

  function close() {
    backdrop.classList.remove('open');
    syncModalOpenState();
    onClose();
  }

  function isOpen() {
    return backdrop.classList.contains('open');
  }

  closeBtn?.addEventListener('click', close);
  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) close();
  });
  pathBtn?.addEventListener('click', chooseFolder);
  createBtn?.addEventListener('click', handleCreate);

  const closeEdit = () => {
    if (editBackdrop) editBackdrop.classList.remove('open');
    editingProject = null;
  };

  editCancelBtn?.addEventListener('click', closeEdit);
  editCloseBtn?.addEventListener('click', closeEdit);

  editSaveBtn?.addEventListener('click', handleEditSave);
  editPathBtn?.addEventListener('click', async () => {
    const defaultPath = editPathInput?.value?.trim() || undefined;
    const result = await window.electronAPI?.selectDirectory?.({ defaultPath });
    if (result?.ok && result.path && editPathInput) {
      editPathInput.value = result.path;
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) close();
  });

  window.addEventListener('ow:project-changed', () => {
    if (isOpen()) refreshProjects();
  });

  return {
    open,
    close,
    isOpen,
    refreshProjects,
  };
}
