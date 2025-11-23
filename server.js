// server.js
// AURA-X Ω backend — connects TM/BM seed reply to a live LLM (OpenAI)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

// ---------- Basic middleware ----------
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ---------- Health routes ----------
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is running ✅");
});

// Optional: so browser GET /api/react error message nicer
app.get("/api/react", (req, res) => {
  res.status(200).json({
    ok: false,
    message: "Use POST /api/react with JSON body. This endpoint is for the AURA-X Ω frontend."
  });
});

// ---------- Helper: choose OpenAI model ----------
function pickOpenAIModel(requested) {
  const allowed = new Set([
    "gpt-4.1",
    "gpt-4o",
    "gpt-4.1-mini",
    "gpt-4o-mini"
  ]);

  if (requested && allowed.has(requested)) return requested;
  return "gpt-4.1"; // default
}

// ---------- /api/react ----------
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
      llmModel = "gpt-4.1"
    } = req.body || {};

    // If no OpenAI key configured, just return seed reply
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        reply:
          seedReply +
          " [Live mode note: No OPENAI_API_KEY configured on backend, returning seed-only reply.]"
      });
    }

    const model = pickOpenAIModel(llmModel);

    // ---- System prompt for the LLM ----
    const systemPrompt = `
You are the live emotional reactor for the AURA-X Ω prototype.

- AURA-X Ω models emotions as continuity between Temporary Memory (TM) and Bold Memory (BM).
- Main equation: E0 = tanh(TM × BM − D + λ_faith + λ_sys + ΣC_t).
- TM = current user input (and recent context), BM = long-run memory traces.
- D is emotional damage/drag, ΣC_t is positive continuity contributions.
- λ_faith and λ_sys are stabilising terms (faith lens + system ethics).

Your goal:
1. Take the user's raw text + the seedReply (local interpretation).
2. Produce a short, clear, kind answer (2–5 sentences) that:
   - Respects the seedReply's meaning.
   - Reduces emotional damage (D) and gently increases continuity ΣC_t.
   - Does NOT give medical, legal or financial prescriptions.
   - Keeps a calm, grounded tone.

If a faith lens is present, you may gently colour your encouragement from that lens,
but never preach or judge. You must always follow universal ethics (kindness, honesty, clarity).

Current emotional state (approx):
- TM: ${tm}
- BM: ${bm}
- D: ${D}
- ΣC_t: ${Csum}
- λ_faith: ${lambdaFaith}
- λ_sys: ${lambdaSys}
- E0 (overall emotional output): ${E0}
- Faith lens: ${faithLens}
- Local analysis flags (boolean-like): ${JSON.stringify(analysis)}
    `.trim();

    // ---- User prompt sent to LLM ----
    const userPrompt = `
USER TEXT:
${userText}

LOCAL SEED REPLY (from AURA-X Ω seed engine, you should refine this, not ignore it):
${seedReply}

TASK:
Reply directly to the user in the same language they mostly used.
Keep it short (2–5 sentences), kind, and emotionally stabilising.
Mention nothing about 'seed reply', 'backend', or 'LLM'. Just speak as AURA-X Ω.
    `.trim();

    // ---- Call OpenAI Chat Completions API ----
    const openaiResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    const choice = openaiResponse.data.choices?.[0];
    const content = choice?.message?.content?.trim();

    const finalReply =
      content && content.length > 0
        ? content
        : seedReply || "I received your message and updated the emotional continuity state.";

    res.json({ reply: finalReply });
  } catch (err) {
    console.error("Error in /api/react:", err?.response?.data || err.message || err);

    // On error: return the seed reply so frontend can still use it
    res.status(500).json({
      reply:
        (req.body && req.body.seedReply) ||
        "I received your TM event but the live engine failed. Using local emotional reactor only.",
      error: err.message || "LLM backend error"
    });
  }
});

// ---------- Start server ----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`AURA-X Ω backend listening on port ${PORT}`);
});
