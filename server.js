// server.js  (CommonJS style – Render پر سیدھا چلے گا)
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// 🔑  Render Dashboard → Environment → OPENAI_API_KEY = تمہارا نیا sk-proj... key
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GET /  — simple health check
app.get("/", (req, res) => {
  res.json({
    ok: false,
    message: "Use POST /api/react with JSON body. This endpoint is for the AURA-X Ω frontend.",
  });
});

// POST /api/react — main LLM endpoint
app.post("/api/react", async (req, res) => {
  try {
    const {
      userText = "",
      seedReply = "",
      analysis = {},
      tm,
      bm,
      D,
      Csum,
      lambdaFaith,
      lambdaSys,
      E0,
      faithLens = "None",
      llmModel,
    } = req.body || {};

    const model = llmModel || "gpt-4.1-mini"; // چاہو تو "gpt-4.1" بھی کر سکتے ہو

    const systemPrompt = `
You are AURA-X Ω, an "emotional continuity reactor" created by Alim ul Haq from Timergara, Pakistan.

Your job:
- Respect the existing seed reply and emotional math (TM, BM, D, λ_faith, λ_sys, ΣCₜ, E₀).
- Give one short, clear answer (2–6 lines) that feels emotionally stable, kind and analytical.
- Do NOT talk about APIs, JSON, keys or servers.
- You may briefly refer to E₀ or continuity, but stay human-friendly.
Answer in the same language the user used (Urdu/English mix is OK).
    `.trim();

    const userPrompt = `
User text:
${userText}

Seed reply (local emotional reactor):
${seedReply}

Emotional parameters:
TM=${tm}, BM=${bm}, D=${D}, Csum=${Csum},
lambda_faith=${lambdaFaith}, lambda_sys=${lambdaSys}, E0=${E0},
Faith lens: ${faithLens}

Using all this, improve the seed reply.
Keep the same main meaning, but make it more clear, gentle and helpful.
Return ONLY the final answer text, nothing else.
    `.trim();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      seedReply ||
      "I could not improve this answer, but your emotional continuity is still safe.";

    res.json({ ok: true, reply });
  } catch (err) {
    console.error("Error in /api/react:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Unknown error in emotional backend.",
    });
  }
});

// Render will use this port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`AURA-X Ω backend listening on port ${PORT}`);
});
