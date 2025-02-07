import { z } from "zod";
import { fatal, die } from "./index.ts";
import { configSchema } from "../schemas/config.ts";
import fs from "fs";

export const loadConfig = (): z.infer<typeof configSchema> => {
    const configPath = process.env.TAB_CONFIG_PATH || "./config.json";
    if (!fs.existsSync(configPath)) {
        return fatal("Supplied config path did not exist!");
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const parsed = configSchema.safeParse(config);
    if (!parsed.success) {
        return die(1, parsed.error.message);
    }

    return parsed.data;
}

export const config = loadConfig();