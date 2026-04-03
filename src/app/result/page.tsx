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
  const aiQuery = searchParams.get("aiQuery") ?? "";
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (aiQuery) {
      // AI-generated path
      fetch("/api/ai-spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiQuery }),
      })
        .then((res) => {
          if (!res.ok) return res.json().then((d) => { throw new Error(d.error || "AI failed"); });
          return res.json();
        })
        .then((data) => {
          setVehicle(data.vehicle);
          setAiGenerated(true);
          setLoading(false);
        })
        .catch((err) => {
          setAiError(err.message || "AI recommendation failed");
          setLoading(false);
        });
      return;
    }

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
  }, [vehicleId, aiQuery]);

  if (loading) {
    return aiQuery ? (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <span className="text-sm text-muted">Generating oil specification...</span>
        </div>
        <div className="h-8 bg-card-border/20 rounded w-2/3 skeleton-pulse" />
        <div className="h-5 bg-card-border/20 rounded w-1/3 skeleton-pulse" />
        <div className="h-48 bg-amber-500/5 border border-dashed border-amber-500/20 rounded-2xl skeleton-pulse mt-6" />
      </div>
    ) : (
      <div className="space-y-4">
        <div className="h-8 bg-card-border/20 rounded w-2/3 skeleton-pulse" />
        <div className="h-5 bg-card-border/20 rounded w-1/3 skeleton-pulse" />
        <div className="h-48 bg-card-border/20 rounded-2xl skeleton-pulse mt-6" />
        <div className="h-36 bg-card-border/20 rounded-2xl skeleton-pulse" />
      </div>
    );
  }

  if (aiError) {
    return (
      <div className="text-center py-12">
        <div className="text-2xl mb-3">&#9888;</div>
        <h3 className="text-lg text-white mb-2">AI recommendation failed</h3>
        <p className="text-sm text-muted mb-4">
          {aiError}. This can happen with unusual vehicles.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm bg-amber-600/90 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            Try again
          </button>
          <Link href="/" className="px-4 py-2 text-sm border border-card-border text-muted rounded-lg hover:text-accent transition-colors">
            Search verified database
          </Link>
        </div>
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
        <Refusal query={vehicleId || aiQuery} isEV evNotes={vehicle.notes} />
      </>
    );
  }

  return (
    <>
      {/* AI disclaimer banner */}
      {aiGenerated && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5 mb-5 text-sm text-amber-200/80">
          These specs are AI-generated and may contain errors. Always verify with your owner&apos;s manual.
        </div>
      )}

      <VehicleHeader vehicle={vehicle} />

      {/* Confidence badge */}
      {aiGenerated ? (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          AI-Generated &middot; {vehicle.source}
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-success-dim text-success border border-success/20 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Verified &middot; {vehicle.source}
        </div>
      )}

      {/* Oil spec card */}
      {vehicle.oil && (
        <div className="mb-5">
          <OilCard
            oil={vehicle.oil}
            oemApproval={vehicle.oem_approval}
            alternativeViscosity={vehicle.alternative_viscosity}
            aiGenerated={aiGenerated}
          />
        </div>
      )}

      {/* Compatible products */}
      {vehicle.compatible_products.length > 0 && (
        <div className="mb-5">
          <div className="text-xs uppercase tracking-widest text-muted/70 mb-3">
            Commonly Available Products
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {vehicle.compatible_products.map((p) => (
              <div
                key={p.name}
                className="p-3.5 border border-card-border/60 rounded-xl bg-[#0f0f0f] flex flex-col items-center text-center"
              >
                <OilBottle brandName={p.name} />
                <div className="text-sm text-foreground/90 mt-2">{p.name}</div>
                <div className="text-[0.7rem] uppercase tracking-wide text-muted/60 mt-0.5">
                  {p.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI explanation */}
      <div className="mb-5">
        <AIExplanation
          vehicleId={aiGenerated ? undefined : vehicle.vehicle_id}
          vehicle={aiGenerated ? vehicle : undefined}
          aiGenerated={aiGenerated}
        />
      </div>

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

const BRAND_COLORS: Record<string, { primary: string; secondary: string }> = {
  pennzoil: { primary: "#FDD700", secondary: "#1a1a00" },
  "mobil 1": { primary: "#FF1A1A", secondary: "#1a0000" },
  mobil: { primary: "#FF1A1A", secondary: "#1a0000" },
  castrol: { primary: "#00923F", secondary: "#001a0d" },
  valvoline: { primary: "#0055BF", secondary: "#000d1a" },
  shell: { primary: "#FFD500", secondary: "#1a1a00" },
  "liqui moly": { primary: "#D50032", secondary: "#1a0008" },
  amsoil: { primary: "#F26522", secondary: "#1a0b00" },
  royal: { primary: "#6B2FA0", secondary: "#0d0019" },
};

function getBrandColor(name: string) {
  const lower = name.toLowerCase();
  for (const [brand, colors] of Object.entries(BRAND_COLORS)) {
    if (lower.includes(brand)) return colors;
  }
  return { primary: "#c9a84c", secondary: "#1a1508" };
}

function OilBottle({ brandName }: { brandName: string }) {
  const { primary } = getBrandColor(brandName);
  return (
    <svg width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cap */}
      <rect x="14" y="0" width="12" height="6" rx="1.5" fill="#333" />
      {/* Neck */}
      <path d="M16 6 L16 12 L10 18 L10 52 C10 54 12 56 14 56 L26 56 C28 56 30 54 30 52 L30 18 L24 12 L24 6 Z" fill="#1a1a1a" stroke="#333" strokeWidth="0.5" />
      {/* Label area */}
      <rect x="12" y="22" width="16" height="20" rx="1" fill={primary} opacity="0.85" />
      {/* Label shine */}
      <rect x="12" y="22" width="8" height="20" rx="1" fill="white" opacity="0.08" />
      {/* Viscosity text hint */}
      <rect x="14" y="28" width="12" height="2" rx="0.5" fill="black" opacity="0.3" />
      <rect x="15" y="32" width="10" height="1.5" rx="0.5" fill="black" opacity="0.2" />
    </svg>
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
