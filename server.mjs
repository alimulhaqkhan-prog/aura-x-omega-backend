// server.mjs
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 10000;

// ---------- Middleware ----------
app.use(cors()); // ابھی کے لیے سب origins allow – بعد میں tighten کر سکتے ہیں
app.use(express.json({ limit: "1mb" }));

// ---------- OpenAI client ----------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is running ✅");
});

// Main emotional reaction endpoint
app.post("/api/react", async (req, res) => {
  try {
    const {
      tmText,        // آپ کے frontend میں TM والا text
      bmSnapshot,    // optional – BM summary/metadata
      equationState, // optional – E0, polarity etc.
      preferredModel // UI میں جو dropdown سے آئے (فی الحال ignore بھی کر سکتے ہیں)
    } = req.body || {};

    const userText =
      tmText ||
      req.body.text ||
      req.body.message ||
      "";

    if (!userText) {
      return res.status(400).json({
        ok: false,
        error: "No TM text provided.",
      });
    }

    const model = "gpt-4.1"; // صرف ایک ہی LLM ابھی

    const systemPrompt = `
You are AURA-X Ω, an "Emotional Continuity Reactor" designed by Alim ul Haq from Timergara.
Your job is:

1) Read the user's TM (Temporary Memory) text.
2) Assume there is a BM (Bold Memory) system on the client that stores important life events.
3) You must:
   - Give a short, kind emotional reflection (2–5 sentences).
   - Mention emotional polarity as Positive / Negative / Mixed.
   - Encourage gentle, ethical behaviour (universal ethics, no specific religion by default).
   - NEVER talk about internal API, JSON or code.

Return a single, human-friendly paragraph only.
If extra metadata is provided (bmSnapshot, equationState), use it just as context.
    `.trim();

    const userPrompt = `
TM (user text):
"${userText}"

Optional BM snapshot:
${bmSnapshot ? JSON.stringify(bmSnapshot).slice(0, 800) : "none"}

Optional equation state:
${equationState ? JSON.stringify(equationState).slice(0, 800) : "none"}

Now respond as AURA-X Ω.
    `.trim();

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 350,
    });

    const reaction =
      completion.choices?.[0]?.message?.content?.trim() ||
      "AURA-X Ω could not generate a detailed reaction, but your TM/BM remain safe.";

    // Response shape کو بہت generous رکھا ہے
    // تاکہ آپ کا frontend جو بھی field پڑھے، اسے text مل جائے۔
    res.json({
      ok: true,
      engine: "openai",
      model,
      reaction,        // generic
      reactionText: reaction,
      text: reaction,
    });
  } catch (err) {
    console.error("LLM error:", err?.message || err);

    res.status(500).json({
      ok: false,
      error: "LLM backend error",
      details: err?.message || String(err),
    });
  }
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`AURA-X Ω backend listening on port ${PORT}`);
});
