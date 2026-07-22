import { convertToMarkdown } from "@cognipeer/to-markdown";
import { extname } from "node:path";
import {
  assertReadableWorkspaceFile,
  resolveWorkspacePath,
} from "./path-validation.js";
import { assertSupportedFileExtension } from "./supported-extensions.js";
import { buildCognipeerOcrOptions } from "./ocr-options.js";
import {
  vellumOcrFetchPatchNeeded,
  withVellumOcrFetch,
} from "./vellum-ocr-fetch.js";
import { throwLogged } from "./ctx.js";

async function runConversion(resolvedPath: string): Promise<string> {
  const ocrOptions = buildCognipeerOcrOptions();
  return convertToMarkdown(resolvedPath, {
    ocr: ocrOptions,
  });
}

export async function convertDocument(
  path: string,
  workingDir: string,
  signal: AbortSignal,
): Promise<string> {
  assertSupportedFileExtension(extname(path));

  const resolvedPath = await resolveWorkspacePath(path, workingDir);
  await assertReadableWorkspaceFile(resolvedPath);

  if (signal.aborted) {
    throwLogged("Conversion cancelled.", { path: resolvedPath });
  }

  const markdown = vellumOcrFetchPatchNeeded()
    ? await withVellumOcrFetch(signal, () => runConversion(resolvedPath))
    : await runConversion(resolvedPath);

  if (signal.aborted) {
    throwLogged("Conversion cancelled.", { path: resolvedPath });
  }

  if (markdown.trim().length === 0) {
    throwLogged(
      "Conversion returned no result. The file may be corrupt or unreadable.",
      { path: resolvedPath },
    );
  }

  return markdown;
}
