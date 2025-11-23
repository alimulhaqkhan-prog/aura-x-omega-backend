// AURA-X Ω — Emotional Reactor Backend
// Providers: OpenAI, Anthropic, Gemini, OpenRouter (multi-vendor)

import express from "express";
import cors from "cors";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ---- Clients ----
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ---- Helpers ----
function basicSentiment(text) {
  const t = (text || "").toLowerCase();
  let s = 0;
  ["love", "happy", "hope", "good", "nice", "great"].forEach(w => {
    if (t.includes(w)) s++;
  });
  ["sad", "angry", "stress", "hurt", "fear", "hate"].forEach(w => {
    if (t.includes(w)) s--;
  });
  return s;
}

function mapClaudeModel(llmModel) {
  if (llmModel === "claude-3.5-opus") {
    return "claude-3-5-opus-latest";
  }
  return "claude-3-5-sonnet-latest";
}

// NOTE: yahan IDs example hain; aap OpenRouter docs ke mutabiq
// inhe adjust kar sakte hain.
function mapOpenRouterModel(llmModel) {
  const map = {
    "mistral-large": "mistral-large",
    "command-r-plus": "command-r-plus",
    "grok-2": "grok-2",
    "llama-3-70b-instruct": "llama-3-70b-instruct",
    "qwen-2-72b": "qwen-2-72b",
    "deepseek-coder-v2": "deepseek-coder-v2"
  };
  return map[llmModel] || "mistral-large";
}

// ---- MAIN ROUTE ----
app.post("/api/react", async (req, res) => {
  try {
    const {
      userText = "",
      seedReply = "",
      analysis = {},
      tm = 0.2,
      bm = 0.3,
      D = 0,
      Csum = 0,
      lambdaFaith = 0,
      lambdaSys = 0.02,
      E0 = 0,
      faithLens = "None",
      llmModel = "gpt-4.1"
    } = req.body || {};

    // Local emotional drift
    const score = basicSentiment(userText);
    const drift = score * 0.1 + (analysis.sentiment || 0) * 0.15;
    const E0_new = Math.max(-1, Math.min(1, E0 + drift));

    let polarity =
      E0_new > 0.15 ? "Positive" :
      E0_new < -0.15 ? "Negative" :
      "Neutral";

    let faithMessage = "";
    if (faithLens && faithLens !== "None") {
      faithMessage = `\n[Faith lens active: ${faithLens}]`;
    }

    const basePrompt = `
You are AURA-X Ω — an emotional continuity agent.

User message: "${userText}"

Current emotional state:
- TM: ${tm}
- BM: ${bm}
- E₀: ${E0_new}
- Polarity: ${polarity}
- Faith Lens: ${faithLens}

Your job:
1. Read the seed reply.
2. Continue the emotional & ethical tone.
3. Give a concise, psychologically-respectful reflection (5–7 lines).
4. Do NOT break role; you are AURA-X Ω.
5. Do NOT overwrite the seed reply; extend or refine it.

Seed reply:
"${seedReply}"
`.trim();

    const isClaude = llmModel.startsWith("claude-");
    const isOpenAI = llmModel.startsWith("gpt-");
    const isGemini = llmModel.startsWith("gemini-");
    const isOpenRouter = !isClaude && !isOpenAI && !isGemini;

    let llmReply = "";
    let engineLabel = llmModel;

    // ---- LLM routing ----
    try {
      if (isClaude && anthropic) {
        // CLAUDE 3.5
        const modelId = mapClaudeModel(llmModel);
        const msg = await anthropic.messages.create({
          model: modelId,
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: basePrompt }]
            }
          ]
        });
        llmReply = msg.content?.[0]?.text || "Claude did not return content.";
        engineLabel = `Anthropic – ${modelId}`;

      } else if (isOpenAI && openai) {
        // GPT-4.x via Responses API
        const resp = await openai.responses.create({
          model: llmModel, // "gpt-4.1" or "gpt-4o"
          input: basePrompt
        });
        llmReply =
          resp.output?.[0]?.content?.[0]?.text ||
          "GPT model did not return content.";
        engineLabel = `OpenAI – ${llmModel}`;

      } else if (isGemini && genAI) {
        // GEMINI 1.5 PRO
        const model = genAI.getGenerativeModel({ model: llmModel });
        const result = await model.generateContent(basePrompt);
        llmReply = result.response.text() || "Gemini returned empty content.";
        engineLabel = `Google – ${llmModel}`;

      } else if (isOpenRouter && process.env.OPENROUTER_API_KEY) {
        // OPENROUTER multi-vendor (Mistral, Cohere, Grok, Qwen, DeepSeek, etc.)
        const modelId = mapOpenRouterModel(llmModel);

        const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            // optional but recommended:
            "HTTP-Referer": "https://haqkhan-prog.github.io",
            "X-Title": "AURA-X Omega Emotional Reactor"
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: "user", content: basePrompt }
            ]
          })
        });

        if (!resp.ok) {
          throw new Error("OpenRouter HTTP " + resp.status);
        }

        const data = await resp.json();
        llmReply =
          data.choices?.[0]?.message?.content ||
          "OpenRouter model did not return content.";
        engineLabel = `OpenRouter – ${modelId}`;

      } else {
        // No provider configured
        llmReply =
          "No matching LLM provider/API key configured. Using seed-only emotional reactor.\n\n" +
          seedReply;
        engineLabel = "Seed-only (no external LLM)";
      }
    } catch (llmErr) {
      console.error("LLM error:", llmErr);
      llmReply =
        "LLM backend error, falling back to seed-only emotional reply.\n\n" +
        seedReply;
    }

    // ---- Final combined reply ----
    const combinedReply =
      llmReply +
      `\n\n[Local emotional continuity]` +
      `\n• Approx E₀: ${E0_new.toFixed(2)}` +
      `\n• Polarity: ${polarity}` +
      `\n• Engine: ${engineLabel}` +
      faithMessage;

    return res.json({ reply: combinedReply });
  } catch (err) {
    console.error("Backend fatal error:", err);
    return res.json({
      reply:
        "Backend recovered from a fatal error. Using fallback emotional seed-only mode."
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend (OpenAI + Claude + Gemini + OpenRouter) is LIVE.");
});

app.listen(PORT, () => {
  console.log("AURA-X Ω backend running on port", PORT);
});
