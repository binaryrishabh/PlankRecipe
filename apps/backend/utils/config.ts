export const config = {
  PORT: Number(process.env.PORT) || 3000,
  // bind to loopback by default; the reverse proxy (nginx) is the only public entry point
  HOST: process.env.HOST || "127.0.0.1",
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  
  // which scraping engine to use: "curl" (local) or "playwright" (prod)
  SCRAPER_ENGINE: process.env.SCRAPER_ENGINE || "curl",

  // Cloudflare drops any request after 100s (524), so a fresh scrape must answer
  // before that. Past this deadline we return a clean 504 JSON error instead.
  SCRAPE_DEADLINE_MS: Number(process.env.SCRAPE_DEADLINE_MS) || 85_000,
  // one slow Gemini call shouldn't hold up the whole recipe; it becomes a plain note
  GEMINI_TIMEOUT_MS: Number(process.env.GEMINI_TIMEOUT_MS) || 30_000
}