import { NextRequest, NextResponse } from "next/server";

/* simple cache */
const cache: any = new Map();

function normalize(d: any) {
  return {
    search_data: d?.search_data || "",
    verdict: d?.verdict || "BHRAMAK",
    main_response: d?.main_response || "",
    fix: d?.fix || "",
    reel_script: d?.reel_script || "",
    viralKit: {
      caption: d?.viralKit?.caption || "",
      hashtags: d?.viralKit?.hashtags || "",
      reel_hook: d?.viralKit?.reel_hook || ""
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const query: string = body?.query || "";

    if (!query) {
      return NextResponse.json({ error: "Empty query" }, { status: 400 });
    }

    if (cache.has(query)) {
      return NextResponse.json(cache.get(query));
    }

    /* search */
    let searchData: any = [];
    try {
      const res = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERP_API_KEY}`
      );
      const data = await res.json();
      searchData = data?.organic_results?.slice(0, 3) || [];
    } catch {
      searchData = "Search failed";
    }

    /* gemini */
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
Data: ${JSON.stringify(searchData)}

Return JSON:
{
 "verdict":"",
 "main_response":"",
 "fix":"",
 "reel_script":"",
 "viralKit":{
  "caption":"",
  "hashtags":"",
  "reel_hook":""
 }
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

    let finalData: any;
    try {
      finalData = JSON.parse(aiText);
    } catch {
      finalData = {
        verdict: "BHRAMAK",
        main_response: aiText
      };
    }

    finalData = normalize(finalData);
    cache.set(query, finalData);

    return NextResponse.json(finalData);

  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}