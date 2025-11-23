// AURA-X Ω — Simple OpenAI backend (single LLM: GPT-4.1 / GPT-4o)

import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ---- OpenAI client ----
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// simple helper for local emotional drift (optional)
function basicSentiment(text) {
  const t = (text || "").toLowerCase();
  let s = 0;
  ["love", "happy", "hope", "good", "nice", "great"].forEach(w => {
    if (t.includes(w)) s++;
  });
  ["sad", "angry", "stress", "hurt", "fear", "hate"].forEach(w => {
    if (t.includes(w)) s--;
  });
  return s;
}

// ---- MAIN ROUTE (same path your frontend uses) ----
app.post("/api/react", async (req, res) => {
  try {
    if (!openai) {
      return res.json({
        reply:
          "OPENAI_API_KEY missing on server. Please set it in Render environment variables."
      });
    }

    const {
      userText = "",
      seedReply = "",
      analysis = {},
      tm = 0.2,
      bm = 0.3,
      D = 0,
      Csum = 0,
      lambdaFaith = 0,
      lambdaSys = 0.02,
      E0 = 0,
      faithLens = "None",
      llmModel = "gpt-4.1" // front-end se aa raha hai
    } = req.body || {};

    // --- local emotional calculation ---
    const score = basicSentiment(userText);
    const drift = score * 0.1 + (analysis.sentiment || 0) * 0.15;
    const E0_new = Math.max(-1, Math.min(1, E0 + drift));

    let polarity =
      E0_new > 0.15 ? "Positive" :
      E0_new < -0.15 ? "Negative" :
      "Neutral";

    // seed-only fallback prompt
    let faithMessage = "";
    if (faithLens && faithLens !== "None") {
      faithMessage = `\n[Faith lens active: ${faithLens}]`;
    }

    // Sirf OpenAI ke liye prompt
    const modelId =
      llmModel && llmModel.startsWith("gpt-4") ? llmModel : "gpt-4.1";

    const basePrompt = `
You are AURA-X Ω — an emotional continuity assistant.

User message: "${userText}"

Current emotional state:
- TM: ${tm}
- BM: ${bm}
- E₀: ${E0_new}
- Polarity: ${polarity}
- Faith Lens: ${faithLens}

Your job:
1. Read the seed reply.
2. Keep the same emotional & ethical tone.
3. Reply in 5–7 short lines (Urdu or English based on user text).
4. You are AURA-X Ω, do not break character.
5. Don't repeat the seed reply fully; extend or refine it.

Seed reply:
"${seedReply}"
`.trim();

    // ---- Call OpenAI (Responses API) ----
    let llmReply = "";

    try {
      const response = await openai.responses.create({
        model: modelId, // "gpt-4.1" or "gpt-4o"
        input: basePrompt
      });

      llmReply =
        response.output?.[0]?.content?.[0]?.text ||
        "GPT-4 did not return any content.";
    } catch (llmErr) {
      console.error("OpenAI error:", llmErr);
      llmReply =
        "OpenAI backend error, using local seed-only emotional reply.\n\n" +
        seedReply;
    }

    const finalReply =
      llmReply +
      `\n\n[Local AURA-X Ω backend note]` +
      `\n• Approx E₀: ${E0_new.toFixed(2)}` +
      `\n• Polarity: ${polarity}` +
      `\n• Engine: OpenAI – ${modelId}` +
      faithMessage;

    return res.json({ reply: finalReply });
  } catch (err) {
    console.error("Fatal backend error:", err);
    return res.json({
      reply:
        "Backend fatal error. Falling back to basic local emotional mode; please try again."
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("AURA-X Ω simple OpenAI backend is LIVE.");
});

app.listen(PORT, () => {
  console.log("AURA-X Ω backend (OpenAI only) running on port", PORT);
});
