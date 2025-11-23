// server.js
// AURA-X Ω – Simple Emotional Reactor Backend (Demo, no API key needed)

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(express.json());

// Helper: tiny sentiment estimate from text
function basicSentimentScore(text) {
  const t = (text || "").toLowerCase();

  const posWords = ["love", "shukr", "thanks", "grateful", "hope", "happy",
    "alhamdulillah", "good", "great", "amazing", "wonderful"];
  const negWords = ["sad", "depressed", "angry", "hate", "lonely",
    "fear", "scared", "anxious", "anxiety", "stress", "stressed", "hurt"];

  let score = 0;
  posWords.forEach(w => { if (t.includes(w)) score += 1; });
  negWords.forEach(w => { if (t.includes(w)) score -= 1; });

  return score; // -N … +N
}

// Main route: /api/react
app.post("/api/react", async (req, res) => {
  try {
    const {
      userText = "",
      seedReply = "",
      analysis = {},
      tm = 0.3,
      bm = 0.5,
      D = 0,
      Csum = 0,
      lambdaFaith = 0,
      lambdaSys = 0.02,
      E0 = 0,
      faithLens = "None",
      llmModel = "local-demo"
    } = req.body || {};

    const baseScore = basicSentimentScore(userText);
    const localE0 = Math.max(-1, Math.min(1,
      E0 + baseScore * 0.1 + (analysis.sentiment || 0) * 0.15
    ));

    let polarity;
    if (localE0 > 0.15) polarity = "Positive";
    else if (localE0 < -0.15) polarity = "Negative";
    else polarity = "Neutral";

    let faithLine = "";
    if (faithLens && faithLens !== "None") {
      faithLine = `\n\n[Faith lens active: ${faithLens}. This line is shaped by your selected belief preset, but still under universal ethics.]`;
    }

    let extraLine = "";
    if (polarity === "Positive") {
      extraLine = "Your emotional field is leaning to the positive side. Try to bookmark this moment as a BM node you can revisit later.";
    } else if (polarity === "Negative") {
      extraLine = "I can feel a heavier pattern here. Instead of running away from it, we try to decode it slowly and reduce D (damage) over time.";
    } else {
      extraLine = "This feels like a mixed or balanced state. Not every moment is extreme — neutrality also protects your long-run continuity.";
    }

    const reply =
      seedReply.trim() +
      "\n\n[Local AURA-X Ω backend note]" +
      `\n• Approx E₀: ${localE0.toFixed(2)} (from TM/BM + basic sentiment)` +
      `\n• Polarity: ${polarity}` +
      `\n• Engine: ${llmModel} (demo, local only)` +
      `\n\n${extraLine}` +
      faithLine;

    return res.json({ reply });
  } catch (err) {
    console.error("AURA-X backend error:", err);
    return res.status(200).json({
      reply:
        "Backend caught an internal error but recovered safely. " +
        "You can continue; TM/BM continuity is not lost. " +
        `\n\n[Error detail: ${err.message}]`
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is live (demo mode).");
});

// Start server
app.listen(PORT, () => {
  console.log(`AURA-X Ω backend listening on port ${PORT}`);
});
