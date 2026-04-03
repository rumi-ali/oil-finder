import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getVehicleById, AIVehicleSchema } from "@/lib/vehicles";
import type { Vehicle } from "@/lib/vehicles";
import { OIL_ADVISOR_SYSTEM, buildExplanationPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const vehicleId = body?.vehicleId;
    const rawVehicle = body?.vehicle;

    let vehicle: Vehicle | null = null;

    if (rawVehicle) {
      // AI-generated vehicle passed directly — validate with Zod
      const parsed = AIVehicleSchema.safeParse(rawVehicle);
      if (!parsed.success) {
        return Response.json({ error: "Invalid vehicle data" }, { status: 400 });
      }
      vehicle = parsed.data as Vehicle;
    } else if (
      vehicleId &&
      typeof vehicleId === "string" &&
      /^[a-z0-9-]+$/.test(vehicleId) &&
      vehicleId.length <= 100
    ) {
      vehicle = getVehicleById(vehicleId);
    }

    if (!vehicle) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: OIL_ADVISOR_SYSTEM,
      prompt: buildExplanationPrompt(vehicle),
    });

    return result.toTextStreamResponse();
  } catch {
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }
}
