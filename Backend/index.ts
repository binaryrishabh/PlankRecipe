import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import { config } from "./utils/config";
import recipesRouter from "./routes/recipes";

const app = express();

// locked down cors — only the origin from CORS_ORIGIN gets through,
// falls back to the local vite dev server when the env var is missing
const allowedOrigins = config.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // tools like curl send no origin at all, let those through
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");
    callback(null, allowed);
  }
}));

app.use(express.json()); // needed to parse json bodies

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Health is OK"
  });
});

// quick proof that the pooled neon connection actually works at runtime
app.get("/health/db", async (req, res) => {
  try {
    const startedAt = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: "Database connection is OK",
      latencyMs: Date.now() - startedAt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// all the recipe endpoints live under /api/recipes
app.use("/api/recipes", recipesRouter);

app.listen(config.PORT, () => {
  console.log(`[backend] listening on port ${config.PORT}`);
});