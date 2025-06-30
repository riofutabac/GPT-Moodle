import type Config from '../types/config';
import type GPTAnswer from '../types/gpt-answer';
import normalizeText from 'background/utils/normalize-text';
import getContentWithHistory from './get-content-with-history';
import OpenAI from 'openai';
import { fixeO1 } from '../utils/fixe-o1';

// Esta es la forma que funciona gracias al cambio en eslint.config.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/genai');

function convertToGeminiMessages(messages: any[]) {
  const geminiMessages = [];
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
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: config.model,
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
    });

    const geminiMessages = convertToGeminiMessages(contentHandler.messages);

    const result = await model.generateContent({
      contents: geminiMessages
    });

    const response = await result.response;
    responseText = response.text();
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
