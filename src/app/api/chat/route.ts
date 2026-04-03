import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getVehicleById, AIVehicleSchema } from "@/lib/vehicles";
import type { Vehicle } from "@/lib/vehicles";
import { CHAT_SYSTEM, buildChatContext } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, vehicleId } = body;
    const rawVehicle = body?.vehicle;

    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "Messages required" }, { status: 400 });
    }

    let vehicle: Vehicle | null = null;

    if (rawVehicle) {
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

    const vehicleContext = buildChatContext(vehicle);

    // Convert UIMessage format (parts) to ModelMessage format (content)
    type RawMsg = { role: string; content?: string; parts?: Array<{ type: string; text?: string }> };
    const modelMessages = (messages as RawMsg[]).map((msg) => {
      if (msg.content) return { role: msg.role as "user" | "assistant", content: msg.content };
      const text = msg.parts
        ?.filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("") ?? "";
      return { role: msg.role as "user" | "assistant", content: text };
    });

    const result = streamText({
      model: google("gemini-3-flash-preview"),
      system: `${CHAT_SYSTEM}\n\n${vehicleContext}`,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch {
    return Response.json(
      { error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }
}
