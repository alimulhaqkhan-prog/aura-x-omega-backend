app.post("/api/react", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are AURA-X Ω emotional reactor" },
        { role: "user", content: userMessage }
      ]
    });

    res.json({
      ok: true,
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.json({
      ok: false,
      error: err.message,
      reply: "Backend error, using fallback."
    });
  }
});
