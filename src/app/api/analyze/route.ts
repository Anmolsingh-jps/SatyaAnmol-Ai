import { NextRequest, NextResponse } from "next/server";

/* ===== Simple Cache ===== */
const cache: any = new Map();

function getCache(key: string) {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() > v.exp) {
    cache.delete(key);
    return null;
  }
  return v.data;
}

function setCache(key: string, data: any, ttl = 5 * 60 * 1000) {
  cache.set(key, { data, exp: Date.now() + ttl });
}

/* ===== Safe Output ===== */
function normalize(d: any) {
  return {
    search_data: d?.search_data || "",
    verdict: d?.verdict || "BHRAMAK",
    main_response: d?.main_response || "",
    fix: d?.fix || "",
    reel_script: d?.reel_script || "",
    brand_strategy: {
      brand_voice: d?.brand_strategy?.brand_voice || "",
      monetization: d?.brand_strategy?.monetization || "",
      growth_hack: d?.brand_strategy?.growth_hack || ""
    },
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

    /* ===== Cache Check ===== */
    const cacheKey = query.toLowerCase();
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    /* ===== Google Search ===== */
    let searchData: any = [];
    try {
      const res = await fetch(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERP_API_KEY}`
      );
      const data = await res.json();
      searchData = data?.organic_results?.slice(0, 3) || [];
    } catch {
      searchData = "Search Failed";
    }

    /* ===== Gemini AI ===== */
    let aiText: any = "";
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `
You are Satya AI.

Analyze:
"${query}"

Using data:
${JSON.stringify(searchData)}

Return STRICT JSON:

{
  "search_data": "",
  "verdict": "SATYA / ASATYA / BHRAMAK",
  "main_response": "Explain in Hinglish",
  "fix": "How to correct",
  "reel_script": "30 sec script",
  "brand_strategy": {
    "brand_voice": "",
    "monetization": "",
    "growth_hack": ""
  },
  "viralKit": {
    "caption": "",
    "hashtags": "",
    "reel_hook": ""
  }
}
`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await res.json();
      aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch {
      aiText = "";
    }

    /* ===== Parse ===== */
    let finalData: any;
    try {
      finalData = JSON.parse(aiText);
    } catch {
      finalData = {
        search_data: searchData,
        verdict: "BHRAMAK",
        main_response: aiText
      };
    }

    finalData = normalize(finalData);
    setCache(cacheKey, finalData);

    return NextResponse.json(finalData);

  } catch {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}