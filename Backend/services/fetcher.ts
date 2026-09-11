import { spawn } from "child_process";

// fetches the html using curl to bypass the bot block. aws datacenter ips get
// graded way harsher by cloudflare than home connections, so we now mimic a
// real chrome session as closely as curl lets us — full sec-* header set,
// fresh user agent, http2, the works
export async function fetchRecipeHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      '-s',
      '-L',
      '--http2',
      '--max-time', '45',
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
        reject(new Error(`curl process exited with code ${code}: ${stderr}`));
      } else if (!stdout.trim()) {
        reject(new Error('curl returned empty response. make sure curl is installed on your system.'));
      } else {
        resolve(stdout);
      }
    });
    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn curl. Is curl installed and in your PATH? Error: ${err.message}`));
    });
  });
}

// allrecipes loads reviews dynamically via an api, they arent in the main html json-ld
// so we gotta hit this endpoint to actually get the community tweaks
export async function fetchReviews(recipeId: string): Promise<any[]> {
  return new Promise((resolve) => {
    const apiUrl = `https://www.allrecipes.com/api/recipe/reviews?id=${recipeId}&offset=0&limit=50`;
    const args = [
      '-s', '-L',
      '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
        // the api usually returns { reviews: [...] } or similar, we just grab the array
        const reviews = json.reviews || json.data || json;
        resolve(Array.isArray(reviews) ? reviews : []);
      } catch (e) {
        // if parsing fails just return empty so it doesnt crash the whole scrape
        resolve([]);
      }
    });
    
    proc.on('error', () => resolve([]));
  });
}