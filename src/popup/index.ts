// src/popup/index.ts

import { globalData, inputsCheckbox, modes, inputsText } from './data';
import { checkCanIncludeImages, populateDatalistWithGptVersions } from './gpt-version';
import { handleModeChange } from './mode-handler';
import './version';
import './settings';
import { showMessage } from './utils';

const saveBtn = document.querySelector('.save')!;

// --- Lógica para mostrar/ocultar campos de API ---
const openAIConfig = document.getElementById('openai_config')!;
const geminiConfig = document.getElementById('gemini_config')!;
const apiProviderRadios = document.querySelectorAll('input[name="apiProvider"]');
const providerLabels = document.querySelectorAll('.provider-option');

function updateVisibleApiKeyField() {
  const selectedProvider = (
    document.querySelector('input[name="apiProvider"]:checked') as HTMLInputElement
  )?.value;

  // Actualizar visibilidad de campos
  if (selectedProvider === 'openai') {
    openAIConfig.style.display = 'flex';
    geminiConfig.style.display = 'none';
  } else {
    openAIConfig.style.display = 'none';
    geminiConfig.style.display = 'flex';
  }

  // Actualizar clases de los labels
  providerLabels.forEach(label => {
    label.classList.remove('selected');
  });

  // Marcar el label correspondiente como seleccionado
  const selectedLabel = document.querySelector(
    `label[for="provider${selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)}"]`
  );
  if (selectedLabel) {
    selectedLabel.classList.add('selected');
  }
}

// Agregar event listeners tanto a los radios como a los labels
apiProviderRadios.forEach(radio => {
  radio.addEventListener('change', updateVisibleApiKeyField);
});

providerLabels.forEach(label => {
  label.addEventListener('click', () => {
    const forAttribute = label.getAttribute('for');
    if (forAttribute) {
      const radio = document.getElementById(forAttribute) as HTMLInputElement;
      if (radio) {
        radio.checked = true;
        updateVisibleApiKeyField();
      }
    }
  });
});

// Save the configuration
saveBtn.addEventListener('click', function () {
  const configToSave: any = {};

  inputsText.forEach(id => {
    const element = document.querySelector('#' + id) as HTMLInputElement;
    if (element) {
      configToSave[id] = element.value.trim();
    }
  });

  inputsCheckbox.forEach(id => {
    const element = document.querySelector('#' + id) as HTMLInputElement;
    configToSave[id] = element.checked && element.parentElement!.style.display !== 'none';
  });

  configToSave.apiProvider = (
    document.querySelector('input[name="apiProvider"]:checked') as HTMLInputElement
  ).value;
  configToSave.mode = globalData.actualMode;

  if (
    (configToSave.apiProvider === 'openai' && !configToSave.apiKey) ||
    (configToSave.apiProvider === 'gemini' && !configToSave.geminiApiKey) ||
    !configToSave.model
  ) {
    showMessage({ msg: 'Por favor, completa los campos requeridos.', isError: true });
    return;
  }

  chrome.storage.sync.set({ moodleGPT: configToSave });
  showMessage({ msg: 'Configuration saved' });
});

// Cargar la configuración guardada
chrome.storage.sync.get(['moodleGPT']).then(function (storage) {
  const config = storage.moodleGPT;

  if (config) {
    if (config.apiProvider) {
      const radio = document.getElementById(
        `provider${config.apiProvider.charAt(0).toUpperCase() + config.apiProvider.slice(1)}`
      ) as HTMLInputElement;
      if (radio) radio.checked = true;
    }

    if (config.mode) {
      globalData.actualMode = config.mode;
      for (const mode of modes) {
        if (mode.value === config.mode) {
          mode.classList.remove('not-selected');
        } else {
          mode.classList.add('not-selected');
        }
      }
    }

    inputsText.forEach(key => {
      if (config[key] !== undefined) {
        // Usar undefined para permitir strings vacíos
        (document.querySelector('#' + key) as HTMLInputElement).value = config[key];
      }
    });
    inputsCheckbox.forEach(key => {
      (document.querySelector('#' + key) as HTMLInputElement).checked = !!config[key];
    });
  }

  // Actualizar la UI después de cargar todo
  updateVisibleApiKeyField();
  handleModeChange();
  checkCanIncludeImages();
  populateDatalistWithGptVersions();
});
