import type Config from '../../types/config';
import type GPTAnswer from '../../types/gpt-answer';
import Logs from 'background/utils/logs';
import normalizeText from 'background/utils/normalize-text';
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

  for (let i = 0; i < inputList.length; ++i) {
    if (!corrects[i]) break;

    const options = inputList[i].querySelectorAll('option');

    const possibleAnswers = Array.from(options)
      .slice(1) // We remove the first option which correspond to "Choose..."
      .map(opt => ({
        element: opt,
        value: normalizeText(opt.textContent ?? '')
      }))
      .filter(obj => obj.value !== '');

    const bestAnswer = pickBestReponse(corrects[i], possibleAnswers);

    if (config.logs && bestAnswer.value) {
      Logs.bestAnswer(bestAnswer.value, bestAnswer.similarity);
    }

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
