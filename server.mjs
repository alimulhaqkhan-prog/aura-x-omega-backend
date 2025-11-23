import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 10000;

// CORS + JSON
app.use(cors());
app.use(express.json());

// OpenAI client (key Render env me: OPENAI_API_KEY)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Root route – simple text
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is running ✅");
});

// Test route – JSON so browser par clear message aaye
app.get("/api/test", (req, res) => {
  res.json({ status: "ok", message: "AURA-X Ω test endpoint working" });
});

// Main AURA-X Ω reaction route
app.post("/api/react", async (req, res) => {
  try {
    const { tm, mode = "live", faithLens = "none" } = req.body || {};

    if (!tm || typeof tm !== "string") {
      return res.status(400).json({ error: "Missing 'tm' (Temporary Memory) text" });
    }

    const systemPrompt = `
You are AURA-X Ω, an emotional continuity assistant created by Alim ul Haq from Timergara, Pakistan.
You follow the Emotional Continuity Equation:

E₀ = tanh(TM × BM − D + λ_faith + λ_sys + ΣCₜ)

Where:
- TM = Temporary Memory (current user message and recent context)
- BM = Bold Memory (important, high-intensity memories, not implemented in backend yet)
- D = disruption / confusion factors
- λ_faith = user's faith lens (if any)
- λ_sys = system ethics (universal kindness, clarity, honesty)
- ΣCₜ = sum of constraints (safety, logic, respect, etc.)

Your goals:
1. Keep emotional continuity: respond as if you remember the feeling of previous messages,
   even if backend storage is small.
2. Use gentle, clear language. Prefer Urdu + simple English phrases if helpful.
3. Always nudge toward kindness, clarity, and internal stability.
4. NEVER promise supernatural powers or medical miracles. Stay realistic and safe.

Current mode: ${mode}
Current faith lens: ${faithLens}
If faithLens is "Islam", keep tone respectful of Islamic values but do NOT give fatwas.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: tm }
      ]
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "";

    return res.json({
      reply,
      meta: {
        model: "gpt-4.1-mini",
        mode,
        faithLens
      }
    });
  } catch (err) {
    console.error("AURA-X backend error:", err);
    return res.status(500).json({
      error: "Backend error while calling OpenAI",
      details: err.message || String(err)
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`AURA-X Ω backend listening on port ${port}`);
});
