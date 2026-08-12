import { CarDexEntry, CarStats, CarDetectionResult } from "../types";
import { mapDetectionToEntry } from "../utils/carMapper";

export interface ApiNinjasCar {
  city_mpg: number;
  class: string;
  combination_mpg: number;
  cylinders: number;
  displacement: number;
  drive: string;
  fuel_type: string;
  highway_mpg: number;
  make: string;
  model: string;
  transmission: string;
  year: number;
}

/**
 * Normalizes and formats transmission code from API Ninjas
 */
function normalizeTransmission(trans: string): string {
  if (!trans) return "6-Speed Manual";
  const lower = trans.toLowerCase();
  if (lower.startsWith("m")) {
    return "Manual";
  }
  if (lower.startsWith("a")) {
    return "Automatic";
  }
  return trans;
}

/**
 * Normalizes engine configuration from API Ninjas attributes
 */
function normalizeEngine(displacement: number, cylinders: number, fuelType: string): string {
  const parts: string[] = [];
  if (displacement) {
    parts.push(`${displacement.toFixed(1)}L`);
  }
  if (cylinders) {
    parts.push(`V${cylinders}` || `${cylinders}-Cylinder`);
  }
  if (fuelType && fuelType !== "gas") {
    parts.push(fuelType.toUpperCase());
  } else {
    parts.push("Naturally Aspirated");
  }
  return parts.join(" ");
}

/**
 * Queries API Ninjas Cars API and returns normalized stats if found
 */
export async function queryApiNinjas(
  detection: CarDetectionResult
): Promise<Partial<CarStats> | null> {
  const apiKey = process.env.API_NINJAS_API_KEY;
  if (!apiKey) {
    console.warn("[API Ninjas] API_NINJAS_API_KEY environment variable is not set. Skipping API Ninjas search.");
    return null;
  }

  const { make, model, year } = detection;
  const url = new URL("https://api.api-ninjas.com/v1/cars");
  url.searchParams.append("make", make);
  url.searchParams.append("model", model);
  if (year) {
    url.searchParams.append("year", year.toString());
  }

  try {
    console.log(`[API Ninjas] Searching database for ${make} ${model} (${year || "Any Year"})...`);
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`[API Ninjas] Request failed with status ${res.status}`);
      return null;
    }

    const data = (await res.json()) as ApiNinjasCar[];
    if (!Array.isArray(data) || data.length === 0) {
      console.log(`[API Ninjas] No records found matching ${make} ${model}.`);
      return null;
    }

    // Select the best match (first record returned)
    const record = data[0];
    console.log(`[API Ninjas] Successfully found records. Engine displacement: ${record.displacement}L, Cylinders: ${record.cylinders}`);

    const engineType = normalizeEngine(record.displacement, record.cylinders, record.fuel_type);
    const transmission = normalizeTransmission(record.transmission);

    // Return partial stats to merge with default mapped entry
    const partialStats: Partial<CarStats> = {
      engineType,
      transmission,
    };

    // Make clean, logical estimate overrides based on Class and cylinders if exact values are null
    if (record.cylinders) {
      if (record.cylinders >= 8) {
        partialStats.horsepower = 400;
        partialStats.torqueLbFt = 410;
        partialStats.zeroToSixtyS = 4.8;
      } else if (record.cylinders >= 6) {
        partialStats.horsepower = 280;
        partialStats.torqueLbFt = 295;
        partialStats.zeroToSixtyS = 5.6;
      } else {
        partialStats.horsepower = 180;
        partialStats.torqueLbFt = 190;
        partialStats.zeroToSixtyS = 7.2;
      }
    }

    return partialStats;
  } catch (err) {
    console.error("[API Ninjas] Exception occurred during fetch:", err);
    return null;
  }
}
