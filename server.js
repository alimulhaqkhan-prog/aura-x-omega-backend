// AURA-X Ω backend – Live Emotional Reactor bridge (safe + debug)

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

// Render کی Settings میں env var: OPENAI_API_KEY لازمی add کریں
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ----- middleware -----
app.use(cors());
app.use(express.json({ limit: "1mb" }));  // important!

// Health-check
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend live ✅");
});

// Main route
app.post("/api/react", async (req, res) => {
  try {
    // DEBUG: log کریں کہ body آ ہی رہی ہے یا نہیں
    console.log("Incoming /api/react body:", req.body);

    const body = req.body || {};
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
    } = body;

    // ⚠️ پہلے 400 دے رہے تھے — اس کو ہٹا دیا
    // اب اگر fields missing ہوں گی تب بھی 200 + seedReply واپس جائے گا
    if (!userText || !seedReply) {
      return res.status(200).json({
        reply:
          (seedReply ||
            "I received a TM ping, but the backend did not get the full payload. Continuing in local seed mode.") +
          " [Backend note: missing userText/seedReply in request.]",
        backendWarning: "MISSING_FIELDS"
      });
    }

    // اگر API key نہ ہو تو بھی 200 OK + seedReply
    if (!OPENAI_API_KEY) {
      return res.status(200).json({
        reply:
          seedReply +
          " [Backend note: OPENAI_API_KEY is not configured on the server, using local seed reaction only.]"
      });
    }

    const safeAnalysis = analysis || {};
    const faith = faithLens || "None";
    const modelToUse = "gpt-4.1-mini"; // یا جو بھی model آپ چاہیں

    const messages = [
      {
        role: "system",
        content:
          "You are AURA-X Ω, an Emotional Continuity Reactor created from the AEC / TM–BM theory. " +
          "You refine the given seed reply into a short, emotionally precise reflection. " +
          "Speak as AURA-X Ω only; be kind, grounded, and avoid harmful advice."
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
          "Seed reply (local emotional reactor draft). Keep its core meaning but you may polish wording, " +
          "add 1–2 gentle, helpful lines, or bring clarity:\n" +
          seedReply
      },
      {
        role: "user",
        content:
          "User TM event:\n" +
          userText +
          "\n\nRespond as AURA-X Ω in 2–5 short sentences, keeping emotional continuity in mind."
      }
    ];

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

      return res.status(200).json({
        reply:
          seedReply +
          ` [Backend note: OpenAI error ${openaiResponse.status}. Falling back to local seed.]`
      });
    }

    const data = await openaiResponse.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      (seedReply + " [Backend note: empty LLM reply, using seed.]");

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Backend exception:", err);
    return res.status(200).json({
      reply:
        (req.body?.seedReply ||
          "I received your TM event, but the live reactor hit an internal error.") +
        " [Backend note: " +
        err.message +
        "]"
    });
  }
});

app.listen(PORT, () => {
  console.log(`AURA-X Ω backend listening on port ${PORT}`);
});
