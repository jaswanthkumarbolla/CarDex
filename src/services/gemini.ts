import { GoogleGenAI, Type } from "@google/genai";
import { CarDetectionResult } from "../types";

// Lazy-initialized Gemini client to prevent crashing on boot if the key is empty
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

/**
 * Detects the main vehicle in an image using Gemini 2.5 Flash.
 *
 * @param imageBuffer Raw image content as a Node Buffer
 * @returns Parsed JSON-conforming vehicle recognition details
 */
export async function detectCar(imageBuffer: Buffer): Promise<CarDetectionResult> {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Vehicle scan failed: Image buffer is empty or corrupt.");
  }

  const ai = getAiClient();

  // Create inline visual payload part
  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: imageBuffer.toString("base64"),
    },
  };

  // Exact prompt requested by user
  const prompt = `You are an automotive recognition expert.

Identify the main vehicle in the image.

Return ONLY valid JSON.

{
  "make":"",
  "model":"",
  "trim":"",
  "generation":"",
  "year":null,
  "confidence":0
}

Never explain.
Never use markdown.
Return JSON only.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [imagePart, { text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            make: { type: Type.STRING },
            model: { type: Type.STRING },
            trim: { type: Type.STRING },
            generation: { type: Type.STRING },
            year: { type: Type.INTEGER, nullable: true },
            confidence: { type: Type.NUMBER },
          },
          required: ["make", "model", "trim", "generation", "year", "confidence"],
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Vision system responded with an empty payload.");
    }

    const result: CarDetectionResult = JSON.parse(outputText.trim());
    return result;
  } catch (err: any) {
    console.error("Gemini detectCar service error:", err);
    throw new Error(`Satellite vision analysis error: ${err.message || err}`);
  }
}
