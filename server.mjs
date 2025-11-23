import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// HOME ROUTE
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is running ✅");
});

// TEST ROUTE
app.get("/api/test", async (req, res) => {
  try {
    const reply = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "user", content: "Hello from AURA-X backend!" }
      ]
    });

    res.json({
      ok: true,
      llm: "connected",
      reply: reply.choices[0].message.content
    });
  } catch (error) {
    res.json({
      ok: false,
      error: error.message
    });
  }
});

// PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`AURA-X Ω backend listening on port ${PORT}`);
});
