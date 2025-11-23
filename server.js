// server.js
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Render PORT
const PORT = process.env.PORT || 10000;

// OpenAI key from env
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Simple health check
app.get("/", (req, res) => {
  res.send("AURA-X backend OK ✅");
});

// Main LLM endpoint
app.post("/api/ask", async (req, res) => {
  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "Missing 'message' in body" });
  }

  if (!OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ error: "OPENAI_API_KEY not set in environment" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini", // ya jo model aap use karna chahein
        messages: [
          {
            role: "system",
            content:
              "You are AURA-X Ω, an emotional continuity reactor. Reply short, gentle and emotionally aware.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI API error:", text);
      return res
        .status(500)
        .json({ error: "OpenAI API error", details: text.slice(0, 300) });
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "I could not generate a reply, but your TM is still stored.";

    res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`AURA-X backend running on port ${PORT}`);
});
