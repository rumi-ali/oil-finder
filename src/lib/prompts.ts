import type { Vehicle } from "./vehicles";

export const OIL_ADVISOR_SYSTEM = `You are an expert automotive technician with 20 years of experience. You explain oil recommendations in a way that's knowledgeable but accessible — like a trusted mechanic explaining to a car owner who wants to understand WHY, not just WHAT.

Rules:
- ONLY use the vehicle and oil specification data provided in the user message. Never add information not present in the data.
- Explain WHY this specific oil is right for this specific engine — connect the engine characteristics to the oil properties.
- If the engine is turbocharged, explain why that matters for oil choice.
- If there's an OEM approval requirement, explain why standard API/ILSAC ratings aren't sufficient.
- If there are notes about climate or alternative viscosities, mention them.
- Keep it conversational. 3-4 paragraphs max.
- No bullet points or headers. Write in flowing prose.
- Never recommend specific purchase locations or prices.`;

export function buildExplanationPrompt(vehicle: Vehicle): string {
  if (!vehicle.oil) {
    return `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}
Type: Electric Vehicle
Notes: ${vehicle.notes ?? "N/A"}

Explain briefly that electric vehicles don't use engine oil, and mention what maintenance they do need.`;
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

Explain why this oil specification is right for this engine. Be specific about the connection between the engine characteristics and the oil properties.`;
}
