import type { OCROptions } from "@cognipeer/to-markdown";
import { CTX } from "./ctx.js";
import { VELLUM_OCR_API_BASE } from "./vellum-ocr-fetch.js";

export function buildCognipeerOcrOptions(): OCROptions | undefined {
  if (CTX.cfg.visionMode === "tesseract") {
    return {
      provider: "tesseract",
      pdfMode: "auto",
    };
  }

  return {
    provider: "custom-vlm",
    pdfMode: "auto",
    vlm: {
      model: "vellum",
      apiKey: "vellum",
      apiBase: VELLUM_OCR_API_BASE,
      prompt: CTX.cfg.visionDefaultUserPrompt,
    },
  };
}
