# markitdown-vellum

Vellum Assistant plugin: one stateless tool `markitdown` using `markitdown-js`.

## Scope

- `tools/markitdown.ts` — tool surface (default export, loaded by host)
- `src/convert.ts` — conversion logic (not walked by plugin loader)
- `src/vision-llm.ts` — markitdown-js `llmCall` bridged to `getConfiguredProvider("vision")`
- `src/path-validation.ts` — workspace path resolution, URL rejection, extension allowlist
- `src/supported-extensions.ts` — allowlist + `formatMarkitdownToolDescription()`
- `src/ctx.ts` — `CTX` singleton (`cfg`, `log`) and `throwLogged()`
- `src/plugin-config.ts` — `Cfg` interface + `DEFAULT_CFG` (no runtime parsing)
- `hooks/init.ts` — `Object.assign(CTX.cfg, context.config)`; sets `CTX.log` from `InitContext.logger`
- `config.json` — user-editable settings; host reads it and passes JSON to `hooks/init.ts` via `InitContext.config`
- Input: workspace `path` only — no URLs, no audio/video, no plain-text/source files

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

Flat keys: `documentTimeoutMs`, `visionMode` (`"vellum"` | `"tesseract"`), `visionTimeoutMs`, `visionSystemPrompt`, `visionDefaultUserPrompt`. Defaults in `DEFAULT_CFG` (`src/plugin-config.ts`). Init merges host config with `Object.assign` — no schema validation; non-object `context.config` logs a warning.

## Gotchas

- Stale compiled `.js` next to `.ts` wins at load time — `.gitignore` ignores `*.js`; delete manually if you compile locally
- `visionMode: "tesseract"` makes `createVisionLlmCall` return `null` immediately; markitdown-js uses Tesseract when available
- Image LLM pattern mirrors `plugins/defaults/image-fallback/src/vision-caption.ts` — call site `"vision"`, provider from `getConfiguredProvider("vision")` (no separate profile picker)
- markitdown-js `convert()` returns `{ title, textContent }`; `textContent` is the markdown body
- `throwLogged()` logs via `CTX.log.error` then throws — used on validation and conversion failures in `src/`
- Plugin dependency install is fail-soft (network errors logged, install continues); missing deps fail at module load
