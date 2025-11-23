// server.js
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

// ---------- CLIENTS ----------
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ---------- ROOT ----------
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is running ✔");
});

// ---------- TEST ----------
app.get("/api/test", (req, res) => {
  res.json({
    status: "ok",
    message: "AURA-X Ω test endpoint working"
  });
});

// ---------- MAIN REACTOR ----------
app.post("/api/react", async (req, res) => {
  try {
    console.log("Incoming body →", req.body);

    const userMessage = req.body.tm || req.body.message;
    const engine = (req.body.engine || "openai").toLowerCase();

    if (!userMessage) {
      return res.json({
        ok: false,
        error: "Missing 'tm' or 'message' field",
        reply: "Backend error: No TM received."
      });
    }

    let replyText = "";
    let usedEngine = engine;

    // ----- OpenAI -----
    if (engine === "openai") {
      if (!openai) throw new Error("OPENAI_API_KEY missing");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are AURA-X Ω, an emotional continuity reactor. " +
              "You answer with emotional awareness and gentle guidance."
          },
          { role: "user", content: userMessage }
        ]
      });

      replyText = completion.choices[0].message.content;
    }

    // ----- CLAUDE -----
    else if (engine === "claude") {
      if (!anthropic) throw new Error("ANTHROPIC_API_KEY missing");

      const msg = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content:
              "You are AURA-X Ω, emotional continuity reactor. " +
              "Reply with emotional awareness.\n\nUser: " +
              userMessage
          }
        ]
      });

      replyText = msg.content[0].text;
    }

    // ----- GEMINI -----
    else if (engine === "gemini") {
      if (!genAI) throw new Error("GEMINI_API_KEY missing");

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash"
      });

      const result = await model.generateContent(
        "You are AURA-X Ω, emotional continuity reactor. " +
          "Reply with emotional awareness.\n\nUser: " +
          userMessage
      );

      replyText = result.response.text();
    }

    // ----- Unknown engine -----
    else {
      throw new Error("Unknown engine: " + engine);
    }

    console.log(`AURA-X Ω [${usedEngine}] reply →`, replyText);

    res.json({
      ok: true,
      engine: usedEngine,
      reply: replyText
    });
  } catch (err) {
    console.error("AURA-X Ω BACKEND ERROR:", err);
    res.json({
      ok: false,
      error: err.message,
      reply:
        "AURA-X Ω backend error (" +
        err.message +
        "), switching to local emotional continuity."
    });
  }
});

// ---------- LISTEN ----------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`AURA-X Ω backend running on port ${PORT}`)
);
