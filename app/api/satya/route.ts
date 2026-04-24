import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Yahan apni REAL KEY dalo quotes ke andar
const apiKey: any = "AIzaSyAVocNyyC-LpNFBec1e49W1-laraRXCYVw";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { message, fileData, fileMimeType } = await req.json();

    // Google Search Power Enable karna
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{ googleSearchRetrieval: {} } as any],
    });

    const prompt = `
      You are "Satya AI" by Anmol Singh. 
      1. If the user provides a link or news, use GOOGLE SEARCH to verify it.
      2. Analyze uploaded images/videos for deepfakes or misinformation.
      3. Respond in user's language (Hindi/Hinglish).
      4. Always return this JSON:
      {
        "reply": "Detailed answer with search facts",
        "verdict": "REAL/FAKE/SATYA",
        "viralKit": { "caption": "...", "hashtags": "..." }
      }`;

    let result;
    if (fileData && fileMimeType) {
      // Photo/Video ke liye
      result = await model.generateContent([
        prompt,
        { inlineData: { data: fileData, mimeType: fileMimeType } }
      ]);
    } else {
      // Normal chat aur Links ke liye
      result = await model.generateContent(prompt);
    }

    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(responseText));

  } catch (error) {
    return NextResponse.json({ reply: "Bhai, API key check karo!" }, { status: 500 });
  }
}
