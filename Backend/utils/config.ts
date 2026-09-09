import "dotenv/config";

export const config = {
  PORT: process.env.PORT || 3000,
  // pooled connection used by the runtime prisma client
  DATABASE_URL: process.env.DATABASE_URL,
  // locked down cors origin, falls back to the local vite dev server
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // LLM config for the tweak engine. endpoint and model default to openai,
  // but any compatible api (groq, together, local ollama with a wrapper) works
  LLM_ENDPOINT: process.env.LLM_ENDPOINT || "https://api.openai.com/v1/chat/completions",
  LLM_MODEL: process.env.LLM_MODEL || "gpt-4o-mini",
  LLM_API_KEY: process.env.LLM_API_KEY || "",
  LLM_TIMEOUT_MS: parseInt(process.env.LLM_TIMEOUT_MS || "15000", 10)
}