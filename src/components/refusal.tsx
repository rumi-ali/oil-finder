import Link from "next/link";

export function Refusal({
  query,
  isEV = false,
  evNotes,
}: {
  query: string;
  isEV?: boolean;
  evNotes?: string | null;
}) {
  const popularCars = [
    "Honda Civic 2022",
    "Toyota Camry 2023",
    "Ford F-150 2023",
    "BMW 330i 2022",
    "Honda CR-V 2023",
  ];

  if (isEV) {
    return (
      <div className="border border-card-border rounded-2xl p-8 text-center bg-[#111]">
        <div className="text-3xl mb-3 text-muted">&#x26A1;</div>
        <div className="text-lg text-foreground mb-2">
          Electric vehicles don&apos;t use engine oil
        </div>
        <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
          {evNotes ??
            "This tool covers engine oil recommendations. EVs have different maintenance needs."}
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-5 py-2 border border-accent text-accent rounded-full text-sm hover:bg-accent-dim transition-colors"
        >
          Search another vehicle
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-card-border rounded-2xl p-8 text-center bg-[#111]">
      <div className="text-3xl mb-3 text-muted">&#x26A0;</div>
      <div className="text-lg text-foreground mb-2">
        Not in our verified database yet
      </div>
      <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
        We only show oil recommendations backed by manufacturer documentation
        we&apos;ve verified. Check your owner&apos;s manual or try one of
        these vehicles:
      </p>
      <div className="mt-4 flex gap-2 flex-wrap justify-center">
        {popularCars.map((car) => (
          <Link
            key={car}
            href={`/search?q=${encodeURIComponent(car)}`}
            className="px-3 py-1.5 text-sm border border-card-border rounded-full text-muted hover:border-accent hover:text-accent transition-colors"
          >
            {car}
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <a
          href={`mailto:request@oilfinder.dev?subject=Vehicle Request: ${encodeURIComponent(query)}`}
          className="text-sm text-accent hover:underline"
        >
          Request this vehicle
        </a>
      </div>
    </div>
  );
}
