type BestResponse = {
  similarity: number;
  value: string | null;
  element: HTMLElement | null;
};

type ResponsesBySimilarity = {
  similarity: number;
  value: string;
  element: HTMLElement;
};

// --- NUEVO: normalización robusta (acentos, puntuación, espacios) ---
function normalizeTextForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD') // separa acentos
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .replace(/[^a-z0-9\s]/g, ' ') // quita signos duros
    .replace(/\s+/g, ' ') // compacta espacios
    .trim();
}

/**
 * Calculate the levenshtein distance between two sentence
 * @param str1
 * @param str2
 * @returns
 */
function levenshteinDistance(str1: string, str2: string) {
  str1 = normalizeTextForMatch(str1).replace(/\s+/g, '');
  str2 = normalizeTextForMatch(str2).replace(/\s+/g, '');

  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;

  const matrix: number[][] = Array.from({ length: str1.length + 1 }, () => []);
  for (let i = 0; i <= str1.length; ++i) {
    matrix[i][0] = i;
    for (let j = 1; j <= str2.length; ++j) {
      matrix[i][j] =
        i === 0
          ? j
          : Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + (str1[i - 1] === str2[j - 1] ? 0 : 1)
            );
    }
  }
  return matrix[str1.length][str2.length];
}

/**
 * Calculate the similarity between two sentences from 0 to 1 (best)
 * @param str1
 * @param str2
 * @returns
 */
function charSimilarity(str1: string, str2: string) {
  const la = normalizeTextForMatch(str1);
  const lb = normalizeTextForMatch(str2);
  const L = Math.max(la.length, lb.length) || 1;
  return (L - levenshteinDistance(la, lb)) / L;
}

// --- NUEVO: similitud léxica (Dice) ---
function tokenDiceCoefficient(a: string, b: string) {
  const A = new Set(normalizeTextForMatch(a).split(' ').filter(Boolean));
  const B = new Set(normalizeTextForMatch(b).split(' ').filter(Boolean));
  if (A.size === 0 && B.size === 0) return 1;
  const inter = [...A].filter(x => B.has(x)).length;
  return (2 * inter) / (A.size + B.size || 1);
}

// --- NUEVO: score híbrido más estable ---
function hybridSimilarity(a: string, b: string) {
  const c = charSimilarity(a, b);
  const t = tokenDiceCoefficient(a, b);
  return 0.6 * c + 0.4 * t; // ponderación conservadora
}

/**
 * Pick the best sentence that correspond to the answer
 * @param arr
 * @param answer
 * @returns
 */
export function pickBestReponse(
  answer: string,
  arr: { element: HTMLElement; value: string }[]
): BestResponse {
  let bestResponse: BestResponse = {
    element: null,
    similarity: 0,
    value: null
  };
  for (const obj of arr) {
    const similarity = hybridSimilarity(obj.value, answer);
    if (similarity === 1) {
      return { element: obj.element, value: obj.value, similarity };
    }
    if (similarity > bestResponse.similarity) {
      bestResponse = { element: obj.element, value: obj.value, similarity };
    }
  }
  return bestResponse;
}

/**
 * Return the sentences sorted by score with a score superior or equal to what is asked
 * @param answer
 * @param arr
 * @param score
 * @returns
 */
export function pickResponsesWithSimilarityGreaterThan(
  answer: string,
  arr: { element: HTMLElement; value: string }[],
  score: number
): ResponsesBySimilarity[] {
  const responses: ResponsesBySimilarity[] = [];
  for (const obj of arr) {
    const similarity = hybridSimilarity(obj.value, answer);
    if (similarity >= score)
      responses.push({
        similarity,
        value: obj.value,
        element: obj.element
      });
  }
  return responses.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Convert a number to a readable string pourcentage
 * @param similarity
 */
export function toPourcentage(similarity: number): string {
  return Math.round(similarity * 10000) / 100 + '%';
}
