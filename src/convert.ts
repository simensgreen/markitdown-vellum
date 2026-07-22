import Markitdown from "markitdown-js";
import {
  assertReadableWorkspaceFile,
  resolveWorkspacePath,
} from "./path-validation.js";
import { createVisionLlmCall } from "./vision-llm.js";
import { throwLogged } from "./ctx.js";

export type ConvertInput = {
  path: string;
};

export type ConvertOptions = {
  signal: AbortSignal;
};

export type ConvertOutput = {
  title: string | null;
  markdown: string;
};

export async function convertDocument(
  input: ConvertInput,
  workingDir: string,
  options: ConvertOptions,
): Promise<ConvertOutput> {
  const resolvedPath = resolveWorkspacePath(input.path, workingDir);
  await assertReadableWorkspaceFile(resolvedPath);

  const converter = new Markitdown({
    llmCall: createVisionLlmCall(options.signal),
  });

  const result = await converter.convert(resolvedPath);

  if (result === null) {
    throwLogged(
      "Conversion returned no result. The file may be corrupt or unreadable.",
      { path: resolvedPath },
    );
  }

  return {
    title: result.title,
    markdown: result.textContent,
  };
}
