import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma";
import { config } from "./utils/config";
import recipesRouter from "./routes/recipes";

const app = express();

app.use(cors());
app.use(express.json()); // need this to parse json bodies

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Health is OK"
  });
});

// End-to-end proof that the pooled Neon connection works at runtime.
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

// mount the new api routes
app.use("/api/recipes", recipesRouter);

app.listen(config.PORT, () => {
  console.log(`[backend] listening on port ${config.PORT}`);
});