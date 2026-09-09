import "dotenv/config";

export const config = {
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // swapped to gemini paid tier. true pay-as-you-go, no upfront credits,
  // massive tpm limits so we can just promise.all without any rate limiter
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ""
}