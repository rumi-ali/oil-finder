"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/search-bar";
import Link from "next/link";

interface TrimResult {
  vehicle_id: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  engine: {
    displacement: string;
    type: string;
    transmission: string;
  };
  type: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<TrimResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      router.replace("/");
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/vehicles?q=${encodeURIComponent(q)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Search failed");
        return res.json();
      })
      .then((data) => {
        setResults(data.results);
        setLoading(false);
      })
      .catch(() => {
        setError("Vehicle lookup service temporarily unavailable. Try again in a moment.");
        setLoading(false);
      });
  }, [q, router]);

  if (loading) {
    return (
      <div className="space-y-3 w-full">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-card-border/20 rounded-xl skeleton-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted text-sm">{error}</p>
        <Link
          href="/"
          className="inline-block mt-4 text-accent text-sm hover:underline"
        >
          Back to search
        </Link>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted text-sm">
          No vehicles found for &ldquo;{q}&rdquo;. Try &ldquo;Honda Civic
          2022&rdquo; or check spelling.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 text-accent text-sm hover:underline"
        >
          Back to search
        </Link>
      </div>
    );
  }

  const make = results[0].make;
  const model = results[0].model;

  return (
    <>
      <h1 className="text-2xl font-light text-white mb-0.5">
        <strong className="font-semibold">{make}</strong> {model}
      </h1>
      <p className="text-sm text-muted mb-6">
        {results[0].year} &middot; {results.length} trim
        {results.length !== 1 ? "s" : ""} found
      </p>
      <ul className="space-y-2 w-full">
        {results.map((r) => (
          <li key={r.vehicle_id}>
            <Link
              href={`/result?vehicle=${r.vehicle_id}`}
              className="flex justify-between items-center p-4 border border-card-border rounded-xl transition-colors hover:border-accent hover:bg-accent-dim group"
            >
              <div>
                <div className="text-foreground group-hover:text-white">
                  {r.make} {r.model} {r.trim}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {r.engine.displacement} {r.engine.type} &middot;{" "}
                  {r.engine.transmission}
                </div>
              </div>
              <span className="text-muted group-hover:text-accent text-lg">
                &rsaquo;
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen px-6 py-8 max-w-[700px] mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted hover:text-accent">
          &larr; Back to search
        </Link>
      </div>
      <div className="mb-8">
        <Suspense>
          <SearchBar
            defaultValue={
              typeof window !== "undefined"
                ? new URLSearchParams(window.location.search).get("q") ?? ""
                : ""
            }
          />
        </Suspense>
      </div>
      <Suspense
        fallback={
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-card-border/20 rounded-xl skeleton-pulse"
              />
            ))}
          </div>
        }
      >
        <SearchResults />
      </Suspense>
    </main>
  );
}
