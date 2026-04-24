export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    /* -------- CLAUDE -------- */
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
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
    }).then(r => r.json());

    /* -------- OPENAI -------- */
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      })
    }).then(r => r.json());

    /* -------- GEMINI -------- */
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    ).then(r => r.json());

    /* -------- EXTRACT TEXT -------- */
    const claude = claudeRes?.content?.[0]?.text || "";
    const openai = openaiRes?.choices?.[0]?.message?.content || "";
    const gemini = geminiRes?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    /* -------- MERGE RESULT -------- */
    const final = `
🔮 FINAL RESULT (3 AI COMBINED)

Claude:
${claude}

GPT:
${openai}

Gemini:
${gemini}
`;

    return Response.json({
      final,
      claude,
      openai,
      gemini
    });

  } catch (e) {
    return Response.json({ final: "Error occurred" }, { status: 500 });
  }
}