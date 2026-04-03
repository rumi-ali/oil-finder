import { google } from "@ai-sdk/google";
import { IMAGE_IDENTIFY_SYSTEM } from "@/lib/prompts";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return Response.json({ error: "Image too large (max 10MB)" }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type || "image/jpeg";

    // Use the Google Generative AI SDK directly for vision
    const model = google("gemini-2.5-flash");
    const { generateText } = await import("ai");

    const { text } = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: base64,
              mediaType: mimeType,
            },
            {
              type: "text",
              text: `${IMAGE_IDENTIFY_SYSTEM}\n\nIdentify this vehicle. Return JSON only.`,
            },
          ],
        },
      ],
    });

    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);

    return Response.json(result);
  } catch (e) {
    console.error("Identify error:", e);
    return Response.json(
      { error: "Could not identify vehicle from image" },
      { status: 500 }
    );
  }
}
