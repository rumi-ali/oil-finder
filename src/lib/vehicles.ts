import vehiclesData from "@/data/vehicles.json";

export type VehicleType = "ice" | "ev" | "hybrid";

export interface VehicleEngine {
  displacement: string;
  type: string;
  code: string;
  transmission: string;
}

export interface OilSpec {
  viscosity: string;
  type: string;
  api_rating: string | null;
  ilsac_rating: string | null;
  capacity_qt: number;
  change_interval_miles: number;
  filter_part: string;
}

export interface CompatibleProduct {
  name: string;
  tier: "premium" | "standard";
}

export interface Vehicle {
  vehicle_id: string;
  type: VehicleType;
  make: string;
  model: string;
  trim: string;
  year: number;
  year_range: [number, number];
  engine: VehicleEngine;
  oil: OilSpec | null;
  oem_approval: string | null;
  alternative_viscosity: string | null;
  notes: string | null;
  aliases: string[];
  source: string;
  compatible_products: CompatibleProduct[];
}

const vehicles: Vehicle[] = vehiclesData as Vehicle[];

export function getVehicleById(vehicleId: string): Vehicle | null {
  return vehicles.find((v) => v.vehicle_id === vehicleId) ?? null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function buildVehicleSlug(
  make: string,
  model: string,
  trim: string,
  year: number
): string {
  return `${slugify(make)}-${slugify(model)}-${slugify(trim)}-${year}`;
}

export interface SearchResult {
  vehicle_id: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  engine: VehicleEngine;
  type: VehicleType;
  inDataset: boolean;
}

export function searchVehicles(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const tokens = q.split(/\s+/);

  // Extract year if present (4-digit number between 1990-2030)
  let yearToken: number | null = null;
  const nonYearTokens: string[] = [];
  for (const t of tokens) {
    const num = parseInt(t, 10);
    if (!isNaN(num) && num >= 1990 && num <= 2030) {
      yearToken = num;
    } else {
      nonYearTokens.push(t);
    }
  }

  const searchText = nonYearTokens.join(" ");

  return vehicles
    .filter((v) => {
      // Year filter if provided
      if (yearToken !== null) {
        if (yearToken < v.year_range[0] || yearToken > v.year_range[1]) {
          return false;
        }
      }

      // Match against make + model + trim + aliases
      const haystack = [
        v.make.toLowerCase(),
        v.model.toLowerCase(),
        v.trim.toLowerCase(),
        ...v.aliases.map((a) => a.toLowerCase()),
      ].join(" ");

      // All non-year tokens must appear somewhere in the haystack
      return nonYearTokens.every((token) => haystack.includes(token));
    })
    .map((v) => ({
      vehicle_id: v.vehicle_id,
      make: v.make,
      model: v.model,
      trim: v.trim,
      year: yearToken ?? v.year,
      engine: v.engine,
      type: v.type,
      inDataset: true,
    }));
}

export function getAllMakes(): string[] {
  const makes = new Set(vehicles.map((v) => v.make));
  return Array.from(makes).sort();
}

export function getPopularVehicles(): SearchResult[] {
  const popular = [
    "honda-civic-touring-2022",
    "toyota-camry-le-2023",
    "ford-f150-xlt-2023",
    "bmw-330i-2022",
    "tesla-model-3-2023",
  ];
  return popular
    .map((id) => {
      const v = getVehicleById(id);
      if (!v) return null;
      return {
        vehicle_id: v.vehicle_id,
        make: v.make,
        model: v.model,
        trim: v.trim,
        year: v.year,
        engine: v.engine,
        type: v.type,
        inDataset: true,
      };
    })
    .filter((v): v is SearchResult => v !== null);
}
