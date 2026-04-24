import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = "AIzaSyAVocNyyC-LpNFBec1e49W1-laraRXCYVw"; 
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { message, fileData, fileMimeType } = await req.json();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      // @ts-ignore
      tools: [{ googleSearchRetrieval: {} }] 
    });

    const systemPrompt = `You are "Satya AI" created and managed by Anmol Singh.
    Instructions:
    1. For links/news: Use Google Search for live verification.
    2. For photos/videos: Analyze for deepfakes, edits, or misinformation.
    3. Branding: Give startup and viral growth advice.
    4. Format: Return ONLY a JSON object:
    {"reply": "...", "verdict": "REAL/FAKE/SATYA", "viralKit": {"caption": "...", "hashtags": "..."}}`;

    let result;
    if (fileData && fileMimeType) {
      result = await model.generateContent([
        systemPrompt + "\nUser: " + message,
        { inlineData: { data: fileData, mimeType: fileMimeType } }
      ]);
    } else {
      result = await model.generateContent(systemPrompt + "\nUser: " + message);
    }

    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    return NextResponse.json(JSON.parse(responseText));
  } catch (error) {
    return NextResponse.json({ reply: "Bhai, API Key check karo!" }, { status: 500 });
  }
}
