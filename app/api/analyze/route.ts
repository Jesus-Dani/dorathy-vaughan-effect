import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

type TavilyResult = { title: string; url: string; content: string };

async function tavilySearch(query: string): Promise<TavilyResult[]> {
  const res = await fetch(TAVILY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 3,
      include_answer: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return (data.results ?? []) as TavilyResult[];
}

// Run targeted searches in parallel; one failed query never kills the rest.
// Hard 10-second timeout on the whole block so Tavily never stalls synthesis.
async function gatherWebContext(field: string, role: string): Promise<string> {
  const year = new Date().getFullYear();
  const queries = [
    `${field} industry trends ${year}`,
    `how AI is changing the ${role} role`,
    `top skills for ${role} ${year} online courses`,
  ];

  const timeout = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error("Tavily timeout")), 10000)
  );

  const search = (async () => {
    const settled = await Promise.allSettled(queries.map((q) => tavilySearch(q)));
    const blocks: string[] = [];
    settled.forEach((r, i) => {
      if (r.status === "fulfilled" && r.value.length) {
        const items = r.value
          .map((it) => `- ${it.title}\n  URL: ${it.url}\n  ${it.content.slice(0, 600)}`)
          .join("\n");
        blocks.push(`### ${queries[i]}\n${items}`);
      } else if (r.status === "rejected") {
        console.error(`[analyze] Tavily query failed ("${queries[i]}"):`, r.reason);
      }
    });
    return blocks.join("\n\n");
  })();

  return Promise.race([search, timeout]).catch((err) => {
    console.error("[analyze] gatherWebContext failed:", err.message);
    return "";
  });
}


const SYNTH_SYSTEM = `You are a sharp, encouraging career strategist, working in the spirit of Dorothy Vaughan — the NASA mathematician who, when IBM mainframes threatened the human-computer jobs, taught herself FORTRAN and became the person who ran the machine.

The worldview that must shape everything you write: AI does not erase jobs — it raises the standard and creates higher-leverage human work. The winning move is never to compete with the machine, but to position the human BEHIND it, doing the judgment, direction, and skilled work the machine still needs. Frame every trend and recommendation through this lens. Be honest about change, but never fatalistic, and always actionable.

Output rule: respond with ONLY a single valid JSON object matching the schema the user gives you. No preamble, no explanation, no markdown code fences, nothing before or after the JSON.`;

function buildSynthPrompt(
  field: string,
  role: string,
  experience: string,
  skills: string,
  enjoys: string,
  researchNotes: string
): string {
  return `Here is the person's profile:
- Field/industry: ${field}
- Current role: ${role}
- Years of experience: ${experience || "not specified"}
- Current skills: ${skills || "not specified"}
- Enjoys most: ${enjoys || "not specified"}

Here are researched, sourced notes about their industry. Use these as your factual basis, and prefer their source URLs for the "source" and "resource.url" fields:
"""
${researchNotes}
"""

Return a single JSON object with EXACTLY this shape:
{ "summary": "", "currentTrends": [{ "title": "", "description": "", "source": "" }], "emergingTrends": [{ "title": "", "description": "", "horizon": "12-24 months", "source": "" }], "aiImpact": "", "skillGap": { "haveLikely": [""], "becomingValuable": [""] }, "upskillingPath": [{ "step": 1, "skill": "", "why": "", "timeframe": "", "resource": { "name": "", "url": "" } }], "dorothyMove": { "skill": "", "rationale": "", "resource": { "name": "", "url": "" } } }

Field guidance:
- summary: 2-3 sentences on the current state of ${field}, in the Dorothy-Vaughan voice.
- currentTrends: 3-4 items happening now; each with title, a 1-2 sentence description, and a source URL.
- emergingTrends: 3-4 items for the next 12-24 months; each with title, description, horizon, and source URL.
- aiImpact: 2-4 sentences on how AI is reshaping the "${role}" role specifically — what shifts to the machine, and where THIS person's human judgment becomes more valuable. Never frame it as the job disappearing.
- skillGap.haveLikely: 3-5 skills someone in this role probably already has.
- skillGap.becomingValuable: 3-5 skills becoming valuable in the new wave.
- upskillingPath: 3-5 ordered steps; each with step number, skill, why it matters (tie it to the trends), a realistic timeframe (e.g. "2-4 weeks"), and a resource with a real name and working URL.
- dorothyMove: the single highest-leverage skill to learn right now — the one move that, like Vaughan learning FORTRAN, puts them ahead of the wave. Include the skill, a rationale that references their specific role and what they enjoy (${enjoys || "their strengths"}), and one resource with name and URL.

Use only real, currently-available resources with working URLs. Return ONLY the JSON.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { field, role, experience = "", skills = "", enjoys = "" } = body;

    if (!field || !role) {
      return NextResponse.json(
        { message: "Field and role are required." },
        { status: 400 }
      );
    }

    // ── Call 1: Tavily web search (10s timeout, never kills the request) ──
    const webContext = await gatherWebContext(field, role);

    const notesForSynth =
      webContext.trim() ||
      `Research notes unavailable. Generating report from model knowledge as of early 2026.`;

    // ── Call 2: Synthesize — JSON mode, no tools ──
    const synthResult = await deepseek.chat.completions.create({
      model: "deepseek-v4-flash",
      messages: [
        { role: "system", content: SYNTH_SYSTEM },
        {
          role: "user",
          content: buildSynthPrompt(field, role, experience, skills, enjoys, notesForSynth),
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 8000,
    });

    const choice = synthResult.choices[0];
    if (choice?.finish_reason === "length") {
      throw new Error("Synthesis response was truncated — max_tokens reached.");
    }

    const rawText = choice?.message?.content ?? "";

    // Extract JSON: substring from first '{' to last '}'
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new SyntaxError("No JSON object found in synthesis response.");
    }
    const report = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));

    return NextResponse.json(report);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = error as any;
    console.error("ANALYZE_ERR", e?.name, e?.status, e?.message, error);
    return NextResponse.json(
      {
        message: "Analysis failed. Please try again.",
        errorName: e?.name,
        errorStatus: e?.status ?? e?.statusCode,
        errorMessage: e?.message,
      },
      { status: 500 }
    );
  }
}