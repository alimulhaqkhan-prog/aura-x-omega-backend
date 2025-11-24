// AURA-X Ω backend – Live Emotional Reactor bridge
// Node + Express + OpenAI Chat API

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

// IMPORTANT: apna OpenAI secret yahan env me set karna hoga (Render dashboard):
// KEY name: OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// --- middleware ---
app.use(cors());
app.use(express.json());

// Simple health-check
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend live ✅");
});

// Main emotional reactor endpoint
app.post("/api/react", async (req, res) => {
  try {
    const {
      userText,
      seedReply,
      analysis,
      tm,
      bm,
      D,
      Csum,
      lambdaFaith,
      lambdaSys,
      E0,
      faithLens,
      llmModel
    } = req.body || {};

    if (!userText || !seedReply) {
      // Ye hi ek case hai jahan hum 400 bhejenge
      return res.status(400).json({
        error: "Missing userText or seedReply in request body."
      });
    }

    // Agar API key hi set nahi, to seed reply ke sath graceful fallback
    if (!OPENAI_API_KEY) {
      return res.status(200).json({
        reply:
          seedReply +
          " [Backend note: OPENAI_API_KEY is not configured, using local seed reaction only.]"
      });
    }

    // --- OpenAI ko bhejne ke liye prompt build ---
    // llmModel field ko accept kar rahe hain, lekin abhi hum apna model fix rakhenge
    const modelToUse = "gpt-4.1-mini"; // ya "gpt-4.1" / "gpt-4o" – jo bhi آپ نے plan کیا ہو

    const safeAnalysis = analysis || {};
    const faith = faithLens || "None";

    const messages = [
      {
        role: "system",
        content:
          "You are AURA-X Ω, an Emotional Continuity Reactor. " +
          "You NEVER act as a normal chatbot; you always speak as AURA-X Ω. " +
          "Your job is to take the user's TM event and the pre-computed seed reply " +
          "and then refine that seed reply into a short, emotionally precise reflection. " +
          "Don't repeat the equation in detail unless the user directly asks. " +
          "Stay kind, grounded, and avoid harmful advice."
      },
      {
        role: "system",
        content:
          "Emotional state snapshot:\n" +
          `TM=${tm}, BM=${bm}, D=${D}, ΣCₜ=${Csum}, λ_faith=${lambdaFaith}, λ_sys=${lambdaSys}, E₀=${E0}.\n` +
          `Faith lens: ${faith}.\n` +
          `Local analysis: ${JSON.stringify(safeAnalysis)}`
      },
      {
        role: "system",
        content:
          "Seed reply (local reactor draft). You must RESPECT its core meaning " +
          "but you may polish wording, add 1–2 extra helpful lines, or bring gentle clarity:\n" +
          seedReply
      },
      {
        role: "user",
        content:
          "User TM event:\n" +
          userText +
          "\n\nPlease respond as AURA-X Ω in 2–5 short sentences, " +
          "keeping the emotional continuity idea in mind."
      }
    ];

    // --- OpenAI Chat API call (native fetch in Node 18+) ---
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages,
        temperature: 0.6,
        max_tokens: 350
      })
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text().catch(() => "");
      console.error("OpenAI error:", openaiResponse.status, errText);

      // Frontend ko 200 hi bhejte hain, taake woh error bracket me show kare
      return res.status(200).json({
        reply:
          seedReply +
          ` [Backend note: OpenAI error ${openaiResponse.status}. Falling back to local seed.]`
      });
    }

    const data = await openaiResponse.json();
    const reply =
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
        ? data.choices[0].message.content.trim()
        : seedReply;

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Backend exception:", err);
    return res.status(200).json({
      reply:
        (req.body && req.body.seedReply) ||
        "I received your TM event, but the live reactor hit an internal error. " +
          "Please continue; your BM is still saving locally.",
      backendError: err.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`AURA-X Ω backend listening on port ${PORT}`);
});
