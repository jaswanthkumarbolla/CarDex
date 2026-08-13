import { neon } from "@neondatabase/serverless";
import { CarDexEntry } from "../types";
import { ICarRepository } from "./carRepository";

/**
 * Postgres-backed implementation of ICarRepository, using Neon's serverless
 * HTTP driver. This is safe to use inside Vercel serverless functions because
 * it does not hold a persistent TCP connection open across invocations —
 * unlike `pg` / connection-pool based drivers, which will exhaust Neon's
 * connection limit under serverless concurrency.
 *
 * Requires DATABASE_URL to be set in the environment (Vercel project settings).
 */
export class PgCarRepository implements ICarRepository {
  private sql: ReturnType<typeof neon>;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not defined. Add your Neon connection string to Vercel's environment variables."
      );
    }
    this.sql = neon(connectionString);
  }

  /**
   * Ensures the cardex_entries table exists. Safe to call on every cold
   * start — CREATE TABLE IF NOT EXISTS is a no-op once the table is there.
   */
  public async ensureSchema(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS cardex_entries (
        id SERIAL PRIMARY KEY,
        dex_id TEXT NOT NULL,
        brand TEXT NOT NULL,
        name TEXT NOT NULL,
        year INTEGER NOT NULL,
        brand_lower TEXT NOT NULL,
        name_lower TEXT NOT NULL,
        entry JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_cardex_brand_name
      ON cardex_entries (brand_lower, name_lower)
    `;
  }

  public async findBySpecs(
    make: string,
    model: string,
    year: number | null
  ): Promise<CarDexEntry | null> {
    await this.ensureSchema();

    const cleanMake = make.toLowerCase().trim();
    const cleanModel = model.toLowerCase().trim();

    // Pull candidate rows matching brand/name loosely, then apply the same
    // fuzzy "includes either way" + 1-year-tolerance logic the JSON version used.
    const rows = await this.sql`
      SELECT entry, year FROM cardex_entries
      WHERE brand_lower LIKE '%' || ${cleanMake} || '%'
         OR ${cleanMake} LIKE '%' || brand_lower || '%'
    `;

    for (const row of rows as any[]) {
      const entry = row.entry as CarDexEntry;
      const carName = entry.name.toLowerCase().trim();
      const nameMatch = carName === cleanModel || carName.includes(cleanModel) || cleanModel.includes(carName);
      if (!nameMatch) continue;

      if (year !== null && entry.year) {
        if (Math.abs(entry.year - year) <= 1) return entry;
        continue;
      }
      return entry;
    }

    return null;
  }

  public async save(entry: CarDexEntry): Promise<void> {
    await this.ensureSchema();

    const brandLower = entry.brand.toLowerCase().trim();
    const nameLower = entry.name.toLowerCase().trim();

    const existing = (await this.sql`
      SELECT id, entry FROM cardex_entries
      WHERE brand_lower = ${brandLower} AND name_lower = ${nameLower} AND year = ${entry.year}
      LIMIT 1
    `) as { id: number; entry: CarDexEntry }[];

    if (existing.length > 0) {
      const merged = { ...existing[0].entry, ...entry };
      await this.sql`
        UPDATE cardex_entries
        SET entry = ${JSON.stringify(merged)}::jsonb, updated_at = now()
        WHERE id = ${existing[0].id}
      `;
    } else {
      await this.sql`
        INSERT INTO cardex_entries (dex_id, brand, name, year, brand_lower, name_lower, entry)
        VALUES (${entry.dexId}, ${entry.brand}, ${entry.name}, ${entry.year}, ${brandLower}, ${nameLower}, ${JSON.stringify(entry)}::jsonb)
      `;
    }
  }

  public async getAll(): Promise<CarDexEntry[]> {
    await this.ensureSchema();
    const rows = await this.sql`
      SELECT entry FROM cardex_entries ORDER BY created_at DESC
    `;
    return (rows as any[]).map((r) => r.entry as CarDexEntry);
  }
}
