import { NextRequest } from "next/server";
import { getVehicleById } from "@/lib/vehicles";

export async function GET(request: NextRequest) {
  const vehicleId = request.nextUrl.searchParams.get("id");

  if (!vehicleId || !/^[a-z0-9-]+$/.test(vehicleId) || vehicleId.length > 100) {
    return Response.json({ error: "Invalid vehicle ID" }, { status: 400 });
  }

  const vehicle = getVehicleById(vehicleId);

  if (!vehicle) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  return Response.json({ vehicle });
}
