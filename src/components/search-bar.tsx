"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[580px] relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg select-none">
        &#x1F50D;
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Honda Civic 2022"
        className="w-full py-3.5 pl-12 pr-5 text-lg border border-card-border rounded-full bg-card text-foreground outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-dim)]"
        autoFocus
      />
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}

export function ExampleChips() {
  const router = useRouter();
  const examples = [
    "Toyota Camry 2023",
    "Ford F-150 2023",
    "Tesla Model 3 2023",
    "BMW 330i 2022",
    "Honda CR-V 2023",
  ];

  return (
    <div className="mt-4 flex gap-2 flex-wrap justify-center">
      {examples.map((ex) => (
        <button
          key={ex}
          onClick={() =>
            router.push(`/search?q=${encodeURIComponent(ex)}`)
          }
          className="px-3.5 py-1.5 text-sm border border-card-border rounded-full text-muted cursor-pointer transition-colors hover:border-accent hover:text-accent focus:outline-none focus:border-accent focus:text-accent"
        >
          {ex}
        </button>
      ))}
    </div>
  );
}
