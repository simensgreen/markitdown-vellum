import type { HookFunction, InitContext } from "@vellumai/plugin-api";
import { CTX } from "../src/ctx.js";

const init: HookFunction<InitContext> = async (context) => {
  CTX.log = context.logger;

  if (context.config !== null && typeof context.config === "object") {
    Object.assign(CTX.cfg, context.config);
  } else {
    CTX.log.warn({ configType: typeof context.config }, "wrong config type, expected object. Using defaults.")
  }
};

export default init;
