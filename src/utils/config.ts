import { z } from "zod";
import { fatal, die } from "./index.ts";
import { configSchema } from "../schemas/config.ts";
import fs from "fs";

const envConfig = (): Partial<z.infer<typeof configSchema>> => {
    const result: Record<string, unknown> = {};

    if (process.env.TAB_HOSTNAME) result.hostname = process.env.TAB_HOSTNAME;
    if (process.env.TAB_HTTP_PORT) result.httpPort = Number(process.env.TAB_HTTP_PORT);
    if (process.env.TAB_SMTP_HOST) result.smtpHost = process.env.TAB_SMTP_HOST;
    if (process.env.TAB_SMTP_PORT) result.smtpPort = Number(process.env.TAB_SMTP_PORT);
    if (process.env.TAB_SMTP_USERNAME) result.smtpUsername = process.env.TAB_SMTP_USERNAME;
    if (process.env.TAB_SMTP_PASSWORD) result.smtpPassword = process.env.TAB_SMTP_PASSWORD;
    if (process.env.TAB_SMTP_SECURE !== undefined) result.smtpSecure = process.env.TAB_SMTP_SECURE === "true";
    if (process.env.TAB_STORE_URL) result.storeUrl = process.env.TAB_STORE_URL;
    if (process.env.TAB_MQTT_PORT) result.mqttPort = Number(process.env.TAB_MQTT_PORT);
    if (process.env.TAB_MQTT_TLS !== undefined) result.mqttTls = process.env.TAB_MQTT_TLS === "true";
    if (process.env.TAB_SECRETS) result.secrets = process.env.TAB_SECRETS.split(",");
    if (process.env.TAB_CAPTCHA_SECRET) result.captchaSecret = process.env.TAB_CAPTCHA_SECRET;
    if (process.env.TAB_KEY_PATH) result.keyPath = process.env.TAB_KEY_PATH;
    if (process.env.TAB_CERT_PATH) result.certPath = process.env.TAB_CERT_PATH;
    if (process.env.TAB_CA_PATH) result.caPath = process.env.TAB_CA_PATH;

    return result;
};

export const loadConfig = (): z.infer<typeof configSchema> => {
    const fileConfigPath = process.env.TAB_CONFIG_PATH || "./config.json";

    let fileConfig: Record<string, unknown> = {};
    if (fs.existsSync(fileConfigPath)) {
        fileConfig = JSON.parse(fs.readFileSync(fileConfigPath, "utf8"));
    }

    const merged = { ...fileConfig, ...envConfig() };
    const parsed = configSchema.safeParse(merged);
    if (!parsed.success) {
        return die(1, parsed.error.message);
    }

    return parsed.data;
}

export const config = loadConfig();
