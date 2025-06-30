import OpenAI from 'openai';
import { isCurrentVersionSupportingImages, showMessage } from './utils';

// Esta es la forma que funciona gracias al cambio en eslint.config.js
const { GoogleGenerativeAI } = require('@google/genai');

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

inputModel.addEventListener('focus', populateDatalistWithGptVersions);

export async function checkModel() {
  const model = inputModel.value?.trim();
  const apiProvider = (
    document.querySelector('input[name="apiProvider"]:checked') as HTMLInputElement
  ).value;

  if (!model) {
    showMessage({ msg: 'Por favor, introduce un nombre de modelo.', isError: true });
    return;
  }

  showMessage({ msg: 'Probando el modelo...', isInfinite: true, isError: false });

  try {
    if (apiProvider === 'gemini') {
      const geminiApiKey = (
        document.querySelector('#geminiApiKey') as HTMLInputElement
      ).value?.trim();
      if (!geminiApiKey) throw new Error('No se proporcionó una clave de API de Gemini.');

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const geminiModel = genAI.getGenerativeModel({ model });
      await geminiModel.generateContent('Test');
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
