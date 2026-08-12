import { GoogleGenAI, Type } from "@google/genai";
import { CarStats, CarDetectionResult } from "../types";

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
 * Fallback service to get factual specifications of a car using Gemini 2.5 Flash
 * when third-party database APIs (like API Ninjas) yield no results.
 */
export async function getSpecsFromGemini(
  detection: CarDetectionResult
): Promise<CarStats> {
  const ai = getAiClient();
  const { make, model, year, trim, generation } = detection;

  const prompt = `Provide precise factual specifications for the following vehicle:
Make/Brand: ${make}
Model: ${model}
Year: ${year || "Unknown"}
Trim: ${trim || "N/A"}
Generation: ${generation || "N/A"}

You must return ONLY valid JSON matching the schema. Do not invent details; use close realistic values based on global automotive specifications.`;

  try {
    console.log(`[Gemini Specs Fallback] Requesting details for ${make} ${model}...`);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert car historian and technical specification engineer. Return precise, factual specifications for the requested vehicle.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topSpeedMph: { type: Type.INTEGER, nullable: true },
            zeroToSixtyS: { type: Type.NUMBER, nullable: true },
            horsepower: { type: Type.INTEGER, nullable: true },
            torqueLbFt: { type: Type.INTEGER, nullable: true },
            weightLbs: { type: Type.INTEGER, nullable: true },
            engineType: { type: Type.STRING, nullable: true },
            transmission: { type: Type.STRING, nullable: true },
          },
          required: [
            "topSpeedMph",
            "zeroToSixtyS",
            "horsepower",
            "torqueLbFt",
            "weightLbs",
            "engineType",
            "transmission"
          ],
        },
      },
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Gemini returned empty specs.");
    }

    const result = JSON.parse(outputText.trim()) as CarStats;
    console.log(`[Gemini Specs Fallback] Received specs: ${result.engineType}, HP: ${result.horsepower}`);
    return result;
  } catch (err: any) {
    console.error("[Gemini Specs Fallback] Error fetching specs:", err);
    // Return a default baseline stats object rather than crashing the pipeline completely
    return {
      topSpeedMph: 140,
      zeroToSixtyS: 6.5,
      horsepower: 200,
      torqueLbFt: 210,
      weightLbs: 3100,
      engineType: "2.0L Naturally Aspirated 4-Cylinder",
      transmission: "6-Speed Manual",
    };
  }
}
