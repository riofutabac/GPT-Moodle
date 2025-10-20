import OpenAI from 'openai';
import { isCurrentVersionSupportingImages, showMessage } from './utils';

// Importación directa de Gemini
import { GoogleGenAI } from '@google/genai';

const inputModel = document.querySelector('#model') as HTMLInputElement;
const modelsList = document.querySelector('#models') as HTMLElement;
const imagesIntegrationLine = document.querySelector('#includeImages-line') as HTMLInputElement;
const checkModelBtn = document.querySelector('#check-model') as HTMLElement;

export function checkCanIncludeImages() {
  const version = inputModel.value;
  const apiProvider = (
    document.querySelector('input[name="apiProvider"]:checked') as HTMLInputElement
  )?.value;

  if (apiProvider === 'openai' && isCurrentVersionSupportingImages(version)) {
    imagesIntegrationLine.style.display = 'flex';
  } else {
    imagesIntegrationLine.style.display = 'none';
  }
}

inputModel.addEventListener('input', checkCanIncludeImages);

export async function populateDatalistWithGptVersions() {
  const apiKey = (document.querySelector('#apiKey') as HTMLInputElement).value?.trim();
  if (!apiKey) return;

  try {
    const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
    const rep = await client.models.list();
    modelsList.innerHTML = '';
    rep.data.forEach(model => {
      if (model.id.startsWith('gpt') || model.id.startsWith('o1')) {
        const opt = document.createElement('option');
        opt.value = model.id;
        modelsList.appendChild(opt);
      }
    });
  } catch {
    // No hacer nada si falla
  }
}

async function populateDatalistWithGeminiModels() {
  const apiKey = (document.querySelector('#geminiApiKey') as HTMLInputElement).value?.trim();
  if (!apiKey) return;

  modelsList.innerHTML = '';

  // Probamos v1 y v1beta; la primera que responda, gana.
  for (const ver of ['v1', 'v1beta']) {
    try {
      const url = `https://generativelanguage.googleapis.com/${ver}/models?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url);
      if (!resp.ok) continue;

      const data = await resp.json();
      const models = Array.isArray(data.models) ? data.models : [];

      for (const m of models) {
        // m.name suele venir como "models/gemini-2.0-flash" → nos quedamos con el id corto
        const id = (m.name?.replace(/^models\//, '') || m.displayName || '').trim();
        if (!id) continue;
        const opt = document.createElement('option');
        opt.value = id;
        modelsList.appendChild(opt);
      }
      break; // si una versión respondió, no seguimos
    } catch {
      // ignoramos e intentamos la siguiente
    }
  }
}

inputModel.addEventListener('focus', async () => {
  const provider = (document.querySelector('input[name="apiProvider"]:checked') as HTMLInputElement)
    ?.value;
  if (provider === 'gemini') {
    await populateDatalistWithGeminiModels();
  } else {
    await populateDatalistWithGptVersions();
  }
});

export async function checkModel() {
  const model = inputModel.value?.trim();
  const apiProvider = (
    document.querySelector('input[name="apiProvider"]:checked') as HTMLInputElement
  ).value;

  if (!model) {
    showMessage({ msg: 'Por favor, introduce un nombre de modelo.', isError: true });
    return;
  }

  showMessage({ msg: 'Probando el modelo...', isInfinite: true, isLoading: true });

  try {
    if (apiProvider === 'gemini') {
      const geminiApiKey = (
        document.querySelector('#geminiApiKey') as HTMLInputElement
      ).value?.trim();
      if (!geminiApiKey) throw new Error('No se proporcionó una clave de API de Gemini.');

      const genAI = new GoogleGenAI({ apiKey: geminiApiKey });
      await genAI.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
      });
    } else {
      // OpenAI
      const apiKey = (document.querySelector('#apiKey') as HTMLInputElement).value?.trim();
      if (!apiKey) throw new Error('No se proporcionó una clave de API de OpenAI.');

      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      });
    }
    showMessage({ msg: '¡El modelo es válido!' });
  } catch (err: any) {
    showMessage({ msg: err.message || String(err), isError: true });
  }
}

checkModelBtn.addEventListener('click', checkModel);
