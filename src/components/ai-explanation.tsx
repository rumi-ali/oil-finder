"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export function AIExplanation({ vehicleId }: { vehicleId: string }) {
  const [explanation, setExplanation] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const fetchExplanation = useCallback(async () => {
    setStreaming(true);
    setExplanation("");
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
        setExplanation((prev) => prev + chunk);
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

  // Parse the streamed text into bullets and follow-up questions
  const { bullets, questions } = parseExplanation(explanation);

  if (error) {
    return (
      <div className="border border-card-border rounded-2xl p-6 bg-[#111] text-muted text-sm">
        AI explanation unavailable. See the verified specs below.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI Explanation — bullet format */}
      <div className="border border-card-border rounded-2xl p-6 bg-[#111]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-amber-700 flex items-center justify-center text-[0.6rem] text-black font-bold">
            AI
          </div>
          <span className="text-sm text-muted">Why this oil?</span>
        </div>

        {bullets.length > 0 ? (
          <ul className="space-y-2.5">
            {bullets.map((bullet, i) => (
              <li key={i} className="flex gap-2.5 text-[0.92rem] leading-relaxed text-foreground/80">
                <span className="text-accent mt-1 shrink-0">&#x2022;</span>
                <span>{bullet}</span>
              </li>
            ))}
            {streaming && (
              <li className="flex gap-2.5">
                <span className="text-accent mt-1 shrink-0">&#x2022;</span>
                <span className="inline-block w-0.5 h-[1em] bg-accent cursor-blink" />
              </li>
            )}
          </ul>
        ) : streaming ? (
          <div className="space-y-2">
            <div className="h-4 bg-card-border/30 rounded w-full skeleton-pulse" />
            <div className="h-4 bg-card-border/30 rounded w-5/6 skeleton-pulse" />
            <div className="h-4 bg-card-border/30 rounded w-4/6 skeleton-pulse" />
          </div>
        ) : null}

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

      {/* Follow-up questions + Chat */}
      {done && (
        <FollowUpChat
          vehicleId={vehicleId}
          suggestedQuestions={questions}
        />
      )}
    </div>
  );
}

function FollowUpChat({
  vehicleId,
  suggestedQuestions,
}: {
  vehicleId: string;
  suggestedQuestions: string[];
}) {
  const [chatInput, setChatInput] = useState("");
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { vehicleId } }),
    [vehicleId]
  );
  const { messages, status, sendMessage } = useChat({ transport });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isStreaming = status === "streaming" || status === "submitted";

  function askQuestion(question: string) {
    sendMessage({ text: question });
  }

  return (
    <div className="border border-card-border rounded-2xl p-6 bg-[#111]">
      <div className="text-xs uppercase tracking-widest text-muted/70 mb-3">
        Ask a follow-up
      </div>

      {/* Suggested questions (shown when no messages yet) */}
      {messages.length === 0 && suggestedQuestions.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {suggestedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => askQuestion(q)}
              className="text-left px-3.5 py-2.5 text-sm border border-card-border rounded-xl text-foreground/70 hover:border-accent hover:text-accent transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {messages.map((msg) => {
            const text = msg.parts
              ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
              .map((p) => p.text)
              .join("") ?? "";
            return (
              <div
                key={msg.id}
                className={`text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-accent font-medium"
                    : "text-foreground/80"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="flex gap-2">
                    <span className="text-muted shrink-0">You:</span>
                    <span>{text}</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <span className="text-accent shrink-0">AI:</span>
                    <span>{text}</span>
                  </div>
                )}
              </div>
            );
          })}
          {isStreaming && (
            <span className="inline-block w-0.5 h-[1em] bg-accent ml-8 cursor-blink" />
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Chat input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (chatInput.trim() && !isStreaming) {
            sendMessage({ text: chatInput.trim() });
            setChatInput("");
          }
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask about oil, maintenance, driving conditions..."
          disabled={isStreaming}
          className="flex-1 px-3.5 py-2.5 text-sm border border-card-border rounded-xl bg-background text-foreground outline-none transition-all focus:border-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !chatInput.trim()}
          className="px-4 py-2.5 text-sm bg-accent text-black rounded-xl font-medium hover:bg-accent/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

function parseExplanation(text: string): {
  bullets: string[];
  questions: string[];
} {
  const bullets: string[] = [];
  const questions: string[] = [];

  // Split into key points and questions sections
  const questionsIdx = text.indexOf("## Suggested Questions");
  const bulletSection = questionsIdx >= 0 ? text.slice(0, questionsIdx) : text;
  const questionSection = questionsIdx >= 0 ? text.slice(questionsIdx) : "";

  // Parse bullets from key points section
  const bulletLines = bulletSection.split("\n");
  for (const line of bulletLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") && !trimmed.startsWith("- [")) {
      bullets.push(trimmed.slice(2));
    }
  }

  // Parse questions
  const questionLines = questionSection.split("\n");
  for (const line of questionLines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^\d+\.\s+(.+)/);
    if (match) {
      questions.push(match[1]);
    }
  }

  return { bullets, questions };
}
