import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 10; // Hobby plan hard cap on non-streaming time; streaming + heartbeats keep this route alive beyond it in practice

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Structured Outputs schemas — Claude's generation is constrained at the token
// level to match these exactly, so malformed/truncated JSON is structurally
// impossible. Split into two requests so the person sees a score fast (~2-4s)
// instead of waiting 10+ seconds for the full report, which also sidesteps
// Vercel Hobby's hard 10s function timeout.

const quickScoreSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    overallScore: { type: "integer", minimum: 0, maximum: 100 },
    rank: { type: "string", enum: ["Beginner", "Explorer", "Builder", "Architect", "Prompt Master"] },
    readyToBuild: { type: "boolean" },
    categoryScores: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 10 },
        },
        required: ["name", "score"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "overallScore", "rank", "readyToBuild", "categoryScores"],
  additionalProperties: false,
};

const categorySchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    score: { type: "integer", minimum: 0, maximum: 10 },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: ["name", "score", "strengths", "weaknesses", "recommendations"],
  additionalProperties: false,
};

const fullDetailSchema = {
  type: "object",
  properties: {
    detailedCategories: { type: "array", items: categorySchema },
    missingRequirements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
        required: ["title", "items"],
        additionalProperties: false,
      },
    },
    aiCompatibility: {
      type: "object",
      properties: {
        claude: { type: "integer", minimum: 0, maximum: 100 },
        gemini: { type: "integer", minimum: 0, maximum: 100 },
        codex: { type: "integer", minimum: 0, maximum: 100 },
        cursor: { type: "integer", minimum: 0, maximum: 100 },
      },
      required: ["claude", "gemini", "codex", "cursor"],
      additionalProperties: false,
    },
    simulation: {
      type: "object",
      properties: {
        willBuildCorrectly: { type: "array", items: { type: "string" } },
        potentialMisunderstandings: { type: "array", items: { type: "string" } },
        missingAssumptions: { type: "array", items: { type: "string" } },
        implementationRisks: { type: "array", items: { type: "string" } },
      },
      required: ["willBuildCorrectly", "potentialMisunderstandings", "missingAssumptions", "implementationRisks"],
      additionalProperties: false,
    },
    improvedPrompt: { type: "string" },
  },
  required: ["detailedCategories", "missingRequirements", "aiCompatibility", "simulation", "improvedPrompt"],
  additionalProperties: false,
};


function buildQuickScorePrompt(prompt: string) {
  return `
You are BuildReady, a senior staff engineer who has reviewed thousands of build prompts before they get sent to AI coding tools. You are skeptical by default — most prompts are underspecified.

PROMPT TO ANALYZE:
"""
${prompt}
"""

GRADING RULES (apply strictly — do not be generous):
- A score of 8-10 in any category requires the prompt to EXPLICITLY state relevant details. Implied details do not count.
- A score of 5-7 means partially addressed with clear gaps. A score of 0-4 means missing or only gestured at.
- "Build a [type of app] with [3-4 features]" with no data model, auth, roles, or edge cases should score 15-35 overall, not 50+.

The "categoryScores" array must contain exactly these 11 categories, in this order: Vision, Users, Features, UX Design, Architecture, Database Design, Security, Monetization, Edge Cases, Scalability, AI Readiness.

Give ONLY the scores right now — no explanations, no lists. Just the numbers and verdict.
`;
}

function buildFullDetailPrompt(prompt: string, weakestCategories: { name: string; score: number }[]) {
  const namesContext = weakestCategories.map((c) => `${c.name} (${c.score}/10)`).join(", ");
  return `
You are BuildReady, a senior staff engineer who has reviewed thousands of build prompts before they get sent to AI coding tools.

PROMPT TO ANALYZE:
"""
${prompt}
"""

You already scored this prompt across 11 categories. The weakest ones — the ones worth explaining — are: ${namesContext}.

Produce "detailedCategories" for ONLY these specific categories (same name and score as given above, do not change the score), with exactly 1 short strength, 1 short weakness, and 1 short recommendation each — one sentence max per item.

Then also produce:
- "missingRequirements": at most 2 items, each with at most 2 sub-items.
- "aiCompatibility": a 0-100 score for claude, gemini, codex, cursor based on how much the prompt's ambiguity would cause each tool to diverge from intent. Claude and Cursor fill gaps more conservatively; Codex and Gemini over-assume more.
- "simulation": exactly 1 short item each for willBuildCorrectly, potentialMisunderstandings, missingAssumptions, implementationRisks.
- "improvedPrompt": a rewritten version of the prompt fixing the weaknesses found, as ONE short paragraph (3-5 sentences) — the single highest-impact fix, not exhaustive.

Be extremely concise everywhere. Speed matters more than exhaustiveness — short, sharp, and useful beats long.
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, stage, categoryScores } = body;

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

    const isFullStage = stage === "full";

    if (isFullStage && (!Array.isArray(categoryScores) || categoryScores.length === 0)) {
      return NextResponse.json(
        { error: "Missing categoryScores for full-detail stage." },
        { status: 400 }
      );
    }

    // Only the 3 weakest categories get full detail — the rest stay score-only.
    // This is also better UX (nobody needs paragraphs on a high-scoring category)
    // and keeps stage 2's real output small enough (~400-600 tokens at ~50 tok/s
    // generation speed) to finish within Vercel's 10s cap with margin.
    const weakestCategories = isFullStage
      ? [...categoryScores].sort((a, b) => a.score - b.score).slice(0, 3)
      : [];

    const messageContent = isFullStage
      ? buildFullDetailPrompt(prompt, weakestCategories)
      : buildQuickScorePrompt(prompt);

    const schema = isFullStage ? fullDetailSchema : quickScoreSchema;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = anthropic.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: isFullStage ? 1200 : 800,
            messages: [{ role: "user", content: messageContent }],
            // @ts-expect-error -- output_config is GA on the API but not yet in SDK types
            output_config: {
              format: {
                type: "json_schema",
                schema,
              },
            },
          });

          // Forward a small heartbeat comment periodically so Vercel/proxies
          // see continuous bytes and don't treat the connection as idle.
          const heartbeat = setInterval(() => {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          }, 5000);

          anthropicStream.on("text", (textDelta) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta: textDelta })}\n\n`)
            );
          });

          anthropicStream.on("error", (err) => {
            clearInterval(heartbeat);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
            );
            controller.close();
          });

          await anthropicStream.finalMessage();
          clearInterval(heartbeat);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (err: any) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: err?.message || "Stream failed" })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Analyze route error:", err);
    return NextResponse.json(
      { error: err?.message || "Analysis failed unexpectedly." },
      { status: 500 }
    );
  }
}
