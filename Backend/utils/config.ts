export const config = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  
  // which scraping engine to use: "curl" (local) or "playwright" (prod)
  SCRAPER_ENGINE: process.env.SCRAPER_ENGINE || "curl"
}