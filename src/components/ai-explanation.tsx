"use client";

import { useState, useEffect, useCallback } from "react";

export function AIExplanation({ vehicleId }: { vehicleId: string }) {
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const fetchExplanation = useCallback(async () => {
    setStreaming(true);
    setText("");
    setDone(false);
    setError(false);

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });

      if (!res.ok || !res.body) {
        setError(true);
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done: readerDone, value } = await reader.read();
        if (readerDone) break;
        const chunk = decoder.decode(value, { stream: true });
        setText((prev) => prev + chunk);
      }

      setDone(true);
      setStreaming(false);
    } catch {
      setError(true);
      setStreaming(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchExplanation();
  }, [fetchExplanation]);

  if (error) {
    return (
      <div className="border border-card-border rounded-2xl p-6 bg-[#111] text-muted text-sm">
        AI explanation unavailable. See the verified specs below.
      </div>
    );
  }

  return (
    <div className="border border-card-border rounded-2xl p-6 bg-[#111]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-amber-700 flex items-center justify-center text-[0.6rem] text-black font-bold">
          AI
        </div>
        <span className="text-sm text-muted">Why this oil?</span>
      </div>
      <div className="text-[0.95rem] leading-relaxed text-foreground/80">
        {text ? (
          <>
            {text.split("\n\n").map((p, i) => (
              <p key={i} className={i > 0 ? "mt-3" : ""}>
                {p}
              </p>
            ))}
            {streaming && (
              <span className="inline-block w-0.5 h-[1em] bg-accent ml-0.5 align-text-bottom cursor-blink" />
            )}
          </>
        ) : streaming ? (
          <div className="space-y-2">
            <div className="h-4 bg-card-border/30 rounded w-full skeleton-pulse" />
            <div className="h-4 bg-card-border/30 rounded w-5/6 skeleton-pulse" />
            <div className="h-4 bg-card-border/30 rounded w-4/6 skeleton-pulse" />
          </div>
        ) : null}
      </div>
      {done && (
        <div
          className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 border border-card-border rounded-md text-[0.7rem] text-muted"
          role="status"
          aria-live="polite"
        >
          <span className="w-1 h-1 rounded-full bg-success" />
          Grounded in verified manufacturer data
        </div>
      )}
    </div>
  );
}
