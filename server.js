// =====================
// AURA-X Ω BACKEND v3
// =====================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// ----------------------
// 🔥 HEALTH CHECK
// ----------------------
app.get("/health", (req, res) => {
  res.json({ status: "OK", engine: "AURA-X Ω backend live" });
});

// ----------------------
// 🔥 MAIN LLM ENDPOINT
// ----------------------
app.post("/api/ask", async (req, res) => {
  try {
    const userMsg = req.body.message || "";

    // Dummy emotional meta (backend can upgrade later)
    const polarity = Math.random() > 0.5 ? "Positive" : "Negative";
    const intensity = (Math.random() * 100).toFixed(0);
    const tone = polarity === "Positive" ? "Warm" : "Cool";

    const reply = `AURA-X Ω received: "${userMsg}". Emotional continuity maintained.`;

    res.json({
      reply,
      meta: {
        polarity,
        intensity,
        tone,
      }
    });

  } catch (err) {
    console.error("Backend Error:", err);
    res.status(500).json({ error: "Server crash in /api/ask" });
  }
});

// ----------------------
// 🔥 SERVER START
// ----------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`AURA-X backend running on port ${PORT}`)
);
