"use client";

import { useRef } from "react";
import type { Report } from "@/types/report";

interface ReportViewProps {
  report: Report;
  field: string;
  role: string;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-widest mb-3"
      style={{ color: "var(--accent)" }}
    >
      {children}
    </p>
  );
}

function SourceLink({ url, label }: { url: string; label?: string }) {
  if (!url || url === "") return null;
  const display = label || new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", "");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs underline underline-offset-2 hover:opacity-80 transition-opacity"
      style={{ color: "var(--subtle)" }}
    >
      {display}
    </a>
  );
}

function Card({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`report-section rounded-xl p-5 ${className}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function ReportView({ report, field, role }: ReportViewProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!reportRef.current) return;
    try {
      const { default: html2pdf } = await import("html2pdf.js");
      const filename = `dorothy-move_${role.replace(/\s+/g, "-").toLowerCase()}_${field.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      html2pdf()
        .set({
          margin: [0.6, 0.6],
          filename,
          image: { type: "jpeg", quality: 0.97 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .from(reportRef.current)
        .save();
    } catch {
      window.print();
    }
  };

  const baseDelay = 100;
  const step = 150;

  return (
    <div className="space-y-4">
      {/* Header label */}
      <div
        className="report-section text-xs font-semibold uppercase tracking-widest"
        style={{ color: "var(--subtle)", animationDelay: "0ms" }}
      >
        Your briefing
      </div>

      <div ref={reportRef} className="space-y-4" id="report-content">
        {/* 1. State of your field */}
        <Card delay={baseDelay}>
          <SectionLabel>State of your field</SectionLabel>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
            {report.summary}
          </p>
        </Card>

        {/* 2. Current trends */}
        <Card delay={baseDelay + step}>
          <SectionLabel>Current trends</SectionLabel>
          <div className="space-y-4">
            {report.currentTrends.map((trend, i) => (
              <div key={i} className={i > 0 ? "pt-4 border-t" : ""} style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>
                  {trend.title}
                </p>
                <p className="text-sm leading-relaxed mb-1.5" style={{ color: "var(--muted)" }}>
                  {trend.description}
                </p>
                {trend.source && (
                  <SourceLink url={trend.source} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* 3. Emerging trends */}
        <Card delay={baseDelay + step * 2}>
          <SectionLabel>Emerging trends · next 12–24 months</SectionLabel>
          <div className="space-y-4">
            {report.emergingTrends.map((trend, i) => (
              <div key={i} className={i > 0 ? "pt-4 border-t" : ""} style={{ borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {trend.title}
                  </p>
                  <span
                    className="text-xs shrink-0 px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--accent-bg)",
                      color: "var(--accent)",
                      border: "1px solid var(--accent-border)",
                    }}
                  >
                    {trend.horizon}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-1.5" style={{ color: "var(--muted)" }}>
                  {trend.description}
                </p>
                {trend.source && <SourceLink url={trend.source} />}
              </div>
            ))}
          </div>
        </Card>

        {/* 4. AI impact on your role */}
        <Card delay={baseDelay + step * 3}>
          <SectionLabel>What AI means for your role</SectionLabel>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>
            {report.aiImpact}
          </p>
        </Card>

        {/* 5. Skill gap */}
        <Card delay={baseDelay + step * 4}>
          <SectionLabel>Your skill gap</SectionLabel>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--subtle)" }}>
                You likely already have
              </p>
              <ul className="space-y-1">
                {report.skillGap.haveLikely.map((skill, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--subtle)" }} />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--accent)" }}>
                Becoming valuable now
              </p>
              <ul className="space-y-1">
                {report.skillGap.becomingValuable.map((skill, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "var(--text)" }}>
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* 6. Upskilling path */}
        <Card delay={baseDelay + step * 5}>
          <SectionLabel>Skills to learn</SectionLabel>
          <div className="space-y-4">
            {report.upskillingPath.map((item, i) => (
              <div
                key={i}
                className={`flex gap-4 ${i > 0 ? "pt-4 border-t" : ""}`}
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                  style={{
                    background: "var(--accent-bg)",
                    color: "var(--accent)",
                    border: "1px solid var(--accent-border)",
                  }}
                >
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {item.skill}
                    </p>
                    <span className="text-xs shrink-0" style={{ color: "var(--subtle)" }}>
                      {item.timeframe}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-1.5" style={{ color: "var(--muted)" }}>
                    {item.why}
                  </p>
                  {item.resource?.url && (
                    <a
                      href={item.resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
                      style={{ color: "var(--accent)" }}
                    >
                      {item.resource.name || "Learn more"} →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 7. Dorothy Move — hero card */}
        <div
          className="report-section rounded-xl p-6"
          style={{
            background: "var(--accent-bg)",
            border: "2px solid var(--accent-border)",
            animationDelay: `${baseDelay + step * 6}ms`,
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--accent)" }}
          >
            Your Dorothy Vaughan move
          </p>
          <p
            className="text-2xl font-bold leading-tight mb-4"
            style={{ color: "var(--text)" }}
          >
            {report.dorothyMove.skill}
          </p>
          <p
            className="text-sm leading-relaxed mb-5"
            style={{ color: "var(--muted)" }}
          >
            {report.dorothyMove.rationale}
          </p>
          {report.dorothyMove.resource?.url && (
            <a
              href={report.dorothyMove.resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
              style={{
                background: "var(--accent)",
                color: "#FFFFFF",
              }}
            >
              {report.dorothyMove.resource.name || "Start learning"} →
            </a>
          )}
        </div>
      </div>

      {/* Export button */}
      <div
        className="report-section flex justify-center pt-2 no-print"
        style={{ animationDelay: `${baseDelay + step * 7}ms` }}
      >
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:opacity-85"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M7 1v8M4 6l3 3 3-3M1 10v1.5A1.5 1.5 0 002.5 13h9a1.5 1.5 0 001.5-1.5V10" />
          </svg>
          Export as PDF
        </button>
      </div>
    </div>
  );
}
