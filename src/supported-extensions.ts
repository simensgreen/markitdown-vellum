import { FileExtension } from "@cognipeer/to-markdown";
import { throwLogged } from "./ctx.js";

const EXCLUDED_EXTENSIONS = new Set<string>([
  FileExtension.TXT,
  FileExtension.MP3,
  FileExtension.WAV,
]);

const SUPPORTED_EXTENSIONS: readonly string[] = Object.values(
  FileExtension,
).filter((extension) => !EXCLUDED_EXTENSIONS.has(extension));

const SUPPORTED_EXTENSION_SET: Set<string> = new Set(SUPPORTED_EXTENSIONS);

export function formatSupportedExtensionsList(): string {
  return [...SUPPORTED_EXTENSIONS].sort().join(", ");
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
