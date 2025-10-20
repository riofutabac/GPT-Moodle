import type Config from '../../types/config';
import type GPTAnswer from '../../types/gpt-answer';
import Logs from 'background/utils/logs';
import {
  extractAnswersFromResponse,
  extractCheckboxAnswers
} from 'background/utils/normalize-text';
import { pickBestReponse } from 'background/utils/pick-best-response';

/**
 * Handle input checkbox elements
 * @param config
 * @param inputList
 * @param gptAnswer
 */
function handleCheckbox(
  config: Config,
  inputList: NodeListOf<HTMLElement>,
  gptAnswer: GPTAnswer
): boolean {
  const firstInput = inputList?.[0] as HTMLInputElement;

  // Handle the case the input is not a checkbox
  if (!firstInput || firstInput.type !== 'checkbox') {
    return false;
  }

  const possibleAnswers = Array.from(inputList)
    .map(inp => ({
      element: inp as HTMLInputElement,
      value: inp?.parentElement?.textContent?.toLowerCase().trim() ?? ''
    }))
    .filter(obj => obj.value !== '');

  // Extract all valid answers from the response using the smart extraction
  // Try checkbox-specific extraction first (for YES/NO questions)
  let extractedAnswers = extractCheckboxAnswers(gptAnswer.normalizedResponse);

  // If no YES/NO answers found, use general extraction
  if (extractedAnswers.length === 0) {
    extractedAnswers = extractAnswersFromResponse(gptAnswer.normalizedResponse);
  }

  // Find the best answers elements
  const correctElements: Set<HTMLInputElement> = new Set();
  for (const extractedAnswer of extractedAnswers) {
    const bestAnswer = pickBestReponse(extractedAnswer, possibleAnswers);

    if (config.logs && bestAnswer.value) {
      Logs.bestAnswer(bestAnswer.value, bestAnswer.similarity);
    }

    // Only add if we found a valid element
    if (bestAnswer.element) {
      correctElements.add(bestAnswer.element as HTMLInputElement);
    }
  }

  // Check if it should be checked or not
  for (const element of possibleAnswers.map((e: { element: HTMLInputElement }) => e.element)) {
    const needAction =
      (element.checked && !correctElements.has(element)) ||
      (!element.checked && correctElements.has(element));

    const action = () => needAction && element.click();

    if (config.mouseover) {
      element.addEventListener('mouseover', action, {
        once: true
      });
    } else {
      action();
    }
  }

  return true;
}

export default handleCheckbox;
