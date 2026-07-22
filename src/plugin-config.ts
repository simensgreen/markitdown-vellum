export interface Cfg {
  documentTimeoutMs: number
  visionMode: "vellum" | "tesseract"
  visionSystemPrompt: string
  visionDefaultUserPrompt: string

}


export const DEFAULT_CFG = {
  documentTimeoutMs: 120_000,
  visionMode: "vellum",
  visionSystemPrompt:
    "You are a document extraction assistant. Describe images accurately for " +
    "markdown conversion. Include visible text, layout, charts, tables, and UI " +
    "elements when present.",
  visionDefaultUserPrompt:
    "Describe this image in detail for document conversion.",
} satisfies Cfg

