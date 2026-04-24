export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    let gemini = "";

    /* -------- CLAUDE (optional) -------- */
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
      } catch {}
    }

    /* -------- GEMINI -------- */
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
      } catch {}
    }

    return Response.json({
      final: `
🔮 SATYA AI RESULT

${claude ? `🧠 Claude:\n${claude}\n\n` : ""}
${gemini ? `🔍 Gemini:\n${gem