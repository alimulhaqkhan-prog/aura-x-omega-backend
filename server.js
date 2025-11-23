import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.json({ status: "AURA-X Ω Backend Running" });
});

// Chat route
app.post("/api/chat", async (req, res) => {
  try {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.responses.create({
      model: model || "gpt-4o-mini",
      input: message,
    });

    res.json({
      reply: completion.output_text || "No reply received",
    });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "LLM processing failed" });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`AURA-X backend running on port ${port}`);
});
