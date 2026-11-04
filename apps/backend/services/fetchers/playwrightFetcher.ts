import { chromium } from 'playwright';

// playwright based fetcher. spins up a real headless chrome so cloudflare
// cant tell its not a human. needed on prod because aws datacenter ips get
// blocked, a plain curl request just returns the bot wall

// reuse one browser across calls would be faster but keeps state around,
// for a scrappy take-home launching fresh each time is simpler and safer
export async function fetchRecipeHtml(url: string): Promise<string> {
  const browser = await chromium.launch({
    headless: true,
    // these flags are required for chrome to run on an aws ec2 ubuntu box
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
    });
    const page = await context.newPage();
    // domcontentloaded not networkidle — allrecipes has ad trackers that
    // never settle, so networkidle would just hang until the timeout
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    // give client side scripts a beat to inject the json-ld
    await page.waitForTimeout(3000);
    return await page.content();
  } finally {
    await browser.close();
  }
}

export async function fetchReviews(recipeId: string): Promise<any[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    const apiUrl = `https://www.allrecipes.com/api/recipe/reviews?id=${recipeId}&offset=0&limit=50`;
    const response = await page.goto(apiUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    if (!response) return [];
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      const reviews = json.reviews || json.data || json;
      return Array.isArray(reviews) ? reviews : [];
    } catch {
      return [];
    }
  } finally {
    await browser.close();
  }
}