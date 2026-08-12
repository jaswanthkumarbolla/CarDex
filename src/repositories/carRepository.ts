import fs from "fs";
import path from "path";
import { CarDexEntry } from "../types";

export interface ICarRepository {
  findBySpecs(make: string, model: string, year: number | null): Promise<CarDexEntry | null>;
  save(entry: CarDexEntry): Promise<void>;
  getAll(): Promise<CarDexEntry[]>;
}

export class JsonCarRepository implements ICarRepository {
  private dbFile = path.join(process.cwd(), "catalog_db.json");

  private load(): { presets: CarDexEntry[]; embeddingCache: any[] } {
    try {
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, "utf-8");
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

  private saveDb(data: { presets: CarDexEntry[]; embeddingCache: any[] }) {
    try {
      fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save catalog_db.json:", err);
    }
  }

  public async findBySpecs(make: string, model: string, year: number | null): Promise<CarDexEntry | null> {
    const db = this.load();
    const cleanMake = make.toLowerCase().trim();
    const cleanModel = model.toLowerCase().trim();

    // Find an exact or close match in the local cache (presets)
    const found = db.presets.find((car) => {
      const carBrand = car.brand.toLowerCase().trim();
      const carName = car.name.toLowerCase().trim();

      // Check if brand matches make
      const brandMatch = carBrand === cleanMake || carBrand.includes(cleanMake) || cleanMake.includes(carBrand);
      // Check if name contains model or vice versa
      const nameMatch = carName === cleanModel || carName.includes(cleanModel) || cleanModel.includes(carName);

      if (brandMatch && nameMatch) {
        if (year !== null && car.year) {
          // Match within 1 year to handle slight model-year variations
          return Math.abs(car.year - year) <= 1;
        }
        return true;
      }
      return false;
    });

    return found || null;
  }

  public async save(entry: CarDexEntry): Promise<void> {
    const db = this.load();
    const index = db.presets.findIndex(
      (c) => c.brand.toLowerCase().trim() === entry.brand.toLowerCase().trim() &&
             c.name.toLowerCase().trim() === entry.name.toLowerCase().trim() &&
             c.year === entry.year
    );

    if (index !== -1) {
      // Merge properties safely
      db.presets[index] = { ...db.presets[index], ...entry };
    } else {
      db.presets.unshift(entry);
    }

    this.saveDb(db);
  }

  public async getAll(): Promise<CarDexEntry[]> {
    const db = this.load();
    return db.presets;
  }
}
