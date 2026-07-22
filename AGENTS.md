# markitdown-vellum

Vellum Assistant plugin: one stateless tool `markitdown` using `markitdown-js`.

## Scope

- `tools/markitdown.ts` — tool surface (default export, loaded by host)
- `src/convert.ts` — conversion logic (not walked by plugin loader)
- `src/vision-llm.ts` — markitdown-js `llmCall` bridged to `getConfiguredProvider("vision")`
- `src/find-vision-profile.ts` — first enabled vision profile (`getModelProfiles` + `doesSupportVision`)
- `hooks/init.ts` — loads `config.json` into runtime settings via `setPluginConfig`
- `config.json` — user-editable settings; host reads it and passes parsed JSON to `hooks/init.ts` via `InitContext.config`
- `src/plugin-config.ts` — `parsePluginConfig` + `setPluginConfig` (init) + `getCfg()` (runtime cache, not disk read)
- Extension allowlist in `src/supported-extensions.ts`; validate in `resolveWorkspacePath` before convert
- Input: workspace `path` only — no URLs, no audio/video

## Install target

```text
<workspace>/plugins/markitdown-vellum/
```

Host reads `package.json` as manifest; tool name = file basename (`markitdown`).

## Commands

```sh
npm install
```

Typecheck (dev):

```sh
npm install --save-dev typescript @types/node @vellumai/plugin-api
npx tsc --noEmit
```

## Contract

- Import types/runtime only from `@vellumai/plugin-api` in `tools/`
- `peerDependencies["@vellumai/plugin-api"]`: semver range checked at load
- Tool is stateless for durable data: no `data/` persistence; runtime settings from `config.json` via `hooks/init.ts`
- `defaultRiskLevel`: `low` (read-only conversion)

## Gotchas

- Stale compiled `.js` next to `.ts` wins at load time — `.gitignore` ignores `*.js`; delete manually if you compile locally
- Image LLM: `createVisionLlmCall` in `src/vision-llm.ts` mirrors `plugins/defaults/image-fallback/src/vision-caption.ts` — call site `"vision"`, profile from `findVisionProfile()`
- markitdown-js `convert()` returns `{ title, textContent }`; `textContent` is markdown body
