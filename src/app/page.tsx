import { SearchBar, ExampleChips } from "@/components/search-bar";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl font-light tracking-tight text-white mb-1">
        Oil<span className="text-accent font-medium">Finder</span>
      </h1>
      <p className="text-sm text-muted tracking-wide mb-8">
        AI-powered oil recommendations you can trust
      </p>

      <SearchBar />
      <ExampleChips />

      <footer className="mt-12 text-xs text-muted/60 text-center max-w-sm leading-relaxed">
        Recommendations grounded in manufacturer specs from owner&apos;s manuals.
        Always verify with your vehicle&apos;s manual before purchasing.
      </footer>
    </main>
  );
}
