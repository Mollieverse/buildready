"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parsePartialJson } from "./partialJson";

export type Provider = "claude" | "gemini";

type Status = "idle" | "streaming" | "done" | "error";

type Body = {
  prompt: string;
  stage: "quick" | "full";
  categoryScores?: { name: string; score: number }[];
};

export function useAnalyzeStream<T>() {
  const [partial, setPartial] = useState<Partial<T> | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPartial(null);
    setProvider(null);
    setStatus("idle");
    setError(null);
  }, []);

  const run = useCallback(async (body: Body) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setPartial(null);
    setProvider(null);
    setError(null);
    setStatus("streaming");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let textAcc = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        // SSE: split on double-newline frame boundaries.
        const frames = buf.split("\n\n");
        buf = frames.pop() || "";

        for (const frame of frames) {
          for (const line of frame.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            let msg: any;
            try {
              msg = JSON.parse(payload);
            } catch {
              continue; // skip malformed SSE line; the next frame will catch up
            }
            if (typeof msg.provider === "string") {
              setProvider(msg.provider as Provider);
            }
            if (typeof msg.delta === "string") {
              textAcc += msg.delta;
              const parsed = parsePartialJson<T>(textAcc);
              if (parsed) setPartial(parsed);
            }
            if (msg.error) {
              throw new Error(msg.error);
            }
            if (msg.done) {
              const parsed = parsePartialJson<T>(textAcc);
              if (parsed) setPartial(parsed);
              setStatus("done");
              return;
            }
          }
        }
      }

      setStatus("done");
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setError(err?.message || "Stream failed.");
      setStatus("error");
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { partial, provider, status, error, run, reset };
}
