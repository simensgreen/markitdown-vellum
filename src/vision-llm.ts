import type { ReadStream } from "node:fs";
import {
  getConfiguredProvider,
  type ImageContent,
} from "@vellumai/plugin-api";
import { CTX } from "./ctx.js";

type MarkitdownLlmMessage = {
  role: string;
  content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >;
};

type MarkitdownLlmCallParams = {
  messages?: MarkitdownLlmMessage[];
  imageBase64?: string;
  file?: ReadStream;
};

function mediaTypeFromMessages(
  messages: MarkitdownLlmMessage[] | undefined,
): string | null {
  if (messages === undefined) {
    return null;
  }

  for (const message of messages) {
    for (const block of message.content) {
      if (block.type !== "image_url") {
        continue;
      }
      const match = /^data:([^;]+);base64,/u.exec(block.image_url.url);
      if (match !== null) {
        return match[1]!;
      }
    }
  }

  return null;
}

function userPromptFromMessages(
  messages: MarkitdownLlmMessage[] | undefined,
): string | null {
  if (messages === undefined) {
    return null;
  }

  for (const message of messages) {
    for (const block of message.content) {
      if (block.type === "text" && block.text.trim().length > 0) {
        return block.text.trim();
      }
    }
  }

  return null;
}

function visionAbortSignal(cancelSignal: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(CTX.cfg.visionTimeoutMs);
  return AbortSignal.any([cancelSignal, timeoutSignal]);
}

export function createVisionLlmCall(cancelSignal: AbortSignal) {
  return async (params: MarkitdownLlmCallParams): Promise<string | null> => {
    if (CTX.cfg.visionMode === "tesseract") {
      return null;
    }

    if (cancelSignal.aborted) {
      return null;
    }

    if (params.file !== undefined) {
      CTX.log.error({}, "markitdown only image suported")
      return null;
    }

    const imageBase64 = params.imageBase64?.trim();
    if (imageBase64 === undefined || imageBase64.length === 0) {
      CTX.log.error({}, "image is missing")
      return null;
    }

    const { visionSystemPrompt, visionDefaultUserPrompt } = CTX.cfg;
    const mediaType =
      mediaTypeFromMessages(params.messages) ?? "image/jpeg";
    const userPrompt =
      userPromptFromMessages(params.messages) ?? visionDefaultUserPrompt;

    const image: ImageContent = {
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: imageBase64,
      },
    };

    const provider = await getConfiguredProvider("vision");

    if (provider === null) {
      CTX.log.error({}, "no vision provider is configured")
      return null;
    }

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
          signal: visionAbortSignal(cancelSignal),
        },
      );

      const description = response.content
        .flatMap((block) => (block.type === "text" ? [block.text] : []))
        .join(" ")
        .trim();

      return description.length > 0 ? description : null;
    } catch (error) {
      CTX.log.error({ error }, `error while processing image: ${error}`)
      return null;
    }
  };
}
