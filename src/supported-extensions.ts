import { throwLogged } from "./ctx.js";

const SUPPORTED_EXTENSIONS = [
  ".atom",
  ".docx",
  ".htm",
  ".html",
  ".ipynb",
  ".jpeg",
  ".jpg",
  ".msg",
  ".pdf",
  ".png",
  ".pptx",
  ".rss",
  ".xls",
  ".xlsx",
  ".xml",
  ".zip",
] as const;

const SUPPORTED_EXTENSION_SET: Set<string> = new Set(SUPPORTED_EXTENSIONS);

export function formatSupportedExtensionsList(): string {
  return SUPPORTED_EXTENSIONS.join(", ");
}

export function formatMarkitdownToolDescription(): string {
  return (
    "Convert a workspace document to markdown. " +
    `Supported extensions: ${formatSupportedExtensionsList()}.`
  );
}

export function assertSupportedFileExtension(fileExtension: string): void {
  const normalizedExtension = fileExtension.toLowerCase();

  if (normalizedExtension.length === 0) {
    throwLogged(
      `Unsupported file type (no extension). Supported extensions: ${formatSupportedExtensionsList()}`,
      { fileExtension },
    );
  }

  if (!SUPPORTED_EXTENSION_SET.has(normalizedExtension)) {
    throwLogged(
      `Unsupported file type "${normalizedExtension}". Supported extensions: ${formatSupportedExtensionsList()}`,
      { fileExtension: normalizedExtension },
    );
  }
}
