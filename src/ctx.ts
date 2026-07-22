import type { PluginLogger } from "@vellumai/plugin-api";
import { DEFAULT_CFG, type Cfg } from "./plugin-config.js";

interface Ctx {
    cfg: Cfg
    log: PluginLogger
}

export const CTX: Ctx = {
    cfg: DEFAULT_CFG,
    log: console
}

export function throwLogged(
  message: string,
  fields: Record<string, unknown> = {},
): never {
  CTX.log.error(fields, message);
  throw new Error(message);
}
