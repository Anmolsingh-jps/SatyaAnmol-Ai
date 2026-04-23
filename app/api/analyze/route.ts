import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const query = body?.query || "";

    let searchData: any = [];
    try {
      const res = await fetch(
        `https://serpapi.com/search.json?q=${query}&api_key=${process.env.SERP_API_KEY}`
      );
      const data = await res.json();
      searchData = data?.organic_results?.slice(0, 2) || [];
    } catch {}

    let aiText: any = "";
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `
Analyze: "${query}"

Return JSON:
{
 "verdict":"",
 "main_response":"",
 "fix":"",
 "viralKit":{"caption":""}
}
`
              }]
            }]
          })
        }
      );

      const data = await res.json();
      aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch {}

    let finalData;
    try {
      finalData = JSON.parse(aiText);
    } catch {
      finalData = {
        verdict: "BHRAMAK",
        main_response: aiText,
        fix: "Try again",
        viralKit: { caption: "" }
      };
    }

    return NextResponse.json(finalData);

  } catch {
    return NextResponse.json({ error: "Server error" });
  }
}