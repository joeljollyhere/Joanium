/* ══════════════════════════════════════════
   MODEL SELECTOR
══════════════════════════════════════════ */
import { state, modelLabel, modelDropdown, modelSelectorBtn } from './Root.js';

function normalizeInputs(inputs = {}) {
    return {
        text: inputs.text !== false,
        image: Boolean(inputs.image),
        pdf: Boolean(inputs.pdf),
        docx: Boolean(inputs.docx),
    };
}

export function getSelectedModelInfo() {
    return state.selectedProvider?.models?.[state.selectedModel] ?? null;
}

export function getModelInputs(provider = state.selectedProvider, modelId = state.selectedModel) {
    return normalizeInputs(provider?.models?.[modelId]?.inputs);
}

export function modelSupportsInput(kind, provider = state.selectedProvider, modelId = state.selectedModel) {
    return Boolean(getModelInputs(provider, modelId)[kind]);
}

export function notifyModelSelectionChanged() {
    window.dispatchEvent(new CustomEvent('ow:model-selection-changed', {
        detail: {
            provider: state.selectedProvider,
            modelId: state.selectedModel,
            model: getSelectedModelInfo(),
            inputs: getModelInputs(),
        },
    }));
}

export async function loadProviders() {
    try {
        const all = await window.electronAPI?.getModels() ?? [];
        const previousProviderId = state.selectedProvider?.provider ?? null;
        const previousModelId = state.selectedModel ?? null;

        state.allProviders = all;
        state.providers = all.filter((provider) => provider.api && provider.api.trim() !== '');

        if (state.providers.length === 0) {
            state.selectedProvider = null;
            state.selectedModel = null;
            if (modelLabel) modelLabel.textContent = 'No API keys set';
            if (modelDropdown) modelDropdown.innerHTML = '';
            notifyModelSelectionChanged();
            return;
        }

        const nextProvider =
            state.providers.find((provider) => provider.provider === previousProviderId) ?? state.providers[0];
        const nextModelId =
            (previousModelId && nextProvider.models?.[previousModelId] && previousModelId) ||
            Object.keys(nextProvider.models)[0];

        state.selectedProvider = nextProvider;
        state.selectedModel = nextModelId;
        updateModelLabel();
        buildModelDropdown();
        notifyModelSelectionChanged();
    } catch (err) {
        console.warn('[openworld] Could not load models:', err);
        state.allProviders = [];
        state.providers = [];
        state.selectedProvider = null;
        state.selectedModel = null;
        if (modelLabel) modelLabel.textContent = 'openworld 1.0';
        if (modelDropdown) modelDropdown.innerHTML = '';
        notifyModelSelectionChanged();
    }
}

export function updateModelLabel() {
    if (!state.selectedProvider || !state.selectedModel) {
        if (modelLabel) modelLabel.textContent = 'No API keys set';
        return;
    }
    const name = state.selectedProvider.models[state.selectedModel]?.name ?? state.selectedModel;
    if (modelLabel) modelLabel.textContent = name;
}

export function buildModelDropdown() {
    if (!modelDropdown) return;
    modelDropdown.innerHTML = '';

    state.providers.forEach(provider => {
        const section = document.createElement('div');
        section.className = 'model-group';

        const header = document.createElement('div');
        header.className = 'model-group-header';
        header.textContent = provider.label;
        section.appendChild(header);

        Object.entries(provider.models).forEach(([modelId, info]) => {
            const item = document.createElement('button');
            item.className = 'model-item';
            const isActive = state.selectedProvider?.provider === provider.provider && state.selectedModel === modelId;
            if (isActive) item.classList.add('active');

            item.innerHTML = `
        <span class="model-item-name">${info.name}</span>
        <span class="model-item-desc">${info.description}</span>`;

            item.addEventListener('click', () => {
                state.selectedProvider = provider;
                state.selectedModel = modelId;
                updateModelLabel();
                buildModelDropdown();
                modelDropdown.classList.remove('open');
                notifyModelSelectionChanged();
            });

            section.appendChild(item);
        });

        modelDropdown.appendChild(section);
    });
}

modelSelectorBtn?.addEventListener('click', e => {
    e.stopPropagation();
    if (state.providers.length === 0) return;
    modelDropdown.classList.toggle('open');
});
