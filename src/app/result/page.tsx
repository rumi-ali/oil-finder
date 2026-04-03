"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import type { Vehicle } from "@/lib/vehicles";
import { OilCard } from "@/components/oil-card";
import { AIExplanation } from "@/components/ai-explanation";
import { Refusal } from "@/components/refusal";

function ResultContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "";
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!vehicleId) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    fetch(`/api/spec?id=${encodeURIComponent(vehicleId)}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        if (!res.ok) throw new Error("Failed to load spec");
        return res.json();
      })
      .then((data) => {
        if (data) {
          setVehicle(data.vehicle);
          setLoading(false);
        }
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-card-border/20 rounded w-2/3 skeleton-pulse" />
        <div className="h-5 bg-card-border/20 rounded w-1/3 skeleton-pulse" />
        <div className="h-48 bg-card-border/20 rounded-2xl skeleton-pulse mt-6" />
        <div className="h-36 bg-card-border/20 rounded-2xl skeleton-pulse" />
      </div>
    );
  }

  if (notFound || !vehicle) {
    return <Refusal query={vehicleId} />;
  }

  if (vehicle.type === "ev") {
    return (
      <>
        <VehicleHeader vehicle={vehicle} />
        <Refusal query={vehicleId} isEV evNotes={vehicle.notes} />
      </>
    );
  }

  return (
    <>
      <VehicleHeader vehicle={vehicle} />

      {/* Confidence badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-success-dim text-success border border-success/20 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        Verified &middot; {vehicle.source}
      </div>

      {/* AI explanation streams FIRST (the star feature) */}
      <div className="mb-5">
        <AIExplanation vehicleId={vehicle.vehicle_id} />
      </div>

      {/* Oil spec card below */}
      {vehicle.oil && (
        <div className="mb-5">
          <OilCard oil={vehicle.oil} oemApproval={vehicle.oem_approval} />
        </div>
      )}

      {/* Alternative viscosity note */}
      {vehicle.alternative_viscosity && (
        <p className="text-sm text-muted mb-5">
          Alternative: {vehicle.alternative_viscosity} may be used in warmer
          climates. Check your owner&apos;s manual for climate-specific guidance.
        </p>
      )}

      {/* Compatible products */}
      {vehicle.compatible_products.length > 0 && (
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-muted/70 mb-3">
            Commonly Available Products
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {vehicle.compatible_products.map((p) => (
              <div
                key={p.name}
                className="flex-1 p-3.5 border border-card-border/60 rounded-xl bg-[#0f0f0f]"
              >
                <div className="text-sm text-foreground/90">{p.name}</div>
                <div className="text-[0.7rem] uppercase tracking-wide text-muted/60 mt-0.5">
                  {p.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search another */}
      <div className="text-center pt-4">
        <Link
          href="/"
          className="inline-block px-5 py-2 border border-accent text-accent rounded-full text-sm hover:bg-accent-dim transition-colors"
        >
          Search another vehicle
        </Link>
      </div>
    </>
  );
}

function VehicleHeader({ vehicle }: { vehicle: Vehicle }) {
  return (
    <>
      <div className="flex items-baseline gap-2.5 mb-1">
        <h2 className="text-xl font-normal text-white">
          {vehicle.make} {vehicle.model}
        </h2>
        <span className="text-xs px-2 py-0.5 border border-accent rounded-lg text-accent">
          {vehicle.trim}
        </span>
      </div>
      <p className="text-sm text-muted mb-4">
        {vehicle.year} &middot; {vehicle.engine.displacement}{" "}
        {vehicle.engine.type} &middot; {vehicle.engine.transmission}
      </p>
    </>
  );
}

export default function ResultPage() {
  return (
    <main className="min-h-screen px-6 py-8 max-w-[700px] mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted hover:text-accent">
          &larr; Back to search
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-8 bg-card-border/20 rounded w-2/3 skeleton-pulse" />
            <div className="h-48 bg-card-border/20 rounded-2xl skeleton-pulse mt-6" />
          </div>
        }
      >
        <ResultContent />
      </Suspense>
    </main>
  );
}
