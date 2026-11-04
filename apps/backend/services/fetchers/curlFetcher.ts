import { spawn } from "child_process";

// curl based fetcher. fine for local dev and residential ips, but aws
// datacenter ips get hard blocked by cloudflare, so prod uses playwright
export async function fetchRecipeHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-s',
      '-L',
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      '-H', 'Accept-Language: en-US,en;q=0.9',
      '-H', 'Accept-Encoding: gzip, deflate',
      '-H', 'Connection: keep-alive',
      '-H', 'Upgrade-Insecure-Requests: 1',
      '-H', 'Sec-Ch-Ua: "Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      '-H', 'Sec-Ch-Ua-Mobile: ?0',
      '-H', 'Sec-Ch-Ua-Platform: "Windows"',
      '-H', 'Sec-Fetch-Dest: document',
      '-H', 'Sec-Fetch-Mode: navigate',
      '-H', 'Sec-Fetch-Site: none',
      '-H', 'Sec-Fetch-User: ?1',
      '--compressed',
      url
    ];
    const proc = spawn('curl', args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`curl exited ${code}: ${stderr}`));
      } else if (!stdout.trim()) {
        reject(new Error('curl returned empty response'));
      } else {
        resolve(stdout);
      }
    });
    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn curl: ${err.message}`));
    });
  });
}

export async function fetchReviews(recipeId: string): Promise<any[]> {
  return new Promise((resolve) => {
    const apiUrl = `https://www.allrecipes.com/api/recipe/reviews?id=${recipeId}&offset=0&limit=50`;
    const args = [
      '-s', '-L',
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      '-H', 'Accept: application/json',
      apiUrl
    ];
    const proc = spawn('curl', args);
    let stdout = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.on('close', (code) => {
      if (code !== 0 || !stdout.trim()) {
        resolve([]);
        return;
      }
      try {
        const json = JSON.parse(stdout);
        const reviews = json.reviews || json.data || json;
        resolve(Array.isArray(reviews) ? reviews : []);
      } catch {
        resolve([]);
      }
    });
    proc.on('error', () => resolve([]));
  });
}