import type { ToolContext, ToolExecutionResult } from "@vellumai/plugin-api";
import { convertDocument } from "../src/convert.js";
import {
  resolveWorkspaceOutputPath,
  resolveWorkspacePath,
  writeWorkspaceMarkdown,
} from "../src/path-validation.js";
import { formatMarkitdownToolDescription } from "../src/supported-extensions.js";
import { CTX } from "../src/ctx.js";

type MarkitdownToolInput = {
  path: unknown;
  targetPath?: unknown;
};

function formatConvertedMarkdown(
  title: string | null,
  markdown: string,
): string {
  const titleLine =
    title !== null && title.length > 0 ? `title: ${title}\n\n` : "";
  return `${titleLine}${markdown}`;
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
      targetPath: {
        type: "string",
        description:
          "Optional workspace path to write the markdown output. When set, the full text is saved to this file and the tool returns a short confirmation instead of the body (useful for large documents).",
      },
    },
    required: ["path"],
  },
  async execute(
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<ToolExecutionResult> {
    const signal = AbortSignal.any([
      context.signal ?? new AbortSignal(),
      AbortSignal.timeout(CTX.cfg.documentTimeoutMs),
    ]);

    if (signal.aborted) {
      return { content: "error: conversion cancelled", isError: true };
    }

    const toolInput = input as MarkitdownToolInput;
    const path = new String(toolInput.path).trim();

    if (path.length === 0) {
      return {
        content: "error: path must be non-empty",
        isError: true,
      };
    }

    const targetPathRaw =
      toolInput.targetPath === undefined
        ? null
        : new String(toolInput.targetPath).trim();
    if (targetPathRaw !== null && targetPathRaw.length === 0) {
      return {
        content: "error: targetPath must be non-empty when provided",
        isError: true,
      };
    }

    try {
      let resolvedOutputPath: string | null = null;
      if (targetPathRaw !== null) {
        resolvedOutputPath = resolveWorkspaceOutputPath(
          targetPathRaw,
          context.workingDir,
        );
        const resolvedInputPath = resolveWorkspacePath(path, context.workingDir);
        if (resolvedOutputPath === resolvedInputPath) {
          return {
            content: "error: targetPath must not be the same as path",
            isError: true,
          };
        }
      }

      const converted = await convertDocument(
        { path },
        context.workingDir,
        { signal },
      );

      if (signal.aborted) {
        return { content: "error: conversion cancelled", isError: true };
      }

      const markdown = formatConvertedMarkdown(
        converted.title,
        converted.markdown,
      );

      if (resolvedOutputPath === null) {
        return {
          content: markdown,
          isError: false,
        };
      }

      await writeWorkspaceMarkdown(resolvedOutputPath, markdown);

      return {
        content: `written to ${targetPathRaw}`,
        isError: false,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : new String(error);
      return { content: `error: ${message}`, isError: true };
    }
  },
};
