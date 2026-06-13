"use client";

import { useEffect, useRef } from "react";

interface ChatMessageProps {
  role: "assistant" | "user";
  content: string;
  animate?: boolean;
}

// Very light markdown: **bold**, *italic em*
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function renderContent(content: string) {
  const paragraphs = content.split(/\n\n+/);
  return paragraphs.map((para, i) => {
    const lines = para.split(/\n/);
    return (
      <p key={i} className={i > 0 ? "mt-3" : ""}>
        {lines.map((line, j) => (
          <span key={j}>
            {j > 0 && <br />}
            {renderInline(line)}
          </span>
        ))}
      </p>
    );
  });
}

export default function ChatMessage({
  role,
  content,
  animate = true,
}: ChatMessageProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animate && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [animate]);

  if (role === "user") {
    return (
      <div
        ref={ref}
        className={`flex justify-end ${animate ? "animate-in" : ""}`}
      >
        <div
          className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed"
          style={{
            background: "var(--user-bg)",
            color: "var(--user-text)",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`flex justify-start ${animate ? "animate-in" : ""}`}
    >
      <div className="max-w-[85%]">
        <div
          className="rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed prose-chat"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        >
          {renderContent(content)}
        </div>
      </div>
    </div>
  );
}
