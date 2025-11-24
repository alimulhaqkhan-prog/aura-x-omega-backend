import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ------------ OpenAI client (optional) ------------
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
let openaiClient = null;

if (OPENAI_API_KEY) {
  openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  console.log("✅ OpenAI client initialised");
} else {
  console.log("⚠️ OPENAI_API_KEY not set. Backend will return seedReply only.");
}

// ------------ Helper: build system prompt ------------
function buildSystemPrompt(payload) {
  const {
    tm,
    bm,
    D,
    Csum,
    lambdaFaith,
    lambdaSys,
    E0,
    faithLens
  } = payload || {};

  return `
You are **AURA-X Ω**, an *emotional continuity reactor*.

Your job:
- Respect the user's existing seed_reply (it already contains safe advice).
- Slightly refine / polish it, keep the **same meaning**.
- Use maximum 2–3 short paragraphs.
- Stay gentle, non-medical, non-therapy. 
- Never claim to cure depression, epilepsy, trauma, etc.

Internal emotional snapshot (from the front-end equation):
- TM  = ${Number(tm ?? 0).toFixed(2)}
- BM  = ${Number(bm ?? 0).toFixed(2)}
- D   = ${Number(D ?? 0).toFixed(2)}
- ΣCₜ = ${Number(Csum ?? 0).toFixed(2)}
- λ_faith = ${Number(lambdaFaith ?? 0).toFixed(2)}
- λ_sys   = ${Number(lambdaSys ?? 0).toFixed(2)}
- E₀      = ${Number(E0 ?? 0).toFixed(2)}

Faith lens selected by user: ${faithLens || "None"}.

Rules:
- If faith lens is set, you may add 1 چھوٹی جملہ اس faith کے انداز میں soft encouragement کے طور پر۔
- اگر faith lens "None" ہو تو صرف universal ethics استعمال کریں۔
- ہمشہ احترام، احتیاط اور kindness maintain کریں۔
`;
}

// ------------ Health / safety guard ------------
function containsCrisisWords(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const triggers = [
    "suicide",
    "kill myself",
    "end my life",
    "خودکشی",
    "اپنی جان لے",
    "زندگی ختم"
  ];
  return triggers.some((w) => lower.includes(w));
}

// ------------ Routes ------------

// Simple check (Render health check)
app.get("/", (req, res) => {
  res.send("AURA-X Ω backend is alive ✅");
});

// Main emotional reaction route
app.post("/api/react", async (req, res) => {
  const body = req.body || {};
  const {
    userText = "",
    seedReply = "",
    analysis = {},
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

  // 1) Basic safety: اگر کوئی بہت خطرناک بات لکھے تو seedReply override کر دو
  if (containsCrisisWords(userText)) {
    const crisisReply =
      "میں تمہاری بات سن رہا ہوں اور محسوس ہو رہا ہے کہ تم بہت شدید emotional درد میں ہو۔ " +
      "میں ایک AI ہوں، اس لئے ایمرجنسی مدد یا تھراپی نہیں دے سکتا، لیکن براہِ کرم کسی قریبی انسان، " +
      "فیملی ممبر، دوست یا مستند ڈاکٹر/معالج سے فوراً رابطہ کرو۔ اگر خطرہ فوری ہو تو اپنے ملک کی ایمرجنسی ہیلپ لائن استعمال کرو۔";
    return res.json({
      reply: crisisReply,
      provider: null,
      error: null
    });
  }

  // 2) Default answer = seedReply (front-end already بنایا ہوا)
  let finalReply = seedReply || "AURA-X Ω seed reply.";

  // اگر OpenAI key ہی نہیں ہے تو سیدھا seedReply واپس کر دو
  if (!openaiClient) {
    return res.json({
      reply: finalReply + " [Backend: no OPENAI_API_KEY configured, using seed-only mode.]",
      provider: null,
      error: "NO_OPENAI_KEY"
    });
  }

  try {
    const systemPrompt = buildSystemPrompt({
      tm,
      bm,
      D,
      Csum,
      lambdaFaith,
      lambdaSys,
      E0,
      faithLens,
      analysis
    });

    // ابھی کیلئے model hard-code رکھو، UI سے آنے والا llmModel ignore کر رہے ہیں
    const modelName = "gpt-4.1-mini";

    const completion = await openaiClient.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        // User text so LLM کو context مل جائے
        {
          role: "user",
          content:
            "User_text:\n" +
            (userText || "User نے کوئی extra text نہیں دیا، صرف TM metadata بھیجا ہے۔")
        },
        // seed reply کو previous assistant message کی طرح دو
        {
          role: "assistant",
          content:
            "Existing_seed_reply (improve gently, keep same meaning, max ~3 short paragraphs):\n" +
            (seedReply || "No seed reply, so please just give a short, neutral, kind reaction.")
        }
      ],
      temperature: 0.5,
      max_tokens: 350
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() || finalReply;

    finalReply = text;

    return res.json({
      reply: finalReply,
      provider: "openai",
      error: null
    });
  } catch (err) {
    console.error("OpenAI error:", err.message);
    return res.json({
      reply:
        finalReply +
        " [AURA-X Ω backend error, falling back to local seed reply. You can continue chatting — BM will still save locally.]",
      provider: "openai",
      error: err.message
    });
  }
});

// ------------ Start server ------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 AURA-X Ω backend listening on port ${PORT}`);
});
