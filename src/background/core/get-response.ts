import type Config from '../types/config';
import type GPTAnswer from '../types/gpt-answer';
import normalizeText from 'background/utils/normalize-text';
import getContentWithHistory from './get-content-with-history';
import OpenAI from 'openai';
import { fixeO1 } from '../utils/fixe-o1';

// Importación directa de Gemini
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

function convertToGeminiMessages(messages: any[]): { role: string; parts: { text: string }[] }[] {
  const geminiMessages: { role: string; parts: { text: string }[] }[] = [];
  const startIndex = messages[0]?.role === 'system' ? 1 : 0;

  for (let i = startIndex; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts = [{ text: msg.content as string }];
    geminiMessages.push({ role, parts });
  }
  return geminiMessages;
}

async function getChatGPTResponse(
  config: Config,
  questionElement: HTMLElement,
  question: string
): Promise<GPTAnswer> {
  const controller = new AbortController();
  const timeoutControler = setTimeout(() => controller.abort(), 20 * 1000);

  const contentHandler = await getContentWithHistory(config, questionElement, question);
  let responseText = '';

  if (config.apiProvider === 'gemini' && config.geminiApiKey) {
    const genAI = new GoogleGenAI({ apiKey: config.geminiApiKey });
    const geminiMessages = convertToGeminiMessages(contentHandler.messages);

    const geminiParams: any = {
      model: config.model,
      contents: geminiMessages,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE
        }
      ]
    };

    const result = await genAI.models.generateContent(geminiParams);

    responseText = result.text || '';
  } else {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      dangerouslyAllowBrowser: true
    });

    const req = await client.chat.completions.create(
      fixeO1(config.model, {
        model: config.model,
        messages: contentHandler.messages,
        temperature: 0.1,
        top_p: 0.6,
        presence_penalty: 0,
        max_tokens: config.maxTokens || 2000
      }),
      { signal: config.timeout ? controller.signal : null }
    );
    responseText = req.choices[0].message.content ?? '';
  }

  clearTimeout(timeoutControler);

  if (typeof contentHandler.saveResponse === 'function') {
    contentHandler.saveResponse(responseText);
  }

  return {
    question,
    response: responseText,
    normalizedResponse: normalizeText(responseText)
  };
}

export default getChatGPTResponse;
