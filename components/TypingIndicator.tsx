"use client";

import { useState, useEffect } from "react";

const CAPTIONS = [
  "Researching current trends…",
  "Mapping your industry landscape…",
  "Analyzing how AI is reshaping your role…",
  "Building your skill path…",
  "Crafting your Dorothy move…",
];

export default function TypingIndicator() {
  const [captionIndex, setCaptionIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCaptionIndex((i) => (i + 1) % CAPTIONS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start animate-in">
      <div
        className="rounded-2xl rounded-bl-sm px-4 py-3"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Animated dots */}
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="dot-bounce inline-block w-1.5 h-1.5 rounded-full"
                style={{
                  background: "var(--accent)",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          {/* Rotating caption */}
          <span
            className="text-xs"
            style={{ color: "var(--muted)" }}
          >
            {CAPTIONS[captionIndex]}
          </span>
        </div>
      </div>
    </div>
  );
}
