import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getVehicleById } from "@/lib/vehicles";
import { OIL_ADVISOR_SYSTEM, buildExplanationPrompt } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const vehicleId = body?.vehicleId;

    if (
      !vehicleId ||
      typeof vehicleId !== "string" ||
      !/^[a-z0-9-]+$/.test(vehicleId) ||
      vehicleId.length > 100
    ) {
      return Response.json({ error: "Invalid vehicle ID" }, { status: 400 });
    }

    const vehicle = getVehicleById(vehicleId);

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
