# markitdown-vellum

A [Vellum Assistant](https://www.vellum.ai/) plugin that lets the model read office documents, PDFs, spreadsheets, presentations, notebooks, archives, and similar files as markdown — without you opening or copying them by hand.

Built on [markitdown-js](https://www.npmjs.com/package/markitdown-js).

## What it does

Adds one tool, **`markitdown`**, to the assistant. The model can point it at a file in the workspace and get back extracted text: headings, tables, slide content, sheet data, email bodies, and image descriptions where applicable.

Use it when a conversation needs content from a `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.html`, `.ipynb`, `.zip`, Outlook `.msg`, or image-based document — formats the model cannot read natively.

Plain text, markdown, and source code are **not** in scope; the model already reads those directly. Remote URLs, audio, and video are **not** supported either.

**Supported extensions:** `.atom`, `.docx`, `.htm`, `.html`, `.ipynb`, `.jpeg`, `.jpg`, `.msg`, `.pdf`, `.png`, `.pptx`, `.rss`, `.xls`, `.xlsx`, `.xml`, `.zip`.

## Install

From the Vellum plugin catalog or GitHub. For local development: copy into `<workspace>/plugins/markitdown-vellum/`, run `npm install`, reload plugins.

## Configuration

Edit `config.json` in the plugin directory (preserved on upgrade). Omitted keys use the defaults below.

| Field | Default | Description |
| --- | --- | --- |
| `documentTimeoutMs` | `120000` | Max time for a single conversion (ms) |
| `visionMode` | `"vellum"` | `"vellum"` — describe images via the workspace vision model; `"tesseract"` — OCR only, no LLM |
| `visionTimeoutMs` | `60000` | Max time for a vision LLM call (ms) |
| `visionSystemPrompt` | see `config.json` | System prompt when describing images |
| `visionDefaultUserPrompt` | see `config.json` | User prompt when markitdown-js does not supply one |

## Optional system dependency

[Tesseract](https://github.com/tesseract-ocr/tesseract) — OCR fallback for images when no vision model is configured.
