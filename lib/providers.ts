import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export type Provider = "claude" | "gemini";

export type StreamEvent =
  | { type: "provider"; provider: Provider }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

type StreamArgs = {
  prompt: string;
  schema: Record<string, any>;
  maxTokens: number;
};

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Convert our JSON Schema dialect to Gemini's flavor.
// Gemini: SchemaType enum strings, no additionalProperties, "integer" → number+format.
function toGeminiSchema(schema: any): any {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (!schema || typeof schema !== "object") return schema;

  const out: any = {};
  for (const [k, v] of Object.entries(schema)) {
    if (k === "additionalProperties") continue;
    if (k === "type") {
      const t = v as string;
      out.type =
        t === "string"
          ? SchemaType.STRING
          : t === "integer" || t === "number"
            ? SchemaType.NUMBER
            : t === "boolean"
              ? SchemaType.BOOLEAN
              : t === "array"
                ? SchemaType.ARRAY
                : t === "object"
                  ? SchemaType.OBJECT
                  : SchemaType.STRING;
      if (t === "integer") out.format = "int32";
    } else if (k === "properties" && v && typeof v === "object") {
      out.properties = Object.fromEntries(
        Object.entries(v).map(([pk, pv]) => [pk, toGeminiSchema(pv)]),
      );
    } else if (k === "items") {
      out.items = toGeminiSchema(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// Claude doesn't have a native JSON Schema response mode in SDK 0.32.x.
// We force structured output via tool use: Claude must call our `respond`
// tool, whose input_schema IS our schema. The streaming deltas arrive as
// `input_json_delta` events; their `partial_json` is the streaming JSON.
async function* runClaude({
  prompt,
  schema,
  maxTokens,
}: StreamArgs): AsyncGenerator<StreamEvent, void, unknown> {
  if (!anthropic) throw new Error("ANTHROPIC_API_KEY not configured");

  yield { type: "provider", provider: "claude" };

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        name: "respond",
        description: "Return the structured analysis result.",
        input_schema: schema as any,
      },
    ],
    tool_choice: { type: "tool", name: "respond" },
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      (event.delta as any).type === "input_json_delta"
    ) {
      const partial = (event.delta as any).partial_json as string | undefined;
      if (partial) yield { type: "delta", text: partial };
    }
  }

  // Surface any error caught by the stream after iteration completes.
  // finalMessage() throws if the request failed.
  await stream.finalMessage();
  yield { type: "done" };
}

async function* runGemini({
  prompt,
  schema,
  maxTokens,
}: StreamArgs): AsyncGenerator<StreamEvent, void, unknown> {
  if (!gemini) throw new Error("GEMINI_API_KEY not configured");

  yield { type: "provider", provider: "gemini" };

  const model = gemini.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: toGeminiSchema(schema),
      maxOutputTokens: maxTokens,
    },
  });

  const result = await model.generateContentStream(prompt);
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield { type: "delta", text };
  }
  yield { type: "done" };
}

// Try Claude. If it fails before emitting any text, fall back to Gemini.
// If it fails mid-stream, surface the error rather than double-billing.
export async function* streamAnalysis(
  args: StreamArgs,
): AsyncGenerator<StreamEvent, void, unknown> {
  const claudeAvailable = !!anthropic;
  const geminiAvailable = !!gemini;

  if (!claudeAvailable && !geminiAvailable) {
    yield {
      type: "error",
      message:
        "No AI provider configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY.",
    };
    return;
  }

  if (claudeAvailable) {
    let firstDeltaYielded = false;
    try {
      for await (const ev of runClaude(args)) {
        if (ev.type === "delta") firstDeltaYielded = true;
        yield ev;
      }
      return;
    } catch (err: any) {
      const message = err?.message || "Claude stream failed.";
      if (firstDeltaYielded || !geminiAvailable) {
        yield { type: "error", message };
        return;
      }
      // Otherwise fall through to Gemini, optionally letting the UI know.
      console.warn("Claude failed before producing output, falling back to Gemini:", message);
    }
  }

  if (geminiAvailable) {
    try {
      for await (const ev of runGemini(args)) yield ev;
    } catch (err: any) {
      yield { type: "error", message: err?.message || "Gemini stream failed." };
    }
  }
}
