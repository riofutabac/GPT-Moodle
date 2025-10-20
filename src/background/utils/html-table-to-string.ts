/**
 * Convert table to representating string table
 * @param table
 * @returns
 */
function htmlTableToString(table: HTMLTableElement) {
  const tab: string[][] = [];
  const lines = Array.from(table.querySelectorAll('tr'));
  const maxColumnsLength: number[] = [];

  lines.map(line => {
    const cells = Array.from(line.querySelectorAll('td, th'));
    const cellsContent = cells.map((cell, index) => {
      const content = cell.textContent?.trim();
      maxColumnsLength[index] = Math.max(maxColumnsLength[index] || 0, content?.length || 0);
      return content ?? '';
    });
    tab.push(cellsContent);
  });

  const jointure = ' | ';
  const headerLineLength = tab[0].length;
  const lineSeparationSize =
    maxColumnsLength.reduce((a, b) => a + b, 0) + (headerLineLength - 1) * jointure.length;
  const lineSeparation = '\n' + Array(lineSeparationSize).fill('-').join('') + '\n';

  const mappedTab = tab.map(line => {
    const mappedLine = line.map((content, index) =>
      content.padEnd(
        maxColumnsLength[index],
        '\u00A0' // For no matching with \s
      )
    );
    return mappedLine.join(jointure);
  });

  const head = mappedTab.shift();

  return head + lineSeparation + mappedTab.join('\n');
}

export default htmlTableToString;
