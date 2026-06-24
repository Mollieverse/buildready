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
// Gemini wants: SchemaType enum strings, no additionalProperties, no "integer" (use "number"+format).
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
    // @ts-expect-error -- output_config is GA on the API but not yet in SDK types
    output_config: { format: { type: "json_schema", schema } },
  });

  let errored: Error | null = null;
  stream.on("error", (e) => {
    errored = e;
  });

  for await (const event of stream) {
    if (errored) throw errored;
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield { type: "delta", text: event.delta.text };
    }
  }
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
// If it fails mid-stream, we surface the partial as an error rather than
// double-billing the user with two providers' output.
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
    const primary = runClaude(args);
    let firstYielded = false;
    try {
      for await (const ev of primary) {
        firstYielded = ev.type === "delta" ? true : firstYielded;
        yield ev;
      }
      return;
    } catch (err: any) {
      if (firstYielded || !geminiAvailable) {
        yield {
          type: "error",
          message: err?.message || "Claude stream failed.",
        };
        return;
      }
      // Otherwise fall through to Gemini.
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
