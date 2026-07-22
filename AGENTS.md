# markitdown-vellum

Vellum Assistant plugin: one stateless tool `markitdown` using `@cognipeer/to-markdown`.

## Scope

- `tools/markitdown.ts` — tool surface (default export, loaded by host)
- `src/convert.ts` — conversion logic (not walked by plugin loader)
- `src/ocr-options.ts` — cognipeer `ocr` options per `visionMode`
- `src/vellum-ocr-fetch.ts` — `fetch` monkeypatch: routes cognipeer `custom-vlm` to `getConfiguredProvider("vision")`
- Path validation: `workingDir` from tool context is trusted; `resolveWorkspacePath` realpaths the file and checks containment (rejects symlink escapes)
- `src/supported-extensions.ts` — allowlist from cognipeer `FileExtension` (excludes plain text + audio) + `formatMarkitdownToolDescription()`
- `src/ctx.ts` — `CTX` singleton (`cfg`, `log`) and `throwLogged()`
- `src/plugin-config.ts` — `Cfg` interface + `DEFAULT_CFG` (no runtime parsing)
- `hooks/init.ts` — `Object.assign(CTX.cfg, context.config)`; sets `CTX.log` from `InitContext.logger`
- `config.json` — user-editable settings; host reads it and passes JSON to `hooks/init.ts` via `InitContext.config`
- Input: workspace `path` (source file); optional `timeoutMs` overrides `documentTimeoutMs` for that call

## Install target

```text
<workspace>/plugins/markitdown-vellum/
```

Host reads `package.json` as manifest; tool name = file basename (`markitdown`).

Vellum install/upgrade runs `bun install --omit=dev` in the staged plugin dir (`assistant/src/cli/lib/install-plugin-dependencies.ts`) — runtime `dependencies` land in `node_modules/` automatically. Manual copy into `plugins/` requires `npm install` or `bun install` locally.

## Commands

Dev dependencies (typecheck only):

```sh
npm install
npx tsc --noEmit
```

## Contract

- Import types/runtime only from `@vellumai/plugin-api` in `tools/` and `hooks/`
- `peerDependencies["@vellumai/plugin-api"]`: semver range checked at load; not installed by plugin installer (host shim)
- Runtime settings: `CTX.cfg` populated in `hooks/init.ts`; read via `CTX.cfg` in tools/src — not re-read from disk
- Tool is stateless for durable data: no `data/` persistence
- `defaultRiskLevel`: `low` (read-only conversion)
- Tool description derived from supported extension list, not hardcoded

## Config (`Cfg` / `config.json`)

Flat keys: `documentTimeoutMs`, `visionMode` (`"vellum"` | `"tesseract"`), `visionSystemPrompt`, `visionDefaultUserPrompt`. Defaults in `DEFAULT_CFG` (`src/plugin-config.ts`). Init merges host config with `Object.assign` — no schema validation; non-object `context.config` logs a warning.

## Gotchas

- Stale compiled `.js` next to `.ts` wins at load time — `.gitignore` ignores `*.js`; delete manually if you compile locally
- `visionMode: "tesseract"` passes `{ provider: "tesseract", pdfMode: "auto" }` to cognipeer
- `visionMode: "vellum"` passes `{ provider: "custom-vlm", pdfMode: "auto", vlm: { apiBase: "http://vellum-ocr.invalid/v1", ... } }`; cognipeer's OpenAI-shaped `fetch` is intercepted and forwarded to workspace vision (no HTTP, no apiKey in config)
- `withVellumOcrFetch` wraps conversion with a ref-counted `fetch` patch; `cancelSignal` is captured in the patched function closure
- `throwLogged()` logs via `CTX.log.error` then throws — used on validation and conversion failures in `src/`
- Plugin dependency install is fail-soft (network errors logged, install continues); missing deps fail at module load
