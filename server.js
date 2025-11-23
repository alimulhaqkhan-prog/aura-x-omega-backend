import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------
//  OPENAI CLIENT
// -----------------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// -----------------------------
//  ROOT (for testing)
// -----------------------------
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is running ✔");
});

// -----------------------------
//  /api/test  (for checking backend)
// -----------------------------
app.get("/api/test", (req, res) => {
  res.json({
    status: "ok",
    message: "AURA-X Ω test endpoint working"
  });
});

// -----------------------------
//  MAIN LIVE EMOTIONAL REACTOR
// -----------------------------
app.post("/api/react", async (req, res) => {
  try {
    console.log("Incoming body →", req.body);

    // Support both formats: {tm:""} or {message:""}
    const userMessage = req.body.tm || req.body.message;

    if (!userMessage) {
      return res.json({
        ok: false,
        error: "Missing 'tm' or 'message' field",
        reply: "Backend error: No TM received."
      });
    }

    // ---- CALL OPENAI ----
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are AURA-X Ω, the emotional continuity reactor. You reply with emotional awareness."
        },
        { role: "user", content: userMessage }
      ]
    });

    const reply = completion.choices[0].message.content;

    console.log("AURA-X Ω Live reply →", reply);

    res.json({
      ok: true,
      reply
    });

  } catch (err) {
    console.error("AURA-X Ω BACKEND ERROR:", err);
    res.json({
      ok: false,
      error: err.message,
      reply: "AURA-X Ω backend error, using fallback emotional mode."
    });
  }
});

// -----------------------------
//  SERVER LISTEN
// -----------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`AURA-X Ω backend running on port ${PORT}`)
);
