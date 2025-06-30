export const globalData = { actualMode: 'autocomplete' };

export const inputsCheckbox = [
  'logs',
  'title',
  'cursor',
  'typing',
  'mouseover',
  'infinite',
  'timeout',
  'history',
  'includeImages'
];

// inputs id
export const inputsText = ['apiKey', 'code', 'model', 'baseURL', 'maxTokens', 'geminiApiKey'];

export const mode = document.querySelector('#mode')!;
export const modes = mode.querySelectorAll('button')!;
