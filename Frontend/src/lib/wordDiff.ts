export interface WordDiffPart {
  type: 'same' | 'added' | 'removed';
  text: string;
}

// splits a string into words and whitespace tokens so we can diff them properly
// using regex capture group keeps the spaces as their own tokens
function tokenize(str: string): string[] {
  return str.split(/(\s+)/).filter(t => t.length > 0);
}

export function computeWordDiff(before: string, after: string): WordDiffPart[] {
  const beforeWords = tokenize(before);
  const afterWords = tokenize(after);

  const m = beforeWords.length;
  const n = afterWords.length;
  
  // DP table for longest common subsequnce (typo: subsequnce)
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (beforeWords[i - 1] === afterWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const parts: WordDiffPart[] = [];
  let i = m;
  let j = n;

  // backtrack through the dp table to build the diff parts
  while (i > 0 && j > 0) {
    if (beforeWords[i - 1] === afterWords[j - 1]) {
      parts.push({ type: 'same', text: beforeWords[i - 1] });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      parts.push({ type: 'removed', text: beforeWords[i - 1] });
      i--;
    } else if (dp[i - 1][j] < dp[i][j - 1]) {
      parts.push({ type: 'added', text: afterWords[j - 1] });
      j--;
    } else {
      // tie breaker: we want removed words to show up before added words in the final inline diff
      // since were building it backwards, we push the added word first so it ends up later in the array
      parts.push({ type: 'added', text: afterWords[j - 1] });
      j--;
    }
  }

  while (i > 0) {
    parts.push({ type: 'removed', text: beforeWords[i - 1] });
    i--;
  }

  while (j > 0) {
    parts.push({ type: 'added', text: afterWords[j - 1] });
    j--;
  }

  // reverse to get the correct chronological order
  parts.reverse();

  // merge adjacent tokens of the same type so we dont render a million tiny spans
  const merged: WordDiffPart[] = [];
  for (const part of parts) {
    if (merged.length > 0 && merged[merged.length - 1].type === part.type) {
      merged[merged.length - 1].text += part.text;
    } else {
      merged.push({ ...part });
    }
  }

  return merged;
}