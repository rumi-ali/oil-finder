import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { AIVehicleSchema } from "@/lib/vehicles";
import { AI_SPEC_SYSTEM, buildAISpecPrompt } from "@/lib/prompts";

// Simple in-memory cache: query -> { vehicle, timestamp }
const cache = new Map<string, { vehicle: unknown; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CACHE_MAX = 200;

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.vehicle;
}

function setCache(key: string, vehicle: unknown) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { vehicle, ts: Date.now() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = body?.query;

    if (
      !query ||
      typeof query !== "string" ||
      query.trim().length === 0 ||
      query.length > 200
    ) {
      return Response.json({ error: "Invalid query" }, { status: 400 });
    }

    const normalizedQuery = query.trim().toLowerCase();

    // Check cache
    const cached = getCached(normalizedQuery);
    if (cached) {
      return Response.json({ vehicle: cached, aiGenerated: true });
    }

    // 10s timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const { output: vehicle } = await generateText({
        model: google("gemini-3-flash-preview"),
        system: AI_SPEC_SYSTEM,
        prompt: buildAISpecPrompt(query.trim()),
        output: Output.object({ schema: AIVehicleSchema }),
        abortSignal: controller.signal,
      });

      if (!vehicle) {
        throw new Error("No vehicle generated");
      }

      clearTimeout(timeout);
      setCache(normalizedQuery, vehicle);

      return Response.json({ vehicle, aiGenerated: true });
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        return Response.json(
          { error: "AI generation timed out. Please try again." },
          { status: 504 }
        );
      }
      throw err;
    }
  } catch {
    return Response.json(
      { error: "AI recommendation service unavailable" },
      { status: 503 }
    );
  }
}
