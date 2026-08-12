import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import multer from "multer";
import { CarDexEntry } from "./src/types";
import { detectCar } from "./src/services/gemini";
import { mapDetectionToEntry } from "./src/utils/carMapper";
import { carPipeline } from "./src/services/carPipeline";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" })); // Sufficient size for uploading camera or local car pictures

// Configure Multer for handling file uploads in-memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // Limit to 15MB to match our JSON parser limit
  },
});

// Lazy initialization of Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it to your secrets or .env file.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// DATABASE & PERSISTENCE
// ----------------------------------------------------

const DB_FILE = path.join(process.cwd(), "catalog_db.json");

interface DBStructure {
  presets: CarDexEntry[];
  embeddingCache: { embedding: number[]; entry: CarDexEntry }[];
}

function loadDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        presets: parsed.presets || [],
        embeddingCache: parsed.embeddingCache || []
      };
    }
  } catch (err) {
    console.error("Failed to load catalog_db.json:", err);
  }
  return { presets: [], embeddingCache: [] };
}

function saveDB(data: DBStructure) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save catalog_db.json:", err);
  }
}

// Global active database state loaded on boot
let dbState = loadDB();

// ----------------------------------------------------
// FALLBACK VECTOR GRAPHIC ASSET (No Scraped Unsplash URL Mismatch)
// ----------------------------------------------------
const RETRO_CAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" fill="%2309090b"/><g opacity="0.15"><line x1="0" y1="50" x2="400" y2="50" stroke="%23ef4444" stroke-width="1"/><line x1="0" y1="100" x2="400" y2="100" stroke="%23ef4444" stroke-width="1"/><line x1="0" y1="150" x2="400" y2="150" stroke="%23ef4444" stroke-width="1"/><line x1="0" y1="200" x2="400" y2="200" stroke="%23ef4444" stroke-width="1"/><line x1="0" y1="250" x2="400" y2="250" stroke="%23ef4444" stroke-width="1"/><line x1="50" y1="0" x2="50" y2="300" stroke="%23ef4444" stroke-width="1"/><line x1="100" y1="0" x2="100" y2="300" stroke="%23ef4444" stroke-width="1"/><line x1="150" y1="0" x2="150" y2="300" stroke="%23ef4444" stroke-width="1"/><line x1="200" y1="0" x2="200" y2="300" stroke="%23ef4444" stroke-width="1"/><line x1="250" y1="0" x2="250" y2="300" stroke="%23ef4444" stroke-width="1"/><line x1="300" y1="0" x2="300" y2="300" stroke="%23ef4444" stroke-width="1"/><line x1="350" y1="0" x2="350" y2="300" stroke="%23ef4444" stroke-width="1"/></g><path d="M 80,180 L 120,130 L 260,130 L 320,180 Z" fill="none" stroke="%23ef4444" stroke-width="4" stroke-linejoin="round"/><rect x="100" y="180" width="200" height="30" fill="%23ef4444" rx="4"/><circle cx="130" cy="210" r="20" fill="%2309090b" stroke="%23ef4444" stroke-width="4"/><circle cx="270" cy="210" r="20" fill="%2309090b" stroke="%23ef4444" stroke-width="4"/><path d="M 120,150 L 260,150" stroke="%23ef4444" stroke-width="2"/><text x="50%" y="80" dominant-baseline="middle" text-anchor="middle" fill="%23ef4444" font-family="monospace" font-size="12" letter-spacing="4">NO SCAN VISUAL AVAILABLE</text><text x="50%" y="270" dominant-baseline="middle" text-anchor="middle" fill="%2371717a" font-family="monospace" font-size="10" letter-spacing="1">UPLINK CAR VIA PHOTO SCAN TO VIEW</text></svg>`;

// Helper to provide schema for Gemini JSON structured response
const carDexEntrySchema = {
  type: Type.OBJECT,
  description: "Comprehensive Pokédex-style automotive telemetry, historical stats and vintage restoration insight.",
  properties: {
    brand: { type: Type.STRING, description: "Automobile manufacturer brand (e.g. Ford, Toyota, BMW)" },
    name: { type: Type.STRING, description: "Classic or performance car model name (e.g. Mustang Boss 302, Countach)" },
    year: { type: Type.INTEGER, description: "Year of manufacturing (must be older performance or vintage)" },
    category: { 
      type: Type.STRING, 
      enum: ["JDM", "Muscle", "Exotic", "Classic Vintage", "Tuned Cult"],
      description: "Car classification category"
    },
    rarity: { 
      type: Type.STRING, 
      enum: ["Common", "Rare", "Legendary", "Mythical"],
      description: "Automotive collector rarity"
    },
    description: { type: Type.STRING, description: "Enthusiast-level 2-3 sentence lore description of the car" },
    stats: {
      type: Type.OBJECT,
      properties: {
        topSpeedMph: { type: Type.INTEGER, description: "Top speed in miles per hour. Set to null if not confident about exact output.", nullable: true },
        zeroToSixtyS: { type: Type.NUMBER, description: "0-60 mph acceleration rate in seconds. Set to null if you are not sure.", nullable: true },
        horsepower: { type: Type.INTEGER, description: "Engine horsepower. Set to null if you are not sure of correct parameters.", nullable: true },
        torqueLbFt: { type: Type.INTEGER, description: "Engine torque in lb-ft. Set to null if you are not sure of correct parameters.", nullable: true },
        weightLbs: { type: Type.INTEGER, description: "Weight of car in lbs. Set to null if you are not confident of physical mass dimensions.", nullable: true },
        engineType: { type: Type.STRING, description: "Engine specification details (e.g. 5.0L NA V8, RB26DETT Twin-Turbo I6)", nullable: true },
        transmission: { type: Type.STRING, description: "Typical vintage/high performance manual or automatic transmission set up (e.g. 6-Speed Manual)", nullable: true }
      },
      required: ["topSpeedMph", "zeroToSixtyS", "horsepower", "torqueLbFt", "weightLbs", "engineType", "transmission"]
    },
    restoration: {
      type: Type.OBJECT,
      properties: {
        difficultyRating: { type: Type.INTEGER, description: "Integer restoration hazard score from 1 to 100" },
        partsAvailability: { type: Type.STRING, description: "Short description of original/reproduction part sourcing rarity" },
        commonIssues: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Short unique key (e.g. issues-1, issue-2)" },
              component: { type: Type.STRING, description: "Component group name" },
              description: { type: Type.STRING, description: "Detailed structural, electronic or engine failure issue description" },
              difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard", "Expert"] },
              rarityOfParts: { type: Type.STRING, enum: ["Abundant", "Moderate", "Scarce", "Extremely Rare"] },
              fixed: { type: Type.BOOLEAN, description: "Starts as false always" }
            },
            required: ["id", "component", "description", "difficulty", "rarityOfParts", "fixed"]
          }
        },
        proRestorationTip: { type: Type.STRING, description: "Highly specific expert restoration tip for tuning or mechanical rebuild for this model" }
      },
      required: ["difficultyRating", "partsAvailability", "commonIssues", "proRestorationTip"]
    },
    history: {
      type: Type.OBJECT,
      properties: {
        originCountry: { type: Type.STRING, description: "Country of legal and mechanical origin" },
        eraCulture: { type: Type.STRING, description: "Socio-cultural automotive tuning or motoring landscape of its decade" },
        legendaryFact: { type: Type.STRING, description: "Stunning trivia or hidden feature standard drivers do not know about" },
        notableDriverOrRace: { type: Type.STRING, description: "A famous racing championship, historic tuner hero or race event it won" }
      },
      required: ["originCountry", "eraCulture", "legendaryFact", "notableDriverOrRace"]
    },
    features: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-6 short, specific, visually-spottable details on the car chassis/body/exterior styling from this specific model"
    },
    confidence: {
      type: Type.NUMBER,
      description: "Float score between 0.0 and 1.0 representing your diagnostic identification confidence specifically about make/model/year setup"
    }
  },
  required: ["brand", "name", "year", "category", "rarity", "description", "stats", "restoration", "history", "features", "confidence"]
};


// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

// List Presets
app.get("/api/cardex/presets", (req, res) => {
  res.json({ success: true, list: dbState.presets });
});

// Check API Key status safely
app.get("/api/cardex/status", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY.trim() !== "";
  res.json({ success: true, hasApiKey: hasKey });
});

// Search and Generate
app.post("/api/cardex/search", async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ success: false, error: "Query must be a valid search string." });
  }

  const cleanQuery = query.toLowerCase().trim();

  // 1. Check inside database presets first to save resources
  const foundPreset = dbState.presets.find(
    (car) =>
      car.name.toLowerCase().includes(cleanQuery) ||
      car.brand.toLowerCase().includes(cleanQuery) ||
      `${car.year} ${car.brand} ${car.name}`.toLowerCase().includes(cleanQuery)
  );

  if (foundPreset) {
    return res.json({ success: true, entry: foundPreset });
  }

  // 2. Generate with Gemini 3.5 Flash
  try {
    const ai = getGeminiClient();
    const prompt = `Research and compile a complete Pokédex-style CarDex entry for the following car query: "${query}". 
    Focus on classic, retro, tuner, JDM, muscle, or vintage performance vehicles if possible. 
    Provide highly detailed specifications, historical value, legendary racing history, and critical vintage restoration checklists inside the requested structure.
    Always commit to your closest guess on obscure, classic, or modified cars instead of refusing, and lower confidence float score instead.
    For topSpeedMph, zeroToSixtyS, horsepower, torqueLbFt, and weightLbs, use null if you're not confident about them — never invent a precise-sounding number if you don't know it.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the Ultimate CarDex Core AI, a high-fidelity Pokédex built for car mechanics, tuning enthusiasts, and classic auto collectors. Return accurate historical figures, authentic JDM/Muscle/Exotic mechanical insights, true specs, and real specific restoration bugs for the requested vehicle.",
        responseMimeType: "application/json",
        responseSchema: carDexEntrySchema,
      },
    });

    const dataText = response.text;
    if (!dataText) {
      throw new Error("Empty response from AI engine.");
    }

    const parsedEntry = JSON.parse(dataText);
    const generatedDexId = Math.floor(Math.random() * 800 + 100).toString(); // virtual pokedex ID

    const completedEntry: CarDexEntry = {
      ...parsedEntry,
      dexId: generatedDexId,
      imageUrl: RETRO_CAR_SVG
    };

    // Push new search entry into actual catalog database to allow catalog database to grow over time!
    if (!dbState.presets.some(c => c.name.toLowerCase() === completedEntry.name.toLowerCase())) {
      dbState.presets.unshift(completedEntry);
      saveDB(dbState);
    }

    res.json({ success: true, entry: completedEntry });
  } catch (err: any) {
    console.error("Gemini search error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to compile CarDex data." });
  }
});

// Scan Uploaded Photo via Gemini Vision
app.post("/api/cardex/scan", async (req, res) => {
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ success: false, error: "Image data (base64) required to execute scan." });
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const formattedDataUri = `data:${mimeType || "image/jpeg"};base64,${cleanBase64}`;
    const imageBuffer = Buffer.from(cleanBase64, "base64");

    console.log("Routing vehicle photo to Gemini 2.5 Flash detection service...");
    const detectionResult = await detectCar(imageBuffer);

    console.log("Successfully recognized vehicle:", detectionResult);

    // Resolve details using multi-source caching/fetching pipeline
    const { entry: completedEntry, fromCache } = await carPipeline.resolveVehicleDetails(
      detectionResult,
      formattedDataUri
    );

    res.json({ success: true, entry: completedEntry, fromCache });

  } catch (err: any) {
    console.error("Gemini Vision scan error:", err);
    res.status(500).json({ success: false, error: err.message || "Vision engine failed to process car scan." });
  }
});

// Single-purpose /api/detect endpoint to identify vehicle details
app.post("/api/detect", upload.single("image"), async (req, res) => {
  try {
    let imageBuffer: Buffer | undefined;

    // 1. Check if file is uploaded as multipart/form-data
    if (req.file) {
      imageBuffer = req.file.buffer;
    }
    // 2. Fallback: check if uploaded as base64 in JSON request body
    else if (req.body && (req.body.imageBase64 || req.body.image)) {
      const base64Data = req.body.imageBase64 || req.body.image;
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(cleanBase64, "base64");
    }

    // Return 400 if no image/file is found
    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No vehicle image file or base64 payload provided in the request.",
      });
    }

    console.log(`Analyzing uploaded photo of size ${imageBuffer.length} bytes via Gemini Vision Service...`);
    
    // Call detectCar function from the Gemini service module
    const result = await detectCar(imageBuffer);

    // Return the response object exactly as returned from detectCar()
    return res.json(result);
  } catch (err: any) {
    console.error("Endpoint detect error:", err);
    // Return 500 if an error is thrown
    return res.status(500).json({
      success: false,
      error: err.message || "An error occurred during Gemini automotive vision analysis.",
    });
  }
});


// ----------------------------------------------------
// SYSTEM BINDING AND STATIC FILES
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CarDex Engine online at http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
