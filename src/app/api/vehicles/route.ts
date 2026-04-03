import { NextRequest } from "next/server";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { searchVehicles, getAllMakes } from "@/lib/vehicles";

const CorrectionSchema = z.object({
  correctedQuery: z.string(),
  isTypo: z.boolean(),
});

const TrimSchema = z.object({
  trims: z.array(
    z.object({
      trim: z.string(),
      engine: z.object({
        displacement: z.string(),
        type: z.string(),
        transmission: z.string(),
      }),
    })
  ),
});

async function correctQuery(query: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const { output } = await generateText({
      model: google("gemini-3-flash-preview"),
      system: `You fix vehicle name typos. Given a search query for a vehicle, correct any misspellings. Known vehicle makes: ${getAllMakes().join(", ")}. Return the corrected query and whether it was a typo. If the query looks correct already, return it unchanged with isTypo=false.`,
      prompt: `Correct this vehicle search query: "${query}"`,
      output: Output.object({ schema: CorrectionSchema }),
      abortSignal: controller.signal,
    });

    clearTimeout(timeout);
    if (output?.isTypo && output.correctedQuery !== query) {
      return output.correctedQuery;
    }
    return null;
  } catch {
    return null;
  }
}

async function expandTrims(
  make: string,
  model: string,
  year: number,
  existingTrims: string[]
): Promise<Array<{ trim: string; engine: { displacement: string; type: string; transmission: string } }>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const { output } = await generateText({
      model: google("gemini-3-flash-preview"),
      system: `You are a vehicle database expert. Given a vehicle make, model, and year, return ALL commonly available trims with their engine specs. Only return trims that are NOT in the existing list. Be accurate with engine displacement, type, and transmission.`,
      prompt: `${year} ${make} ${model}. Existing trims: ${existingTrims.join(", ")}. Return the MISSING trims only.`,
      output: Output.object({ schema: TrimSchema }),
      abortSignal: controller.signal,
    });

    clearTimeout(timeout);
    return output?.trims ?? [];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return Response.json({ error: "Missing query parameter" }, { status: 400 });
  }

  if (q.length > 200) {
    return Response.json({ error: "Query too long" }, { status: 400 });
  }

  let results = searchVehicles(q);
  let correctedQuery: string | null = null;

  // If no results, try Gemini spell correction
  if (results.length === 0) {
    const corrected = await correctQuery(q.trim());
    if (corrected) {
      results = searchVehicles(corrected);
      if (results.length > 0) {
        correctedQuery = corrected;
      }
    }
  }

  // If we have results but few trims, expand with Gemini
  if (results.length > 0 && results.length <= 3) {
    const make = results[0].make;
    const model = results[0].model;
    const year = results[0].year;
    const existingTrims = results.map((r) => r.trim);

    const extraTrims = await expandTrims(make, model, year, existingTrims);
    for (const t of extraTrims) {
      results.push({
        vehicle_id: `ai-${make}-${model}-${t.trim}-${year}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-"),
        make,
        model,
        trim: t.trim,
        year,
        engine: { ...t.engine, code: "" },
        type: "ice",
        inDataset: false,
      });
    }
  }

  return Response.json({ results, query: q, correctedQuery: correctedQuery ?? undefined });
}
