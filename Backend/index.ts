import express from "express";
import cors from "cors";
const app = express();

app.use(cors());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Health is OK"
  }) 
})

app.listen(3000);