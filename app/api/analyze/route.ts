import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60; // allow up to 60s on Vercel for long analysis

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildAnalysisPrompt(prompt: string) {
  return `
You are BuildReady, a senior staff engineer and technical co-founder who has reviewed thousands of build prompts before they get sent to AI coding tools. You are skeptical by default. Most prompts you see are underspecified, and your job is to catch exactly what's missing before the person burns AI credits and engineering time on a misinterpreted spec.

PROMPT TO ANALYZE:
"""
${prompt}
"""

GRADING RULES (apply strictly — do not be generous):
- A score of 8-10 in any category requires the prompt to EXPLICITLY state relevant details for that category. Implied or "could be inferred" details do not count.
- A score of 5-7 means the category is partially addressed but has clear, specific gaps.
- A score of 0-4 means the category is missing entirely or only gestured at in one vague phrase.
- Do not round scores up to be encouraging. A short, vague prompt should score low across most categories — that is the correct, useful outcome.
- "Build a [type of app] with [3-4 features]" with no mention of data model, auth, roles, or edge cases should score in the 15-35 overall range, not 50+.
- Every strength, weakness, and recommendation must reference something concrete from the actual prompt text — never generic boilerplate like "consider adding more detail." Quote or paraphrase the specific gap.
- For "missingRequirements": only include items the prompt genuinely does not address. Do not pad the list.
- For "aiCompatibility": score each tool based on how much the prompt's ambiguity would cause that specific tool to diverge from intent. Claude and Cursor tend to ask fewer clarifying assumptions and fill gaps more conservatively; Codex and Gemini are more likely to over-assume.
- "improvedPrompt" must fix every weakness you identified — the specific gaps found in THIS prompt, not generic best practices.

Return ONLY valid JSON in this exact structure (no markdown, no explanation, no preamble):
{
  "title": "short 3-5 word title for this prompt",
  "overallScore": <number 0-100>,
  "rank": "<one of: Beginner|Explorer|Builder|Architect|Prompt Master>",
  "readyToBuild": <boolean>,
  "categories": [
    { "name": "Vision", "score": <0-10>, "strengths": ["..."], "weaknesses": ["..."], "recommendations": ["..."] },
    { "name": "Users", "score": <0-10>, "strengths": [], "weaknesses": [], "recommendations": [] },
    { "name": "Features", "score": <0-10>, "strengths": [], "weaknesses": [], "recommendations": [] },
    { "name": "UX Design", "score": <0-10>, "strengths": [], "weaknesses": [], "recommendations": [] },
    { "name": "Architecture", "score": <0-10>, "strengths": [], "weaknesses": [], "recommendations": [] },
    { "name": "Database Design", "score": <0-10>, "strengths": [], "weaknesses": [], "recommendations": [] },
    { "name": "Security", "score": <0-10>, "strengths": [], "weaknesses": [], "recommendations": [] },
    { "name": "Monetization", "score": <0-10>, "strengths": [], "weaknesses": [], "recommendations": [] },
    { "name": "Edge Cases", "score": <0-10>, "strengths": [], "weaknesses": [], "recommendations": [] },
    { "name": "Scalability", "score": <0-10>, "strengths": [], "weaknesses": [], "recommendations": [] },
    { "name": "AI Readiness", "score": <0-10>, "strengths": [], "weaknesses": [], "recommendations": [] }
  ],
  "missingRequirements": [ { "title": "...", "items": ["..."] } ],
  "aiCompatibility": { "claude": <0-100>, "gemini": <0-100>, "codex": <0-100>, "cursor": <0-100> },
  "simulation": {
    "willBuildCorrectly": ["..."],
    "potentialMisunderstandings": ["..."],
    "missingAssumptions": ["..."],
    "implementationRisks": ["..."]
  },
  "improvedPrompt": "A significantly improved, detailed version of the original prompt that addresses every identified weakness. 2-4 paragraphs, comprehensive and production-ready."
}
`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 30) {
      return NextResponse.json(
        { error: "Prompt must be at least 30 characters." },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured: missing ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      messages: [{ role: "user", content: buildAnalysisPrompt(prompt) }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";

    let clean = text.replace(/```json|```/g, "").trim();
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.slice(firstBrace, lastBrace + 1);
    }

    if (!clean) {
      return NextResponse.json(
        { error: "Empty response from model." },
        { status: 502 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      return NextResponse.json(
        { error: "Model returned malformed JSON. Try again." },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Analyze route error:", err);
    return NextResponse.json(
      { error: err?.message || "Analysis failed unexpectedly." },
      { status: 500 }
    );
  }
}
