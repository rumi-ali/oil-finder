import { generateText } from "ai";
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

    const { text } = await generateText({
      model: google("gemini-3.0-flash"),
      system: IMAGE_IDENTIFY_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: `data:${mimeType};base64,${base64}` },
            { type: "text", text: "Identify this vehicle. Return JSON only." },
          ],
        },
      ],
    });

    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);

    return Response.json(result);
  } catch {
    return Response.json(
      { error: "Could not identify vehicle from image" },
      { status: 500 }
    );
  }
}
