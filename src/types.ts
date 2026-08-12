/**
 * Type declarations for the CarDex Pokédex system.
 */

export interface CarStats {
  topSpeedMph: number | null;
  zeroToSixtyS: number | null;
  horsepower: number | null;
  torqueLbFt: number | null;
  weightLbs: number | null;
  engineType: string | null;
  transmission: string | null;
}

export interface RestorationIssue {
  id: string;
  component: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  rarityOfParts: "Abundant" | "Moderate" | "Scarce" | "Extremely Rare";
  fixed: boolean;
}

export interface RestorationInsight {
  difficultyRating: number; // 1-100 rating
  partsAvailability: string; // e.g. "Scarce - Classic JDM OEM parts required"
  commonIssues: RestorationIssue[];
  proRestorationTip: string;
}

export interface CarDexEntry {
  dexId: string; // e.g., "001"
  name: string;
  brand: string;
  year: number;
  category: "JDM" | "Muscle" | "Exotic" | "Classic Vintage" | "Tuned Cult";
  rarity: "Common" | "Rare" | "Legendary" | "Mythical";
  description: string;
  imageUrl: string;
  stats: CarStats;
  restoration: RestorationInsight;
  history: {
    originCountry: string;
    eraCulture: string;
    legendaryFact: string;
    notableDriverOrRace: string;
  };
  features?: string[];
  confidence?: number;
}

export interface SearchResponse {
  success: boolean;
  entry?: CarDexEntry;
  error?: string;
}

export interface CarDetectionResult {
  make: string;
  model: string;
  trim: string;
  generation: string;
  year: number | null;
  confidence: number;
}
