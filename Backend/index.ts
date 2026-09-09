import crypto from "crypto";
import type { Recipe } from "@shared/interface/Recipe.interface";
import type { Tweak } from "@shared/interface/Tweak.interface";
import type { DiffAnnotation } from "@shared/interface/DiffAnnotation.interface";
import { Diff } from "@shared/enums/Diff.enum";
import { isActionableTweak } from "../utils/tweakFilter";
import {
  normalizeText,
  tokenize,
  singularize,
  splitSentences,
  collapseDuplicateWords
} from "../utils/textUtils";
import {
  INGREDIENT_STOPWORDS,
  extractIngredientWords,
  findMentionedIngredientLines
} from "../utils/ingredientMatch";
import { TECHNIQUE_WORDS, TECHNIQUE_PHRASES, TIME_OR_TEMP_REGEX } from "../utils/cookingSignals";

// rule engine that turns actionable reviews into real diffs.
// order matters: specific ingredient rules first, then generic substitution
// and quantity rewrites, then omissions (last, so indexes stay aligned while
// the other rules run), then the step synthesis fallback. the plain note only
// kicks in when we truly couldnt pull anything out of the review.

const MAX_SUBSTITUTIONS = 3;

// filler words we strip off the front of a captured replacement phrase
const FILLER_LEAD_WORDS = new Set(["a", "an", "the", "some", "my", "our", "little", "bit", "of", "fresh", "frozen"]);

// strong verbs are unmistakable substitution language. "used" is weaker so it
// gets extra scrutiny below before we rewrite anyones ingredient line
const SUB_PATTERNS: Array<{ regex: RegExp; strong: boolean }> = [
  {
    regex: /\bsubstitut\w*\s+(?:the\s+|some\s+|it\s+with\s+|them\s+with\s+)?([a-z][a-z0-9 ,'/-]{1,40}?)(?=\s+(?:for|with|instead|because|since|which|that|and|but|as|in|into|to|so|it|they|i|we|my)\b|\s*[.,!?;:]|$)/g,
    strong: true
  },
  {
    regex: /\bswap(?:ped|ping)?\s+(?:the\s+|some\s+|out\s+)?([a-z][a-z0-9 ,'/-]{1,40}?)(?=\s+(?:for|with|instead|because|that|and|but|in|to|so|it|i|we|my)\b|\s*[.,!?;:]|$)/g,
    strong: true
  },
  {
    regex: /\breplac\w*\s+(?:the\s+|some\s+)?[a-z0-9 ,'/-]{1,40}?\s+with\s+([a-z][a-z0-9 ,'/-]{1,40}?)(?=\s+(?:and|because|since|but|in|to|for|so|it|i|we)\b|\s*[.,!?;:]|$)/g,
    strong: true
  },
  {
    regex: /\bused?\s+(?:the\s+|some\s+)?([a-z][a-z0-9 ,'/-]{1,40}?)(?=\s+(?:instead|in place|rather)\b|\s*[.,!?;:]|$)/g,
    strong: false
  },
  {
    regex: /\bused?\s+(?:the\s+|some\s+)?([a-z][a-z0-9 ,'/-]{1,40}?)\s+(?=because\b)/g,
    strong: false
  }
];

const OF_PHRASE_REGEX = /\b(?:instead of|in place of|rather than|for)\s+(?:the\s+|some\s+|any\s+)?([a-z][a-z0-9 ,'/-]{1,30}?)(?=\s+(?:and|but|because|since|with|to|in|so|it|i|we|the)\b|\s*[.,!?;:]|$)/;

const QUANTITY_REGEX = /\b(?:(\d+(?:\.\d+)?)\s+)?(extra|double|doubled|half|halved|more|less)\s+(?:the\s+|some\s+|of\s+)?([a-z][a-z0-9 ,'/-]{0,40}?)(?=\s+(?:of|and|but|because|since|then|than|so|to|it|i|we|the)\b|\s*[.,!?;:]|$)/;

// absolute rewrites like "i used 2 eggs" (digits only, spelled numbers are out of scope)
const ABSOLUTE_QTY_REGEX = /\bused?\s+(?:only\s+)?(\d+(?:\.\d+)?)\b/;

const OMIT_REGEX = /(?:omitted|skipped|left out|didn't use|did not use)\s+(?:the\s+|some\s+)?([a-zA-Z\s]+?)(?:\.|,|and|$)/;

interface SubCandidate {
  replacement: string;
  // slice of text right after the capture where an "instead of X" might hide
  trailing: string;
  strong: boolean;
}

// ---------- substitution helpers ----------

function findSubstitutionCandidates(lowerText: string): SubCandidate[] {
  const found: SubCandidate[] = [];

  for (const { regex, strong } of SUB_PATTERNS) {
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(lowerText)) !== null) {
      const raw = (m[1] ?? "").trim();
      if (raw) {
        found.push({
          replacement: raw,
          trailing: lowerText.slice(m.index + m[0].length, m.index + m[0].length + 60),
          strong
        });
      }
      if (m.index === regex.lastIndex) regex.lastIndex++;
    }
  }

  // "X in place of Y" — X is the replacement, Y tells us what got tossed
  const inPlace = /\b([a-z][a-z0-9 ,'/-]{1,30}?)\s+in place of\s+([a-z][a-z0-9 ,'/-]{1,30}?)(?=\s+(?:and|but|because|since|with|to|in|so|it|i|we|the)\b|\s*[.,!?;:]|$)/.exec(lowerText);
  if (inPlace) {
    // grab them into local vars so typescript stops complaining about undefined indexes
    const p1 = inPlace[1];
    const p2 = inPlace[2];
    if (p1 && p2) {
      found.push({
        replacement: p1.trim(),
        trailing: ` instead of ${p2.trim()}`,
        strong: true
      });
    }
  }

  return found.slice(0, MAX_SUBSTITUTIONS * 2);
}

function cleanReplacementPhrase(raw: string): string {
  const words = tokenize(raw);
  let start = 0;
  while (start < words.length) {
    const w = words[start];
    // check if w exists before passing to the Set to keep strict mode happy
    if (w && FILLER_LEAD_WORDS.has(w)) {
      start++;
    } else {
      break;
    }
  }
  return words.slice(start).join(" ");
}

function looksLikeFoodPhrase(phrase: string): boolean {
  // needs at least one decent word so captures like "two" get tossed
  return tokenize(phrase).some(w => w.length >= 4);
}

function extractOfPhrase(trailing: string): string | null {
  const m = trailing.match(OF_PHRASE_REGEX);
  return m && m[1] ? m[1].trim() : null;
}

// weak verbs like "used X" only count when the phrase brings a brand new food
// word to the table, otherwise plain "i used cherry tomatoes" would rewrite itself
function introducesNewWord(replacement: string, line: string): boolean {
  const lineWords = extractIngredientWords([line]);
  return tokenize(replacement)
    .map(singularize)
    .some(w => w.length >= 4 && !lineWords.has(w) && !INGREDIENT_STOPWORDS.has(w));
}

// rebuilds an ingredient line with the reviewers replacement swapped in
function buildSubstitutedLine(line: string, replacement: string, contextWords: Set<string>): string | null {
  const lineWords = extractIngredientWords([line]);
  const replacementWords = new Set(tokenize(replacement).map(singularize));
  const replacementTokens = tokenize(replacement);

  // first choice: the head noun the replacement and the line share (tomatoes, cheese...)
  let target: string | null = null;
  for (const w of lineWords) {
    if (replacementWords.has(w)) { target = w; break; }
  }
  // otherwise the word the reviewer mentions that isnt part of the replacement (the feta case)
  if (!target) {
    for (const w of lineWords) {
      if (contextWords.has(w) && !replacementWords.has(w)) { target = w; break; }
    }
  }
  if (!target) return null;

  const tokens = line.split(/\s+/);
  let tokenIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;
    const cleaned = normalizeText(token).replace(/[^a-z]/g, "");
    if (cleaned && singularize(cleaned) === target) {
      tokenIdx = i;
      break;
    }
  }
  if (tokenIdx === -1) return null;

  // when the replacement is a phrase sharing the head noun ("roma tomatoes"),
  // swallow left-side descriptors like "cherry" so they get replaced too
  let startIdx = tokenIdx;
  const sharesHead = replacementWords.has(target);
  if (sharesHead && replacementTokens.length >= 2) {
    while (startIdx > 0) {
      const prevToken = tokens[startIdx - 1];
      if (!prevToken) break;
      const prevClean = normalizeText(prevToken).replace(/[^a-z]/g, "");
      const prevWord = singularize(prevClean);
      if (prevClean.length >= 4 && lineWords.has(prevWord) && !replacementWords.has(prevWord)) {
        startIdx--;
      } else {
        break;
      }
    }
  }

  const lastToken = tokens[tokenIdx] ?? "";
  const trailingPunct = lastToken.match(/[^a-zA-Z0-9]+$/)?.[0] ?? "";
  const rebuilt = [
    ...tokens.slice(0, startIdx),
    replacement + trailingPunct,
    ...tokens.slice(tokenIdx + 1)
  ].join(" ");

  return collapseDuplicateWords(rebuilt);
}

function applySubstitutions(
  lowerText: string,
  recipe: Recipe,
  modifiedIngredients: string[],
  diffs: DiffAnnotation[],
  blockedLines: Set<number>
): void {
  const candidates = findSubstitutionCandidates(lowerText);
  const fullReviewWords = new Set(tokenize(lowerText).map(singularize));
  let applied = 0;

  const pickFreeLine = (hits: number[]): number => {
    for (const h of hits) {
      if (!blockedLines.has(h)) return h;
    }
    return -1;
  };

  for (const cand of candidates) {
    if (applied >= MAX_SUBSTITUTIONS) break;

    const replacement = cleanReplacementPhrase(cand.replacement);
    if (!looksLikeFoodPhrase(replacement)) continue;

    const ofPhrase = extractOfPhrase(cand.trailing);
    let lineIdx = -1;
    let contextWords: Set<string> = fullReviewWords;

    // 1) explicit "instead of Y" style phrase right after the replacement
    if (ofPhrase) {
      const hits = findMentionedIngredientLines(ofPhrase, recipe.ingredients);
      const free = pickFreeLine(hits);
      if (free !== -1) {
        lineIdx = free;
        contextWords = new Set(tokenize(ofPhrase).map(singularize));
      }
    }

    // 2) the replacement itself shares a word with a base line (roma tomatoes -> cherry tomatoes)
    if (lineIdx === -1) {
      const hits = findMentionedIngredientLines(replacement, recipe.ingredients);
      lineIdx = pickFreeLine(hits);
    }

    // 3) the original is mentioned somewhere else in the review, outside the replacement
    if (lineIdx === -1) {
      const leftover = lowerText.split(cand.replacement.toLowerCase()).join(" ");
      const hits = findMentionedIngredientLines(leftover, recipe.ingredients);
      const free = pickFreeLine(hits);
      if (free !== -1) {
        lineIdx = free;
        contextWords = new Set(tokenize(leftover).map(singularize));
      }
    }

    if (lineIdx === -1) continue;

    const originalLine = recipe.ingredients[lineIdx];
    if (originalLine === undefined) continue;

    if (!cand.strong && !introducesNewWord(replacement, originalLine)) continue;

    const before = modifiedIngredients[lineIdx];
    if (before === undefined) continue;

    const after = buildSubstitutedLine(before, replacement, contextWords);
    if (!after || after === before) continue;

    modifiedIngredients[lineIdx] = after;
    blockedLines.add(lineIdx);
    diffs.push({ section: "ingredients", index: lineIdx, type: Diff.CHANGED, before, after });
    applied++;
  }
}

// ---------- quantity helpers ----------

function parseAmount(raw: string): number | null {
  if (raw.includes("/")) {
    const [num, den] = raw.split("/").map(Number);
    if (!num || !den) return null;
    return num / den;
  }
  const val = parseFloat(raw);
  return Number.isNaN(val) ? null : val;
}

function formatAmount(val: number): string {
  if (val === 0.25) return "1/4";
  if (val === 0.5) return "1/2";
  if (val === 0.75) return "3/4";
  if (val === 1.5) return "1 1/2";
  return Number.isInteger(val) ? String(val) : String(Math.round(val * 100) / 100);
}

function rewriteWithQuantity(line: string, qtyWord: string, qtyNum: number | null): string {
  const lead = line.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s+(.*)$/);
  if (lead && lead[1] !== undefined && lead[2] !== undefined) {
    const base = parseAmount(lead[1]);
    if (base !== null) {
      if ((qtyWord === "extra" || qtyWord === "more") && qtyNum !== null) return `${formatAmount(base + qtyNum)} ${lead[2]}`;
      if (qtyWord === "less" && qtyNum !== null) return `${formatAmount(Math.max(base - qtyNum, 0.25))} ${lead[2]}`;
      if (qtyWord === "double" || qtyWord === "doubled") return `${formatAmount(base * 2)} ${lead[2]}`;
      if (qtyWord === "half" || qtyWord === "halved") return `${formatAmount(base / 2)} ${lead[2]}`;
    }
  }
  // wording fallback when the math cant be done
  if (qtyWord === "half" || qtyWord === "halved") return `${line} (halved)`;
  if (qtyWord === "less") return `${line} (less, to taste)`;
  return `${line} (extra, to taste)`;
}

function applyQuantity(
  lowerText: string,
  recipe: Recipe,
  modifiedIngredients: string[],
  diffs: DiffAnnotation[],
  blockedLines: Set<number>
): void {
  const match = lowerText.match(QUANTITY_REGEX);
  if (match) {
    // pull out into local vars to bypass the strict index access complaints
    const m1 = match[1];
    const qtyNum = m1 ? parseFloat(m1) : null;
    const qtyWord = match[2] ?? "";
    const affected = (match[3] ?? "").trim();
    if (!qtyWord || !affected) return;

    const hits = findMentionedIngredientLines(affected, recipe.ingredients).filter(h => !blockedLines.has(h));
    if (hits.length === 0) return;
    const lineIdx = hits[0];

    const before = modifiedIngredients[lineIdx];
    if (before === undefined) return;

    const after = rewriteWithQuantity(before, qtyWord, qtyNum);
    if (after === before) return;

    modifiedIngredients[lineIdx] = after;
    blockedLines.add(lineIdx);
    diffs.push({ section: "ingredients", index: lineIdx, type: Diff.CHANGED, before, after });
    return;
  }

  const absolute = lowerText.match(ABSOLUTE_QTY_REGEX);
  if (absolute && absolute[1]) {
    const hits = findMentionedIngredientLines(lowerText, recipe.ingredients).filter(h => !blockedLines.has(h));
    if (hits.length === 0) return;
    const lineIdx = hits[0];

    const before = modifiedIngredients[lineIdx];
    if (before === undefined) return;

    const lead = before.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s+(.*)$/);
    if (lead && lead[1] !== undefined && lead[2] !== undefined && parseAmount(lead[1]) !== parseFloat(absolute[1])) {
      const after = `${formatAmount(parseFloat(absolute[1]))} ${lead[2]}`;
      modifiedIngredients[lineIdx] = after;
      blockedLines.add(lineIdx);
      diffs.push({ section: "ingredients", index: lineIdx, type: Diff.CHANGED, before, after });
    }
  }
}

// ---------- omission + synthesis helpers ----------

function applyOmission(
  lowerText: string,
  modifiedIngredients: string[],
  diffs: DiffAnnotation[],
  blockedLines: Set<number>
): void {
  const omitMatch = lowerText.match(OMIT_REGEX);
  const omittedRaw = omitMatch ? omitMatch[1] : undefined;
  if (!omittedRaw) return;

  const omittedItem = omittedRaw.trim();
  if (!omittedItem) return;

  const idx = modifiedIngredients.findIndex(i => i.toLowerCase().includes(omittedItem));
  if (idx === -1 || blockedLines.has(idx)) return;

  const before = modifiedIngredients[idx];
  if (before === undefined) return;

  modifiedIngredients.splice(idx, 1);
  blockedLines.add(idx);
  diffs.push({ section: "ingredients", index: idx, type: Diff.REMOVED, before, after: null });
}

// picks the single most cooking-relevant sentence so we can append it as a new step
function synthesizeStep(originalText: string): string | null {
  const sentences = splitSentences(originalText);
  let best: string | null = null;
  let bestScore = 0;

  for (const sentence of sentences) {
    if (sentence.length < 8) continue;
    const lower = sentence.toLowerCase();
    let score = 0;

    for (const word of tokenize(lower)) {
      if (TECHNIQUE_WORDS.has(word)) score += 2;
    }
    for (const phrase of TECHNIQUE_PHRASES) {
      if (lower.includes(phrase)) score += 2;
    }
    if (TIME_OR_TEMP_REGEX.test(sentence)) score += 1;

    if (score > bestScore) {
      bestScore = score;
      best = sentence;
    }
  }

  if (!best) return null;

  // minimal cleanup only — keep the reviewers own wording
  const trimmed = best.replace(/\s+/g, " ").trim();
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

// ---------- main loop ----------

export function generateTweaks(recipe: Recipe, rawReviews: any[]): Tweak[] {
  const tweaks: Tweak[] = [];
  let sortOrder = 0;

  for (const review of rawReviews) {
    const text = review.reviewBody || "";
    const author = review.author?.name || null;
    const date = review.datePublished || null;
    const lowerText = normalizeText(text);

    // context-aware gate: pure praise like "great twist!" never becomes a tweak
    if (!isActionableTweak(text, recipe)) continue;

    const modifiedIngredients = [...recipe.ingredients];
    const modifiedSteps = [...recipe.steps];
    const diffs: DiffAnnotation[] = [];
    // lines already touched by a rule, so later rules leave them alone
    const blockedLines = new Set<number>();

    // rule 1: bacon mentions become a new ingredient (crowd favorite)
    if (lowerText.includes("bacon")) {
      const newItem = "1 slice bacon, chopped";
      modifiedIngredients.push(newItem);
      diffs.push({
        section: "ingredients",
        index: modifiedIngredients.length - 1,
        type: Diff.ADDED,
        before: null,
        after: newItem
      });
    }

    // rule 2: generic substitutions ("substituted X", "used X instead", "X in place of Y")
    applySubstitutions(lowerText, recipe, modifiedIngredients, diffs, blockedLines);

    // rule 3: quantity rewrites ("1 extra tablespoon feta", "doubled the basil")
    applyQuantity(lowerText, recipe, modifiedIngredients, diffs, blockedLines);

    // rule 4: omissions run last so the index math above stays correct
    applyOmission(lowerText, modifiedIngredients, diffs, blockedLines);

    // step synthesis: zero ingredient diffs but the review has real cooking talk,
    // so append the most cooking-relevant sentence as a brand new step
    const hasIngredientDiff = diffs.some(d => d.section === "ingredients");
    if (!hasIngredientDiff) {
      const step = synthesizeStep(text);
      if (step) {
        modifiedSteps.push(step);
        diffs.push({
          section: "steps",
          index: modifiedSteps.length - 1,
          type: Diff.ADDED,
          before: null,
          after: step
        });
      }
    }

    // note as a true last resort, when nothing else could be extracted
    if (diffs.length === 0) {
      diffs.push({
        section: "steps",
        index: 0,
        type: Diff.NOTE,
        before: null,
        // empty review bodies do happen ocasionally, give the note something to show
        after: text ? `Community tweak: ${text}` : "Community tweak: (reviewer left no text)"
      });
    }

    tweaks.push({
      id: crypto.randomUUID(),
      recipeId: recipe.id,
      author,
      date,
      text,
      sortOrder: sortOrder++,
      modified: {
        ingredients: modifiedIngredients,
        steps: modifiedSteps,
        // the note text lives ONLY in the note annotation above. keeping this
        // null makes it impossible for the frontend to render the same banner twice
        interpretationNote: null
      },
      diff: diffs,
      createdAt: new Date().toISOString()
    });
  }

  return tweaks;
}z