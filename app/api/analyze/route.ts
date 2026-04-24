export async function POST(req) {
  try {
    const { prompt } = await req.json();

    let claude = "";
    let gemini = "";

    // CLAUDE
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-sonnet-20240229",
            max_tokens: 300,
            messages: [{ role: "user", content: prompt }]
          })
        });

        const data = await res.json();
        claude = data?.content?.[0]?.text || "No response";
      } catch (e) {
        claude = "Claude error";
      }
    }

    // GEMINI
    if (process.env.GEMINI_API_KEY) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      } catch (e) {
        gemini = "Gemini error";
      }
    }

    return Response.json({
      claude,
      gemini
    });

  } catch (err) {
    return Response.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}