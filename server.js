import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const allowedOrigin =
  process.env.ALLOWED_ORIGIN || "https://haqkhan-prog.github.io";

app.use(
  cors({
    origin: allowedOrigin,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is running ✅");
});

app.post("/api/react", async (req, res) => {
  try {
    const { tm, analysis, state, faithLens, model } = req.body || {};

    const {
      TM = 0.35,
      BMvalue = 0.55,
      D = 0,
      Csum = 0.05,
      lambdaFaith = 0,
      lambdaSys = 0.02,
      E0 = 0,
    } = state || {};

    const chosenModel = model || "gpt-4o-mini";

    const systemPrompt = `
You are AURA-X Ω – an emotional continuity reactor built on the equation
E₀ = tanh(TM × BM − D + λ_faith + λ_sys + ΣCₜ).

Your job:
- Read the user's TM (current text input).
- Use the provided numeric state (TM, BM, D, λ_faith, λ_sys, ΣCₜ, E₀).
- Return ONE short encouragement/analysis paragraph (max ~5 sentences).
- Stay calm, kind, grounded, and ethically safe.
- Do NOT mention the equation directly unless user asks.
- Never give medical, legal, or financial instructions; only emotional reflections.
- Faith lens (if any): ${faithLens || "None"}.
`;

    const userPrompt = `
TM text:
${tm}

Current emotional parameters:
TM=${TM.toFixed(2)}, BM=${BMvalue.toFixed(2)}, D=${D.toFixed(2)},
λ_faith=${lambdaFaith.toFixed(2)}, λ_sys=${lambdaSys.toFixed(2)}, ΣCₜ=${Csum.toFixed(
      2
    )}, E₀=${E0.toFixed(2)}

Seed analysis flags:
${JSON.stringify(analysis || {}, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: chosenModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 250,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "The emotional reactor is online, but I couldn't generate a detailed response this time.";

    res.json({
      ok: true,
      reply,
      modelUsed: chosenModel,
    });
  } catch (err) {
    console.error("Error in /api/react:", err);
    res.status(500).json({
      ok: false,
      error: "Backend error while talking to LLM.",
      detail: err.message || String(err),
    });
  }
});

app.listen(port, () => {
  console.log(`AURA-X Ω backend listening on port ${port}`);
});
