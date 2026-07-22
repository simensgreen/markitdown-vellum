# markitdown-vellum

A [Vellum Assistant](https://www.vellum.ai/) plugin that lets the model read office documents, PDFs, spreadsheets, presentations, notebooks, archives, and similar files as markdown — without you opening or copying them by hand.

Built on [@cognipeer/to-markdown](https://www.npmjs.com/package/@cognipeer/to-markdown).

## What it does

Adds one tool, **`markitdown`**, to the assistant. The model can point it at a file in the workspace and get back extracted text: headings, tables, slide content, sheet data, email bodies, and image descriptions where applicable.

Scanned PDFs and images are OCR'd via the workspace vision model (`visionMode: "vellum"`) or bundled Tesseract.js (`visionMode: "tesseract"`).

Use it when a conversation needs content from office documents, PDFs, spreadsheets, presentations, notebooks, archives

Plain text and audio are **not** in scope (excluded from cognipeer's `FileExtension` list)

Supported extensions follow `@cognipeer/to-markdown` `FileExtension`, except `.txt`, `.mp3`, and `.wav`.

## Install

From the Vellum plugin catalog or GitHub. For local development: copy into `<workspace>/plugins/markitdown-vellum/`, run `npm install`, reload plugins.

## Configuration

Edit `config.json` in the plugin directory (preserved on upgrade). Omitted keys use the defaults below.

| Field | Default | Description |
| --- | --- | --- |
| `documentTimeoutMs` | `120000` | Max time for a single conversion (ms) |
| `visionMode` | `"vellum"` | `"vellum"` — OCR via workspace vision (cognipeer `custom-vlm` + fetch patch); `"tesseract"` — OCR via bundled Tesseract.js |
| `visionSystemPrompt` | see `config.json` | System prompt for vision OCR |
| `visionDefaultUserPrompt` | see `config.json` | User prompt sent to the vision model (also cognipeer `vlm.prompt`) |

## Optional system dependency

None for Tesseract mode — `@cognipeer/to-markdown` ships `tesseract.js`. PDF page rendering uses the native `canvas` module (installed automatically).
