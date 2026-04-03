import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getVehicleById } from "@/lib/vehicles";
import { CHAT_SYSTEM, buildChatContext } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const { messages, vehicleId } = await req.json();

    if (
      !vehicleId ||
      typeof vehicleId !== "string" ||
      !/^[a-z0-9-]+$/.test(vehicleId) ||
      vehicleId.length > 100
    ) {
      return Response.json({ error: "Invalid vehicle ID" }, { status: 400 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages required" }, { status: 400 });
    }

    const vehicle = getVehicleById(vehicleId);
    if (!vehicle) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const vehicleContext = buildChatContext(vehicle);

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: `${CHAT_SYSTEM}\n\n${vehicleContext}`,
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch {
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }
}
