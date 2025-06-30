// Quick test of the extractAnswer function
function extractAnswer(line) {
  // Remove markdown formatting first
  line = line.replace(/\*\*/g, '');
  
  // Skip introductory lines that don't contain answers
  if (line.toLowerCase().includes('here are the solutions') || 
      line.toLowerCase().includes('the solutions are') ||
      line.toLowerCase().includes('based on the options') ||
      line.toLowerCase().includes('the roles') ||
      line.trim() === '') {
    return '';
  }
  
  // For math equations, extract the result after = sign
  const equationRegex = /=\s*([^=\s]+)\s*$/;
  const equationMatch = equationRegex.exec(line);
  if (equationMatch) {
    return equationMatch[1].trim();
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
  
  // For patterns like "**Systems Administrator**" that might remain
  const boldRegex = /\*\*([^*]+)\*\*/;
  const boldMatch = boldRegex.exec(line);
  if (boldMatch) {
    return boldMatch[1].trim();
  }
  
  // Return the line as is if no special pattern found
  return line.trim();
}

// Test cases from the log examples
const testCases = [
  'here are the solutions:',
  '5 * 5 = **25**',
  '20 - 10 = **10**',
  '10 + 10 = **20**',
  '* **systems administrator:** managing and maintaining computer systems and networks.',
  '* **software developer:** designing, coding, testing, and maintaining software applications.',
  'a **professional chef** is not a role related to informatics. their work is in the culinary arts, not information science or technology.'
];

console.log('Testing extractAnswer function:');
testCases.forEach((testCase, index) => {
  const result = extractAnswer(testCase);
  console.log(`${index + 1}. "${testCase}" -> "${result}"`);
});
