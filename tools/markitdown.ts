import type { ToolContext, ToolExecutionResult } from "@vellumai/plugin-api";
import { convertDocument } from "../src/convert.js";
import { formatMarkitdownToolDescription } from "../src/supported-extensions.js";
import { CTX } from "../src/ctx.js";

type MarkitdownToolInput = {
  path: unknown;
  timeoutMs?: unknown;
};

function resolveDocumentTimeoutMs(timeoutMsRaw: unknown): number | string {
  if (timeoutMsRaw === undefined) {
    return CTX.cfg.documentTimeoutMs;
  }

  const timeoutMs = Number(timeoutMsRaw);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return "error: timeoutMs must be a positive number";
  }

  return timeoutMs;
}

export default {
  description: formatMarkitdownToolDescription(),
  defaultRiskLevel: "low" as const,
  input_schema: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description:
          "Workspace file path (relative to the workspace root or absolute, must stay inside the workspace).",
      },
      timeoutMs: {
        type: "number",
        description:
          "Optional conversion timeout in milliseconds. Defaults to the plugin documentTimeoutMs config value.",
      },
    },
    required: ["path"],
  },
  async execute(
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolExecutionResult> {
    const toolInput = input as MarkitdownToolInput;
    const path = new String(toolInput.path).trim();

    if (path.length === 0) {
      return {
        content: "error: path must be non-empty",
        isError: true,
      };
    }

    const documentTimeoutMs = resolveDocumentTimeoutMs(toolInput.timeoutMs);
    if (typeof documentTimeoutMs === "string") {
      return { content: documentTimeoutMs, isError: true };
    }

    const signal = AbortSignal.any([
      context.signal ?? new AbortSignal(),
      AbortSignal.timeout(documentTimeoutMs),
    ]);

    if (signal.aborted) {
      return { content: "error: conversion cancelled", isError: true };
    }

    try {
      const content = await convertDocument(path, context.workingDir, signal);
      return { content, isError: false };
    } catch (error) {
      return { content: `${error}`, isError: true };
    }
  },
};
