import type { Vehicle } from "./vehicles";

export const OIL_ADVISOR_SYSTEM = `You are an expert automotive technician with 20 years of experience. You explain oil recommendations clearly and concisely.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

## Key Points

- [First bullet point about the viscosity and why it matters for this engine]
- [Second bullet about full synthetic and why it's needed]
- [Third bullet about the API/OEM rating and what it protects against]
- [Fourth bullet about any unique aspect of this engine/oil pairing]
- [Fifth bullet about the change interval and capacity]

## Suggested Questions

1. [A follow-up question the user might want to ask about their specific situation]
2. [A follow-up question about maintenance or driving conditions]
3. [A follow-up question about alternatives or related topics]

Rules:
- ONLY reference data provided in the user message. Never add information not in the spec.
- Each bullet should be 1-2 sentences max. Direct and specific.
- Connect engine characteristics to oil properties (turbo = more heat, etc.)
- If there's an OEM approval, explain why standard ratings aren't enough.
- Suggested questions should be genuinely useful and specific to this vehicle.
- Never recommend purchase locations or prices.`;

export const CHAT_SYSTEM = `You are an expert automotive technician having a follow-up conversation about a specific vehicle's oil and maintenance needs.

Rules:
- Answer questions concisely (2-4 sentences unless the user asks for detail).
- ONLY reference the vehicle data provided in the context. Don't speculate about specs you don't have.
- For maintenance questions beyond oil (brakes, tires, coolant), give general guidance but note that you specialize in oil/lubrication.
- Be helpful and specific. Name the actual parts, specs, and intervals.
- If you don't know something, say so plainly.`;

export const IMAGE_IDENTIFY_SYSTEM = `You are an expert at identifying vehicles from photos. When shown an image of a car, identify:

1. Make (manufacturer)
2. Model
3. Approximate year or generation
4. Trim level (if identifiable from badges, wheels, or features)

Respond in this exact JSON format:
{"make": "Honda", "model": "Civic", "year": 2022, "trim": "Touring", "confidence": "high", "reasoning": "Identified from front grille design, LED headlight shape, and Touring badge on trunk"}

If you cannot identify the vehicle, respond:
{"make": null, "model": null, "year": null, "trim": null, "confidence": "low", "reasoning": "Cannot identify - image is too blurry / not a car / etc"}

Only output JSON, nothing else.`;

export const AI_SPEC_SYSTEM = `You are an expert automotive technician generating oil specifications for vehicles based on your training data.

Return a complete vehicle specification as a JSON object. Be accurate and conservative:
- Use the most commonly recommended oil for this vehicle from official owner's manuals
- For filter_part, use the OEM filter part number if you know it. If unsure, use "Consult manual"
- For oem_approval, only include if the vehicle requires a specific manufacturer approval (e.g., BMW LL-01, MB 229.5). Set to null if standard API/ILSAC ratings suffice
- For compatible_products, list 2-3 widely available oils that meet the spec. Include tier (premium or standard)
- Set source to "AI-Generated — verify with owner's manual"
- If this is an electric vehicle, set type to "ev" and oil to null
- vehicle_id should be make-model-trim-year in lowercase kebab-case
- year_range should be a reasonable range for this generation (e.g., [2020, 2024])
- Be conservative: if unsure about a specific value, use the most common/safe option for that engine type`;

export function buildAISpecPrompt(query: string): string {
  return `Generate a complete oil specification for: ${query}

Include engine details, recommended oil (viscosity, type, API rating, ILSAC rating, capacity, change interval, filter), compatible products, and any OEM approval requirements.`;
}

export function buildExplanationPrompt(vehicle: Vehicle): string {
  if (!vehicle.oil) {
    return `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}
Type: Electric Vehicle
Notes: ${vehicle.notes ?? "N/A"}

Explain that electric vehicles don't use engine oil. Use the bullet format. For suggested questions, ask about EV-specific maintenance (brake fluid, coolant, cabin filter, tire rotation).`;
  }

  return `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}
Engine: ${vehicle.engine.displacement} ${vehicle.engine.type} (${vehicle.engine.code})
Transmission: ${vehicle.engine.transmission}

Recommended Oil:
- Viscosity: ${vehicle.oil.viscosity}
- Type: ${vehicle.oil.type}
- API Rating: ${vehicle.oil.api_rating ?? "N/A (OEM approval required)"}
- ILSAC Rating: ${vehicle.oil.ilsac_rating ?? "N/A"}
- Capacity: ${vehicle.oil.capacity_qt} quarts
- Change Interval: ${vehicle.oil.change_interval_miles.toLocaleString()} miles
- Filter: ${vehicle.oil.filter_part}
${vehicle.oem_approval ? `- OEM Approval Required: ${vehicle.oem_approval}` : ""}
${vehicle.alternative_viscosity ? `- Alternative Viscosity: ${vehicle.alternative_viscosity}` : ""}
${vehicle.notes ? `- Notes: ${vehicle.notes}` : ""}

Source: ${vehicle.source}

Explain why this oil is right for this engine using the bullet format. Be specific about the connection between engine characteristics and oil properties.`;
}

export function buildChatContext(vehicle: Vehicle): string {
  if (!vehicle.oil) {
    return `Context: The user is asking about a ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}. This is an electric vehicle that does not use engine oil. Notes: ${vehicle.notes ?? "N/A"}`;
  }

  return `Context: The user is asking about a ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}.
Engine: ${vehicle.engine.displacement} ${vehicle.engine.type} (${vehicle.engine.code}), ${vehicle.engine.transmission}
Oil: ${vehicle.oil.viscosity} ${vehicle.oil.type}, ${vehicle.oil.api_rating ?? "N/A"} / ${vehicle.oil.ilsac_rating ?? "N/A"}
Capacity: ${vehicle.oil.capacity_qt} qt, Change every ${vehicle.oil.change_interval_miles.toLocaleString()} miles
Filter: ${vehicle.oil.filter_part}
${vehicle.oem_approval ? `OEM Approval: ${vehicle.oem_approval}` : ""}
${vehicle.alternative_viscosity ? `Alt viscosity: ${vehicle.alternative_viscosity}` : ""}
${vehicle.notes ? `Notes: ${vehicle.notes}` : ""}
Source: ${vehicle.source}

Answer the user's question based on this vehicle data.`;
}
