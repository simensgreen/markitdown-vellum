import type { ToolContext, ToolExecutionResult } from "@vellumai/plugin-api";
import { convertDocument } from "../src/convert.js";
import { formatMarkitdownToolDescription } from "../src/supported-extensions.js";
import { CTX } from "../src/ctx.js";

type MarkitdownToolInput = {
  path: unknown;
};

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
    },
    required: ["path"],
  },
  async execute(
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolExecutionResult> {
    const signal = AbortSignal.any([context.signal ?? new AbortSignal(), AbortSignal.timeout(CTX.cfg.documentTimeoutMs)])

    if (signal.aborted) {
      return { content: "error: conversion cancelled", isError: true };
    }

    const toolInput = input as MarkitdownToolInput;
    const path = new String(toolInput.path).trim()

    if (path.length === 0) {
      return {
        content: "error: path must be non-empty",
        isError: true,
      };
    }

    try {
      const converted = await convertDocument({ path }, context.workingDir, { signal });

      if (signal.aborted) {
        return { content: "error: conversion cancelled", isError: true };
      }

      const titleLine =
        converted.title !== null && converted.title.length > 0
          ? `title: ${converted.title}\n\n`
          : "";

      return {
        content: `${titleLine}${converted.markdown}`,
        isError: false,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : new String(error);
      return { content: `error: ${message}`, isError: true };
    }
  },
};
