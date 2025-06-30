/**
 * Normlize text
 * @param text
 */
function normalizeText(text: string, toLowerCase: boolean = true) {
  if (toLowerCase) text = text.toLowerCase();

  const normalizedText = text
    .replace(/\n+/gi, '\n') //remove duplicate new lines
    .replace(/(\n\s*\n)+/g, '\n') //remove useless white space from textcontent
    .replace(/[ \t]+/gi, ' ') //replace multiples space or tabs by a space
    .trim()
    // We remove the following content because sometimes ChatGPT will reply: "answer d"
    .replace(/^[a-z\d]\.\s/gi, '') //a. text, b. text, c. text, 1. text, 2. text, 3.text
    .replace(/\n[a-z\d]\.\s/gi, '\n'); //same but with new line

  return normalizedText;
}

/**
 * Check if line should be skipped as introductory text
 */
function isIntroductoryLine(line: string): boolean {
  const lower = line.toLowerCase();
  return lower.includes('here are the solutions') ||
         lower.includes('here is the correct order') ||
         lower.includes('based on the options') ||
         lower.includes('the roles') ||
         lower.includes('you\'ve correctly identified') ||
         lower.includes('here\'s the breakdown') ||
         lower.includes('from your list') ||
         lower.includes('what is an informatician') ||
         lower.includes('choose...');
}

/**
 * Extract answers from a complete GPT response that may contain multiple question-answer pairs
 * @param response - The complete normalized response from GPT
 * @returns Array of extracted answers only
 */
export function extractAnswersFromResponse(response: string): string[] {
  const lines = response.split('\n');
  const answers: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and introductory text
    if (!trimmedLine || isIntroductoryLine(trimmedLine)) continue;
    
    // Check if this line has bold markdown (likely an answer)
    const boldMatch = /\*\*([^*]+)\*\*/.exec(trimmedLine);
    if (boldMatch) {
      const answer = boldMatch[1].trim();
      // Skip question marks and explanatory text
      if (answer !== '?' && !answer.toLowerCase().includes('yes.') && !answer.toLowerCase().includes('no.')) {
        answers.push(answer);
        continue;
      }
    }
    
    // For bullet points with bold answers like "* **25**"
    const bulletBoldMatch = /^\*\s*\*\*([^*]+)\*\*/.exec(trimmedLine);
    if (bulletBoldMatch) {
      answers.push(bulletBoldMatch[1].trim());
      continue;
    }
    
    // For simple numbers or short answers
    if (/^\d+$/.test(trimmedLine) && trimmedLine.length <= 2) {
      answers.push(trimmedLine);
      continue;
    }
    
    // For single word answers that might not have bold formatting
    if (trimmedLine.toLowerCase() === 'true' || trimmedLine.toLowerCase() === 'false') {
      answers.push(trimmedLine.toLowerCase());
    }
  }
  
  return answers;
}

/**
 * Extract answers for checkbox questions that have YES/NO explanations
 * @param response - The complete normalized response from GPT
 * @returns Array of correct answers only (filters out the NO answers)
 */
export function extractCheckboxAnswers(response: string): string[] {
  const lines = response.split('\n');
  const answers: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and introductory text
    if (!trimmedLine || isIntroductoryLine(trimmedLine)) continue;
    
    // Look for lines with bold text followed by YES/NO explanations
    const yesPattern = /\*\*([^*]+):\s*yes\./i;
    const yesMatch = yesPattern.exec(trimmedLine);
    if (yesMatch) {
      answers.push(yesMatch[1].trim());
      continue;
    }
    
    // Look for bullet points with YES answers
    const bulletYesPattern = /^\*\s*\*\*([^*]+):\*\*\s*\*\*yes\.\*\*/i;
    const bulletYesMatch = bulletYesPattern.exec(trimmedLine);
    if (bulletYesMatch) {
      answers.push(bulletYesMatch[1].trim());
      continue;
    }
    
    // Skip NO answers explicitly
    if (trimmedLine.toLowerCase().includes(': **no.**') || 
        trimmedLine.toLowerCase().includes(':** **no.**')) {
      continue;
    }
  }
  
  return answers;
}

/**
 * Extract answer from a response line that might contain equations or explanations
 * @param line - The response line to extract answer from
 * @returns The cleaned answer
 */
export function extractAnswer(line: string): string {
  const originalLine = line;
  
  // Skip introductory lines that don't contain answers
  if (
    line.toLowerCase().includes('here are the solutions') ||
    line.toLowerCase().includes('the solutions are') ||
    line.toLowerCase().includes('based on the options') ||
    line.toLowerCase().includes('the roles') ||
    line.toLowerCase().includes('here is the correct order') ||
    line.toLowerCase().includes('the correct order') ||
    line.trim() === ''
  ) {
    return '';
  }

  // Remove markdown formatting first
  line = line.replace(/\*\*/g, '');

  // For math equations, extract the result after = sign
  const equationRegex = /=\s*([^=\s]+)\s*$/;
  const equationMatch = equationRegex.exec(line);
  if (equationMatch) {
    return equationMatch[1].trim();
  }

  // Check if this line has bold markdown (likely an answer)
  const boldContentRegex = /\*\*([^*]+)\*\*/;
  const boldMatch = boldContentRegex.exec(originalLine);
  if (boldMatch) {
    return boldMatch[1].trim();
  }

  // For bullet points with asterisks like "* Systems Administrator: ..."
  const bulletRegex = /^\*\s*([^:]+):/;
  const bulletMatch = bulletRegex.exec(line);
  if (bulletMatch) {
    return bulletMatch[1].trim();
  }

  // For lines that start with explanation text, try to extract the key part
  // Match patterns like "Systems Administrator: Managing and..." -> "Systems Administrator"
  const colonRegex = /^([^:]+):/;
  const colonMatch = colonRegex.exec(line);
  if (colonMatch) {
    return colonMatch[1].trim();
  }

  // Skip lines that look like question descriptions
  if (line.toLowerCase().includes('i am a') || 
      line.toLowerCase().includes('i produce') ||
      line.toLowerCase().includes('write java') ||
      line.toLowerCase().includes('compile the') ||
      line.toLowerCase().includes('execute the')) {
    return '';
  }

  // Return the line as is if no special pattern found, but only if it seems like an answer
  const trimmed = line.trim();
  if (trimmed.length > 0 && trimmed.length < 20) { // Likely a short answer
    return trimmed;
  }

  return '';
}

export default normalizeText;
