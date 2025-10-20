import normalizeText from 'background/utils/normalize-text';
import htmlTableToString from 'background/utils/html-table-to-string';

/**
 * Normalize the question as text and add sub informations
 * @param langage
 * @param question
 * @returns
 */
function createAndNormalizeQuestion(questionContainer: HTMLElement) {
  let question = questionContainer.innerText;

  // We remove unnecessary information
  const accesshideElements: NodeListOf<HTMLElement> =
    questionContainer.querySelectorAll('.accesshide');
  for (const useless of accesshideElements) {
    question = question.replace(useless.innerText, '');
  }
  const attoText = questionContainer.querySelector('.qtype_essay_editor');
  if (attoText) {
    question = question.replace((attoText as HTMLElement).innerText, '');
  }

  // Make tables more readable for chat-gpt
  const tables: NodeListOf<HTMLTableElement> = questionContainer.querySelectorAll('.qtext table');
  for (const table of tables) {
    question = question.replace(table.innerText, '\n' + htmlTableToString(table) + '\n');
  }

  return normalizeText(question, false);
}

export default createAndNormalizeQuestion;
