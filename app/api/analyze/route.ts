export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    let claude = "";
    let openai = "";
    let gemini = "";

    // CLAUDE
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 300,
            messages: [{ role: "user", content: prompt }]
          })
        });

        const data = await res.json();
        claude = data?.content?.[0]?.text || "";
      } catch (e) {}
    }

    // OPENAI
    if (process.env.OPENAI_API_KEY) {
      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
          })
        });

        const data = await res.json();
        openai = data?.choices?.[0]?.message?.content || "";
      } catch (e) {}
    }

    // GEMINI
    if (process.env.GEMINI_API_KEY) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        const data = await res.json();
        gemini =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } catch (e) {}
    }

    // FINAL RESULT
    const final =
      "🔮 SATYA AI RESULT\n\n" +
      (claude ? "🧠 Claude:\n" + claude + "\n\n" : "") +
      (openai ? "⚡ GPT:\n" + openai + "\n\n" : "") +
      (gemini ? "🔍 Gemini:\n" + gemini : "No AI available");

    return Response.json({
      final,
      claude,
      openai,
      gemini
    });

  } catch (error) {
    return Response.json(
      { final: "❌ Error occurred" },
      { status: 500 }
    );
  }
}