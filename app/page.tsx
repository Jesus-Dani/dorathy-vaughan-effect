"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import ReportView from "@/components/ReportView";
import type { Report } from "@/types/report";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

const INTRO =
  `In 1958, Dorothy Vaughan watched IBM mainframes arrive at NASA. While her colleagues waited to see what would happen, she taught herself FORTRAN — and became the person who ran the machines.\n\nAI is the new mainframe. Every field, every role. The question isn't whether things are changing. It's whether you'll be the one running the machine.\n\nThis tool gives you a personalized briefing on where your industry is heading and the exact skills to get there. Ten minutes, one report, one clear move.\n\nType **start** to begin.`;

const QUESTIONS = [
  "What field or industry are you in?",
  "What's your current role?",
  "How many years of experience do you have? *(You can skip this — just press Enter.)*",
  "What are your top skills right now? *(Or skip — we can work from your role.)*",
  "What part of your work do you enjoy most? *(Skip if you'd prefer — this helps personalize your Dorothy move.)*",
];

type AnswerKey = "field" | "role" | "experience" | "skills" | "enjoys";
const ANSWER_KEYS: AnswerKey[] = ["field", "role", "experience", "skills", "enjoys"];

function getPlaceholder(step: number): string {
  if (step === 0) return "Type start to begin…";
  if (step === 1) return "e.g. Healthcare, Software, Finance…";
  if (step === 2) return "e.g. Product Manager, Nurse, Data Analyst…";
  if (step === 3) return "e.g. 5 years  (or press Enter to skip)";
  if (step === 4) return "e.g. Python, project management… (or skip)";
  if (step === 5) return "e.g. working with clients, solving technical puzzles… (or skip)";
  return "";
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "intro", role: "assistant", content: INTRO },
  ]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<AnswerKey, string>>({
    field: "",
    role: "",
    experience: "",
    skills: "",
    enjoys: "",
  });
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing, report, errorMsg]);

  useEffect(() => {
    if (!isAnalyzing) inputRef.current?.focus();
  }, [step, isAnalyzing]);

  function addMsg(role: "assistant" | "user", content: string) {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
  }

  async function handleSubmit() {
    const value = inputValue.trim();

    // Step 0: waiting for "start"
    if (step === 0) {
      if (!value) return;
      addMsg("user", value);
      setInputValue("");
      if (value.toLowerCase() !== "start") {
        setTimeout(() => addMsg("assistant", "Type **start** when you're ready to begin."), 350);
        return;
      }
      setTimeout(() => {
        addMsg("assistant", QUESTIONS[0]);
        setStep(1);
      }, 350);
      return;
    }

    // Steps 1–5: questions (1 & 2 required, 3–5 optional)
    if (step >= 1 && step <= 5) {
      const isRequired = step <= 2;
      if (!value && isRequired) {
        inputRef.current?.focus();
        return;
      }

      const key = ANSWER_KEYS[step - 1];
      const stored = value || "";

      addMsg("user", value || "—");
      setInputValue("");

      const updatedAnswers = { ...answers, [key]: stored };
      setAnswers(updatedAnswers);

      if (step < 5) {
        setTimeout(() => {
          addMsg("assistant", QUESTIONS[step]);
          setStep(step + 1);
        }, 400);
      } else {
        // All 5 questions answered — start analysis
        setStep(6);
        setIsAnalyzing(true);
        setErrorMsg(null);

        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedAnswers),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: "Analysis failed." }));
            throw new Error(err.message || "Analysis failed.");
          }

          const data: Report = await res.json();
          setReport(data);
          setStep(7);
        } catch (err) {
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "Something went wrong. Please refresh and try again."
          );
          setStep(5);
        } finally {
          setIsAnalyzing(false);
        }
      }
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isInputDisabled = isAnalyzing || step === 6 || step === 7;
  const isRequired = step === 1 || step === 2;

  return (
    <div className="flex flex-col min-h-[100dvh]" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header
        className="shrink-0 flex items-center justify-center px-4 py-4 border-b"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="w-full max-w-[680px] flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "var(--accent)", color: "#FFF" }}
          >
            DV
          </div>
          <div>
            <h1
              className="text-sm font-semibold leading-tight"
              style={{ color: "var(--text)" }}
            >
              The Dorothy Vaughan Effect
            </h1>
            <p className="text-xs" style={{ color: "var(--subtle)" }}>
              Get ahead of the wave
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="w-full max-w-[680px] mx-auto px-4 py-6 space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              animate={i > 0}
            />
          ))}

          {isAnalyzing && <TypingIndicator />}

          {errorMsg && (
            <div
              className="animate-in rounded-xl px-4 py-3 text-sm"
              style={{
                background: "#FFF5F5",
                border: "1px solid #FECACA",
                color: "#B91C1C",
              }}
            >
              {errorMsg} — please refresh and try again.
            </div>
          )}

          {report && (
            <div className="animate-in">
              <ReportView
                report={report}
                field={answers.field}
                role={answers.role}
              />
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input bar */}
      {!isInputDisabled && (
        <footer
          className="shrink-0 border-t px-4 py-3"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          }}
        >
          <div className="w-full max-w-[680px] mx-auto flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={getPlaceholder(step)}
              disabled={isInputDisabled}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm leading-relaxed outline-none transition-colors"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text)",
                minHeight: "46px",
                maxHeight: "120px",
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isInputDisabled || (!inputValue.trim() && isRequired)}
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-30"
              style={{ background: "var(--accent)" }}
              aria-label="Send"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 8h12M9 3l5 5-5 5" />
              </svg>
            </button>
          </div>
          {step >= 3 && step <= 5 && (
            <p
              className="text-center text-xs mt-2"
              style={{ color: "var(--subtle)" }}
            >
              Press Enter to skip
            </p>
          )}
        </footer>
      )}
    </div>
  );
}
