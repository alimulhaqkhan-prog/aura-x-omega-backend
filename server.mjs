const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is running ✔");
});

app.post("/api/react", async (req, res) => {
  try {
    const {
      userText = "",
      seedReply = "",
      analysis = {}
    } = req.body || {};

    // No 400 — always 200 OK
    if (!userText.trim()) {
      return res.json({
        reply: "Backend OK — but no userText received.",
        usedLive: false
      });
    }

    let extra = "";
    if (analysis.isAbuse) {
      extra = " Live backend note: heavy/abusive emotional load detected.";
    } else if (analysis.posSeedCount > 0) {
      extra = " Live backend note: positive emotional seeds detected.";
    } else {
      extra = " Live backend note: TM registered.";
    }

    const finalReply =
      (seedReply || "Received your TM.") + extra;

    return res.json({
      reply: finalReply,
      usedLive: true
    });

  } catch (err) {
    return res.json({
      reply: "Backend internal error. Fallback to local mode.",
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Backend running on port", PORT));
