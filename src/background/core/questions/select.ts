import type Config from '../../types/config';
import type GPTAnswer from '../../types/gpt-answer';
import Logs from 'background/utils/logs';
import normalizeText, {
  extractAnswersFromResponse,
  extractOrderedAnswers
} from 'background/utils/normalize-text';
import { pickBestReponse } from 'background/utils/pick-best-response';

/**
 * Handle select elements (and put in order select)
 * @param config
 * @param inputList
 * @param gptAnswer
 * @returns
 */
function handleSelect(
  config: Config,
  inputList: NodeListOf<HTMLElement>,
  gptAnswer: GPTAnswer
): boolean {
  if (inputList.length === 0 || inputList[0].tagName !== 'SELECT') return false;

  const corrects = gptAnswer.normalizedResponse.split('\n');

  if (config.logs) Logs.array(corrects);

  // 1) Intento específico de ordenamiento
  const ordered = extractOrderedAnswers(gptAnswer.normalizedResponse);

  // 2) Si no hay orden claro, caemos al extractor general
  const extractedAnswers =
    ordered.length > 0 ? ordered : extractAnswersFromResponse(gptAnswer.normalizedResponse);

  if (config.logs) {
    console.log('[EXTRACTED ANSWERS]', extractedAnswers);
  }

  for (let i = 0; i < inputList.length && i < extractedAnswers.length; ++i) {
    const extractedAnswer = extractedAnswers[i];

    const options = inputList[i].querySelectorAll('option');

    const possibleAnswers = Array.from(options)
      .slice(1) // We remove the first option which correspond to "Choose..."
      .map(opt => ({
        element: opt,
        value: normalizeText(opt.textContent ?? '')
      }))
      .filter(obj => obj.value !== '');

    const bestAnswer = pickBestReponse(extractedAnswer, possibleAnswers);

    if (config.logs && bestAnswer.value) {
      Logs.bestAnswer(bestAnswer.value, bestAnswer.similarity);
    }

    // Check if we found a valid answer
    if (!bestAnswer.element) continue;

    const correctOption = bestAnswer.element as HTMLOptionElement;
    const currentSelect = correctOption.closest('select');

    if (currentSelect === null) continue;

    if (config.mouseover) {
      currentSelect.addEventListener('click', () => (correctOption.selected = true), {
        once: true
      });
    } else {
      correctOption.selected = true;
    }
  }

  return true;
}

export default handleSelect;
