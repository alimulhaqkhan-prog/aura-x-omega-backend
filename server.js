const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is running ✔️");
});

/* ============================
   MAIN LLM / EMOTIONAL ENGINE
============================ */
app.post("/api/react", (req, res) => {
  try {
    const { tm, state } = req.body;

    // Simple emotional logic (placeholder)
    const reply = "I received your TM: " + tm;
    const polarity = "Positive";
    const tone = "Calm";

    // Update BM (append TM)
    const newBM = state?.bm || {};
    const timestamp = Date.now();
    newBM[timestamp] = tm;

    // Return JSON exactly as frontend expects
    res.json({
      reply,
      polarity,
      tone,
      bm: newBM
    });

  } catch (err) {
    res.status(500).json({
      reply: "Backend processing error.",
      polarity: "Mixed",
      tone: "Fallback",
      bm: state?.bm || {}
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("AURA-X backend running on port", PORT);
});
