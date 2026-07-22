# markitdown-vellum

Vellum Assistant plugin that exposes a `markitdown` tool backed by [markitdown-js](https://www.npmjs.com/package/markitdown-js).

## Install

### Via Vellum (recommended)

Install from GitHub or the plugin catalog (UI or CLI). Vellum materializes the plugin tree and runs `bun install` for runtime `dependencies` (including `markitdown-js`) before swapping it into:

```text
<workspace>/plugins/markitdown-vellum/
```

`@vellumai/plugin-api` is not installed — the host provides it as a workspace shim.

Restart the assistant (or reload plugins) so the tool is registered.

### Manual copy (development)

Copy or link this directory into `<workspace>/plugins/markitdown-vellum/`, then install dependencies yourself:

```sh
npm install
# or: bun install
```

## Configuration

Edit `config.json` in the plugin directory (preserved across upgrades). Omitted keys keep defaults from `src/plugin-config.ts`.

| Field | Default | Description |
| --- | --- | --- |
| `documentTimeoutMs` | `120000` | Tool-level conversion timeout (ms) |
| `visionMode` | `"vellum"` | `"vellum"` — vision LLM via plugin-api; `"tesseract"` — skip LLM, OCR only |
| `visionTimeoutMs` | `60000` | Vision LLM call timeout (ms) |
| `visionSystemPrompt` | see `config.json` | System prompt for image description |
| `visionDefaultUserPrompt` | see `config.json` | User prompt when markitdown-js does not supply one |

The host reads `config.json` and passes it to `hooks/init.ts` as `InitContext.config`. Non-object config logs a warning and leaves defaults in place.

## Tool: `markitdown`

Stateless, read-only conversion. Accepts:

- `path` — file inside the workspace (relative to workspace root or absolute)

Returns extracted markdown text (and an optional title line when present).

Supported extensions: `.atom`, `.docx`, `.htm`, `.html`, `.ipynb`, `.jpeg`, `.jpg`, `.msg`, `.pdf`, `.png`, `.pptx`, `.rss`, `.xls`, `.xlsx`, `.xml`, `.zip`.

Plain-text and source-code files are out of scope — the model can read those directly. **Not supported:** URLs, audio, and video.

Unsupported extensions fail before conversion with a message listing all supported extensions (see `src/supported-extensions.ts`).

When `visionMode` is `"vellum"`, image descriptions use the workspace **vision** call site via `@vellumai/plugin-api` (`getConfiguredProvider("vision")`). When no vision provider is configured or the LLM call fails, markitdown-js falls back to Tesseract OCR if installed. With `visionMode: "tesseract"`, the LLM path is skipped entirely.

## Optional system dependencies

- [Tesseract](https://github.com/tesseract-ocr/tesseract) — OCR fallback when vision LLM is unavailable or `visionMode` is `"tesseract"`

## Layout

```text
markitdown-vellum/
├── config.json           # user settings (preserved on upgrade)
├── hooks/init.ts         # merges config into CTX, sets logger
├── package.json          # manifest + dependencies
├── tools/markitdown.ts   # model-visible tool (name = filename)
└── src/
    ├── convert.ts        # markitdown-js wrapper
    ├── ctx.ts            # CTX (cfg + log) and throwLogged()
    ├── path-validation.ts
    ├── plugin-config.ts  # Cfg type + DEFAULT_CFG
    ├── supported-extensions.ts
    └── vision-llm.ts     # markitdown-js llmCall → vision provider
```
