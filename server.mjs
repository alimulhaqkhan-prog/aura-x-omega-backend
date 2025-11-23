app.get("/api/test", async (req, res) => {
  try {
    const reply = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "user", content: "Hello from AURA-X backend test!" }
      ]
    });

    res.json({
      status: "ok",
      llm: "connected",
      reply: reply.choices[0].message.content
    });
  } catch (err) {
    res.json({
      status: "error",
      message: err.message
    });
  }
});
