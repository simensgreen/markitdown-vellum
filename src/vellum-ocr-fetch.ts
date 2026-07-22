import {
  getConfiguredProvider,
  type ImageContent,
} from "@vellumai/plugin-api";
import { CTX } from "./ctx.js";

/** Sentinel base URL; cognipeer custom-vlm POSTs to `{apiBase}/chat/completions`. */
export const VELLUM_OCR_API_BASE = "http://vellum-ocr.invalid/v1";

type OpenAiChatCompletionRequest = {
  messages?: Array<{
    role?: string;
    content?: Array<
      | { type: "text"; text?: string }
      | { type: "image_url"; image_url?: { url?: string } }
    >;
  }>;
};

let originalFetch: typeof fetch | undefined;
let fetchPatchDepth = 0;

function parseDataUrl(
  dataUrl: string,
): { mediaType: string; base64Data: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/u.exec(dataUrl);
  if (match === null) {
    return null;
  }

  const mediaType = match[1]!.trim();
  const base64Data = match[2]!.trim();
  if (base64Data.length === 0) {
    return null;
  }

  return { mediaType, base64Data };
}

function userPromptFromRequest(request: OpenAiChatCompletionRequest): string {
  for (const message of request.messages ?? []) {
    for (const block of message.content ?? []) {
      if (block.type === "text" && block.text !== undefined) {
        const trimmedPrompt = block.text.trim();
        if (trimmedPrompt.length > 0) {
          return trimmedPrompt;
        }
      }
    }
  }

  return CTX.cfg.visionDefaultUserPrompt;
}

function imageFromRequest(
  request: OpenAiChatCompletionRequest,
): ImageContent | null {
  for (const message of request.messages ?? []) {
    for (const block of message.content ?? []) {
      if (block.type !== "image_url") {
        continue;
      }

      const imageUrl = block.image_url?.url?.trim();
      if (imageUrl === undefined || imageUrl.length === 0) {
        continue;
      }

      const parsedDataUrl = parseDataUrl(imageUrl);
      if (parsedDataUrl === null) {
        continue;
      }

      return {
        type: "image",
        source: {
          type: "base64",
          media_type: parsedDataUrl.mediaType,
          data: parsedDataUrl.base64Data,
        },
      };
    }
  }

  return null;
}

function openAiCompletionResponse(text: string): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: text } }],
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

function openAiErrorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleVellumOcrFetch(
  cancelSignal: AbortSignal,
  init?: RequestInit,
): Promise<Response> {
  if (cancelSignal.aborted) {
    return openAiErrorResponse(499, "conversion cancelled");
  }

  let request: OpenAiChatCompletionRequest;
  try {
    request = JSON.parse(String(init?.body ?? "{}")) as OpenAiChatCompletionRequest;
  } catch {
    return openAiErrorResponse(400, "invalid JSON body");
  }

  const image = imageFromRequest(request);
  if (image === null) {
    return openAiErrorResponse(400, "request is missing image_url content");
  }

  const provider = await getConfiguredProvider("vision");
  if (provider === null) {
    CTX.log.error({}, "no vision provider is configured");
    return openAiErrorResponse(503, "no vision provider is configured");
  }
  CTX.log.info({ providerName: provider.name }, `using "${provider.name}" for ocr`)

  const userPrompt = userPromptFromRequest(request);
  const { visionSystemPrompt } = CTX.cfg;

  try {
    const response = await provider.sendMessage(
      [
        {
          role: "user",
          content: [image, { type: "text", text: userPrompt }],
        },
      ],
      {
        systemPrompt: visionSystemPrompt,
        config: {
          callSite: "vision",
          tool_choice: { type: "none" },
        },
        signal: cancelSignal,
      },
    );

    const extractedText = response.content
      .flatMap((block) => (block.type === "text" ? [block.text] : []))
      .join("\n")
      .trim();

    return openAiCompletionResponse(extractedText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    CTX.log.error({ error }, `vellum OCR fetch patch failed: ${message}`);
    return openAiErrorResponse(502, message);
  }
}

function createPatchedFetch(cancelSignal: AbortSignal): typeof fetch {
  const baseFetch = originalFetch ?? globalThis.fetch;

  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (requestUrl.startsWith(`${VELLUM_OCR_API_BASE}/chat/completions`)) {
      return handleVellumOcrFetch(cancelSignal, init);
    }

    return baseFetch(input, init);
  };
}

export async function withVellumOcrFetch<T>(
  cancelSignal: AbortSignal,
  run: () => Promise<T>,
): Promise<T> {
  if (fetchPatchDepth === 0) {
    originalFetch = globalThis.fetch;
    globalThis.fetch = createPatchedFetch(cancelSignal) as typeof fetch;
  }
  fetchPatchDepth++;

  try {
    return await run();
  } finally {
    fetchPatchDepth--;
    if (fetchPatchDepth === 0 && originalFetch !== undefined) {
      globalThis.fetch = originalFetch;
      originalFetch = undefined;
    }
  }
}

export function vellumOcrFetchPatchNeeded(): boolean {
  return CTX.cfg.visionMode === "vellum";
}
