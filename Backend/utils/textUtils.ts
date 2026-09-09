// small text helpers shared by the actionable-review gate and the rule engine

// strip accents + lowercase so things like sautéed still match sauteed
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z]+/)
    .filter(Boolean);
}

// dead simple plural handling, enough for food words (tomatoes -> tomato, berries -> berry)
export function singularize(word: string): string {
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("oes") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

export function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(part => part.trim())
    .filter(Boolean);
}

// squashes accidental repeats like "cheese cheese" after a replacement
export function collapseDuplicateWords(line: string): string {
  return line.replace(/\b(\w+)(\s+\1\b)+/gi, "$1");
}