import { NextRequest } from "next/server";
import { searchVehicles } from "@/lib/vehicles";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return Response.json({ error: "Missing query parameter" }, { status: 400 });
  }

  if (q.length > 200) {
    return Response.json({ error: "Query too long" }, { status: 400 });
  }

  const results = searchVehicles(q);

  return Response.json({ results, query: q });
}
