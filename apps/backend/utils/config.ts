export const config = {
  PORT: Number(process.env.PORT) || 3000,
  // bind to loopback by default; the reverse proxy (nginx) is the only public entry point
  HOST: process.env.HOST || "127.0.0.1",
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  
  // which scraping engine to use: "curl" (local) or "playwright" (prod)
  SCRAPER_ENGINE: process.env.SCRAPER_ENGINE || "curl"
}