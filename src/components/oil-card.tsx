import Image from "next/image";
import type { OilSpec } from "@/lib/vehicles";

interface OilCardProps {
  oil: OilSpec;
  oemApproval: string | null;
  alternativeViscosity?: string | null;
  aiGenerated?: boolean;
}

export function OilCard({ oil, oemApproval, alternativeViscosity, aiGenerated }: OilCardProps) {
  return (
    <div className={`rounded-2xl p-6 bg-card ${aiGenerated ? "border border-dashed border-amber-500/40" : "border border-card-border"}`}>
      <div className="flex gap-5">
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className={`text-xs uppercase tracking-widest mb-2 ${aiGenerated ? "text-amber-400" : "text-accent"}`}>
            Recommended Engine Oil
          </div>
          <div className="text-3xl font-light text-white mb-0.5">
            {oil.viscosity}
          </div>
          <div className="text-base text-muted mb-4">
            {oil.type}
            {oil.api_rating || oil.ilsac_rating
              ? ` · ${[oil.api_rating, oil.ilsac_rating].filter(Boolean).join(" / ")}`
              : ""}
            {oemApproval ? ` · ${oemApproval}` : ""}
          </div>
        </div>

        {/* Product image */}
        <div className="shrink-0 flex items-center">
          <Image
            src={`/oils/${oil.viscosity.toLowerCase().replace(/\s+/g, "-")}.svg`}
            alt={`${oil.viscosity} ${oil.type}`}
            width={80}
            height={120}
            className="object-contain drop-shadow-[0_0_8px_rgba(201,168,76,0.15)]"
            unoptimized
          />
        </div>
      </div>

      <div className={`grid gap-4 pt-4 border-t border-card-border ${alternativeViscosity ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        <div>
          <div className="text-[0.7rem] uppercase tracking-wide text-muted/70 mb-0.5">
            Capacity
          </div>
          <div className="text-sm text-foreground">{oil.capacity_qt} qt</div>
        </div>
        <div>
          <div className="text-[0.7rem] uppercase tracking-wide text-muted/70 mb-0.5">
            Interval
          </div>
          <div className="text-sm text-foreground">
            {oil.change_interval_miles.toLocaleString()} mi
          </div>
        </div>
        <div>
          <div className="text-[0.7rem] uppercase tracking-wide text-muted/70 mb-0.5">
            Filter
          </div>
          <div className="text-sm text-foreground font-mono text-xs">
            {oil.filter_part}
          </div>
        </div>
        {alternativeViscosity && (
          <div>
            <div className="text-[0.7rem] uppercase tracking-wide text-muted/70 mb-0.5">
              Alt. Viscosity
            </div>
            <div className="text-sm text-foreground">{alternativeViscosity}</div>
          </div>
        )}
      </div>

      {aiGenerated && (
        <div className="mt-3 pt-3 border-t border-amber-500/20 text-xs text-amber-400/70">
          AI-generated — verify with your owner&apos;s manual
        </div>
      )}
    </div>
  );
}
