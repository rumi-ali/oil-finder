import type { OilSpec } from "@/lib/vehicles";

export function OilCard({ oil, oemApproval }: { oil: OilSpec; oemApproval: string | null }) {
  return (
    <div className="border border-card-border rounded-2xl p-6 bg-card">
      <div className="text-xs uppercase tracking-widest text-accent mb-2">
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
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-card-border">
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
      </div>
    </div>
  );
}
