# markitdown-vellum

Vellum Assistant plugin that exposes a `markitdown` tool backed by [markitdown-js](https://www.npmjs.com/package/markitdown-js).

## Install

Copy or link this directory into your workspace:

```text
<workspace>/plugins/markitdown-vellum/
```

Then install dependencies inside the plugin directory:

```sh
npm install
```

Restart the assistant (or reload plugins) so the tool is registered.

## Configuration

Edit `config.json` in the plugin directory (preserved across upgrades):

| Field | Default | Description |
| --- | --- | --- |
| `vision.timeoutMs` | `60000` | Vision LLM call timeout (ms) |
| `vision.systemPrompt` | see `config.json` | System prompt for image description |
| `vision.defaultUserPrompt` | see `config.json` | User prompt when markitdown-js does not supply one |

Omitted keys fall back to defaults. Invalid values fail plugin `init` at boot.

## Tool: `markitdown`

Stateless, read-only conversion. Accepts:

- `path` — file inside the workspace (relative to workspace root or absolute)

Returns extracted markdown text (and an optional title line when present).

Supported formats: PDF, DOCX, XLSX, PPT, HTML, JPG/PNG, IPYNB, ZIP, Outlook MSG, XML/RSS/Atom. Plain-text and source-code files are out of scope — the model can read those directly. **Not supported:** URLs, audio, and video.

Unsupported extensions fail before conversion with a message listing all supported extensions (see `src/supported-extensions.ts`).

Image descriptions use the workspace **vision** call site via `@vellumai/plugin-api` (`getConfiguredProvider`, `getModelProfiles`, `doesSupportVision`) — the first enabled vision-capable inference profile. When no vision profile is configured, markitdown-js falls back to Tesseract OCR if installed.

## Optional system dependencies

- [Tesseract](https://github.com/tesseract-ocr/tesseract) — OCR fallback when vision LLM is unavailable

## Layout

```text
markitdown-vellum/
├── package.json          # manifest + dependencies
├── tools/markitdown.ts   # model-visible tool (name derived from filename)
└── src/convert.ts        # markitdown-js wrapper
```
