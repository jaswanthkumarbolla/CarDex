import { CarDetectionResult, CarDexEntry, CarStats } from "../types";
import { ICarRepository } from "../repositories/carRepository";
import { PgCarRepository } from "../repositories/pgCarRepository";
import { queryApiNinjas } from "./apiNinjas";
import { getSpecsFromGemini } from "./geminiSpecs";
import { mapDetectionToEntry } from "../utils/carMapper";

export class CarPipeline {
  private repository: ICarRepository;

  constructor(repository: ICarRepository = new PgCarRepository()) {
    this.repository = repository;
  }

  /**
   * Resolves vehicle details through the caching, API Ninjas lookup, or Gemini fallback specs pipeline.
   *
   * @param detection Result from detectCar vision model
   * @param imageUrl base64 data URL of the scanned image
   * @returns Unified response containing the CarDexEntry and a source indicator
   */
  public async resolveVehicleDetails(
    detection: CarDetectionResult,
    imageUrl: string
  ): Promise<{ entry: CarDexEntry; fromCache: boolean }> {
    const { make, model, year } = detection;

    // 1. Search local cache (the repository) for that exact car
    try {
      const cached = await this.repository.findBySpecs(make, model, year);
      if (cached) {
        console.log(`[Pipeline] Match found in local cache for: ${make} ${model} (${year || "Any Year"}).`);
        // Update the image with the user's uploaded picture for the current session
        const updatedEntry: CarDexEntry = {
          ...cached,
          imageUrl,
          confidence: detection.confidence,
        };
        // Update it in repository
        await this.repository.save(updatedEntry);
        return { entry: updatedEntry, fromCache: true };
      }
    } catch (cacheErr) {
      console.warn("[Pipeline] Cache lookup failed, proceeding to fetch:", cacheErr);
    }

    console.log(`[Pipeline] Cache miss for: ${make} ${model}. Initializing fetch pipeline...`);

    // Create a fully-fleshed base entry using the carMapper utility
    const baseEntry = mapDetectionToEntry(detection, imageUrl);

    // 2. Query API Ninjas Cars API
    const apiNinjasStats = await queryApiNinjas(detection);

    if (apiNinjasStats) {
      console.log(`[Pipeline] Merging specs from API Ninjas into entry for ${make} ${model}.`);
      
      const mergedStats: CarStats = {
        ...baseEntry.stats,
        ...apiNinjasStats,
      };

      // Safely ensure numbers aren't overwritten with undefined
      if (apiNinjasStats.horsepower) mergedStats.horsepower = apiNinjasStats.horsepower;
      if (apiNinjasStats.transmission) mergedStats.transmission = apiNinjasStats.transmission;
      if (apiNinjasStats.engineType) mergedStats.engineType = apiNinjasStats.engineType;

      const completedEntry: CarDexEntry = {
        ...baseEntry,
        stats: mergedStats,
      };

      // Save to cache
      await this.repository.save(completedEntry);
      return { entry: completedEntry, fromCache: false };
    }

    // 3. Fallback: Query Gemini for precise factual specs
    console.log(`[Pipeline] API Ninjas yielded no results. Querying Gemini Specs Fallback...`);
    const geminiStats = await getSpecsFromGemini(detection);

    const mergedStats: CarStats = {
      ...baseEntry.stats,
      ...geminiStats,
    };

    const completedEntry: CarDexEntry = {
      ...baseEntry,
      stats: mergedStats,
    };

    // Save to cache
    await this.repository.save(completedEntry);
    return { entry: completedEntry, fromCache: false };
  }
}

// Export a single default singleton instance for convenience
export const carPipeline = new CarPipeline();
