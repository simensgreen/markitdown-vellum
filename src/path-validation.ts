import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { throwLogged } from "./ctx.js";
import { assertSupportedFileExtension } from "./supported-extensions.js";

function resolvePathInsideWorkspace(
  filePath: string,
  workingDir: string,
): string {
  const trimmedPath = filePath.trim();
  if (trimmedPath.length === 0) {
    throwLogged("Path must be non-empty.", { filePath });
  }
  if (/^https?:\/\//iu.test(trimmedPath)) {
    throwLogged("URLs are not supported; provide a workspace file path.", {
      filePath: trimmedPath,
    });
  }

  const resolvedPath = isAbsolute(trimmedPath)
    ? resolve(trimmedPath)
    : resolve(workingDir, trimmedPath);

  const pathInsideWorkspace = relative(workingDir, resolvedPath);
  if (
    pathInsideWorkspace.startsWith("..") ||
    isAbsolute(pathInsideWorkspace)
  ) {
    throwLogged("Path must be inside the workspace.", {
      filePath: trimmedPath,
      workingDir,
      resolvedPath,
    });
  }

  return resolvedPath;
}

export function resolveWorkspacePath(
  filePath: string,
  workingDir: string,
): string {
  const resolvedPath = resolvePathInsideWorkspace(filePath, workingDir);
  assertSupportedFileExtension(extname(resolvedPath));
  return resolvedPath;
}

export async function assertReadableWorkspaceFile(
  resolvedPath: string,
): Promise<void> {
  try {
    await access(resolvedPath, constants.R_OK);
  } catch (error) {
    throwLogged("File is not readable.", { resolvedPath, error });
  }
}
