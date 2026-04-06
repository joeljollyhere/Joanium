import { escapeHtml, resolveModelLabel } from '../Utils/Utils.js';

export function createModelPicker({ state, primaryModelBtn, primaryModelLabel, primaryModelMenu }) {
  function closeMenu() {
    primaryModelMenu?.classList.remove('open');
    primaryModelBtn?.classList.remove('open');
  }

  function syncPrimaryModelLabel() {
    if (!primaryModelLabel) return;
    primaryModelLabel.textContent = state.primaryModel
      ? resolveModelLabel(state.allModels, state.primaryModel.provider, state.primaryModel.modelId)
      : 'Select a model...';
  }

  function buildModelMenu() {
    primaryModelMenu.innerHTML = '';

    if (!state.allModels.length) {
      primaryModelMenu.innerHTML =
        '<div style="padding:12px;font-size:12px;color:var(--text-muted)">No models. Connect a provider in Settings.</div>';
      return;
    }

    const groups = state.allModels.reduce((result, model) => {
      if (!result[model.provider]) result[model.provider] = [];
      result[model.provider].push(model);
      return result;
    }, {});

    Object.entries(groups).forEach(([groupName, models]) => {
      const headerEl = document.createElement('div');
      headerEl.className = 'agent-model-group-header';
      headerEl.textContent = groupName;
      primaryModelMenu.appendChild(headerEl);

      models.forEach((model) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className =
          'agent-model-option' +
          (model.providerId === state.primaryModel?.provider &&
          model.modelId === state.primaryModel?.modelId
            ? ' selected'
            : '');
        button.innerHTML = `
          <span>${escapeHtml(model.modelName)}</span>
          ${model.description ? `<span class="agent-model-option-desc">${escapeHtml(model.description)}</span>` : ''}`;
        button.addEventListener('click', () => {
          state.primaryModel = { provider: model.providerId, modelId: model.modelId };
          syncPrimaryModelLabel();
          closeMenu();
        });
        primaryModelMenu.appendChild(button);
      });
    });
  }

  const onPrimaryClick = (event) => {
    event.stopPropagation();
    const isOpen = primaryModelMenu?.classList.contains('open');
    primaryModelMenu?.classList.toggle('open', !isOpen);
    primaryModelBtn?.classList.toggle('open', !isOpen);

    if (!isOpen) buildModelMenu();
  };

  const onDocumentClick = (event) => {
    if (!primaryModelBtn?.contains(event.target) && !primaryModelMenu?.contains(event.target)) {
      closeMenu();
    }
  };

  primaryModelBtn?.addEventListener('click', onPrimaryClick);
  document.addEventListener('click', onDocumentClick);

  return {
    closeMenu,
    syncPrimaryModelLabel,
    cleanup() {
      primaryModelBtn?.removeEventListener('click', onPrimaryClick);
      document.removeEventListener('click', onDocumentClick);
      closeMenu();
    },
  };
}
