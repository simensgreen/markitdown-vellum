import { access, realpath } from "node:fs/promises";
import { constants } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { throwLogged } from "./ctx.js";

async function resolveRealPath(
  path: string,
  errorMessage: string,
): Promise<string> {
  try {
    return await realpath(path);
  } catch (error) {
    throwLogged(errorMessage, { path, error });
  }
}


/** Standard containment check (no Node/Bun stdlib equivalent). */
function isPathInside(parent: string, candidate: string): boolean {
  const pathFromParent = relative(parent, candidate);
  return (
    pathFromParent !== "" &&
    !pathFromParent.startsWith("..") &&
    !isAbsolute(pathFromParent) &&
    resolve(parent, pathFromParent) === candidate
  );
}

function resolveCandidatePath(
  filePath: string,
  workspaceRoot: string,
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

  return isAbsolute(trimmedPath)
    ? resolve(trimmedPath)
    : resolve(workspaceRoot, trimmedPath);
}

export async function resolveWorkspacePath(
  filePath: string,
  workspaceRoot: string,
): Promise<string> {
  const candidatePath = resolveCandidatePath(filePath, workspaceRoot);

  const resolvedPath = await resolveRealPath(
    candidatePath,
    "File is not readable.",
  );

  if (!isPathInside(workspaceRoot, resolvedPath)) {
    throwLogged("Path must be inside the workspace.", {
      filePath,
      candidatePath,
      resolvedPath,
      workspaceRoot,
    });
  }

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
