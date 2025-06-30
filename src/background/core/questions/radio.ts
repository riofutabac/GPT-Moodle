import type Config from '../../types/config';
import type GPTAnswer from '../../types/gpt-answer';
import Logs from 'background/utils/logs';
import { extractAnswersFromResponse } from 'background/utils/normalize-text';
import { pickBestReponse } from 'background/utils/pick-best-response';

/**
 * Handle input radio elements
 * @param config
 * @param inputList
 * @param gptAnswer
 */
function handleRadio(
  config: Config,
  inputList: NodeListOf<HTMLElement>,
  gptAnswer: GPTAnswer
): boolean {
  const firstInput = inputList?.[0] as HTMLInputElement;

  // Handle the case the input is not a radio
  if (!firstInput || firstInput.type !== 'radio') {
    return false;
  }

  const possibleAnswers = Array.from(inputList)
    .map(inp => ({
      element: inp,
      value: inp?.parentElement?.textContent?.toLowerCase().trim() ?? ''
    }))
    .filter(obj => obj.value !== '');

  // Extract the actual answer from the response using smart extraction
  const extractedAnswers = extractAnswersFromResponse(gptAnswer.normalizedResponse);
  const extractedAnswer = extractedAnswers[0]; // For radio, we expect only one answer
  
  if (!extractedAnswer) return false;
  
  if (config.logs) {
    console.log('[EXTRACTED ANSWER]', extractedAnswer);
  }
  
  const bestAnswer = pickBestReponse(extractedAnswer, possibleAnswers);

  if (config.logs && bestAnswer.value) {
    Logs.bestAnswer(bestAnswer.value, bestAnswer.similarity);
  }

  // Check if we found a valid answer
  if (!bestAnswer.element) return false;

  const correctInput = bestAnswer.element as HTMLInputElement;
  if (config.mouseover) {
    correctInput.addEventListener('mouseover', () => correctInput.click(), {
      once: true
    });
  } else {
    correctInput.click();
  }

  return true;
}

export default handleRadio;
