// Tolerant partial JSON parser. Given a possibly-incomplete JSON string
// (the kind that streams in chunk-by-chunk from an LLM), close any open
// containers/strings so JSON.parse can succeed, and return the best-effort
// shape. Falls back to null if the buffer is too unhealthy.

export function parsePartialJson<T = any>(buffer: string): T | null {
  if (!buffer) return null;

  // Find first `{` or `[`.
  const start = buffer.search(/[{[]/);
  if (start < 0) return null;
  let s = buffer.slice(start);

  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}" || ch === "]") {
      stack.pop();
    }
  }

  // Close an unterminated string.
  if (inString) s += '"';

  // Trim a trailing comma that would otherwise break the parse, if any
  // closing bracket immediately follows our cursor.
  s = s.replace(/,(\s*)$/g, "$1");

  // Close any open containers.
  while (stack.length) {
    const open = stack.pop();
    s += open === "{" ? "}" : "]";
  }

  // Final guard: trailing commas before a `}` or `]`.
  s = s.replace(/,(\s*[}\]])/g, "$1");

  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
