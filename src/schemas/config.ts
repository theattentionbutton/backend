import { z } from "zod";


const baseConfigSchema = z.object({
    hostname: z.string().default("0.0.0.0"),
    httpPort: z.number().default(8000),
    smtpHost: z.string(),
    smtpPort: z.number(),
    smtpUsername: z.string(),
    smtpPassword: z.string(),
    storeUrl: z.string().default("https://theattentionbutton.in/store"),
    mqttPort: z.number().default(1883),
    secrets: z.string().array().nonempty()
});

const mqttTlsTrueSchema = z.object({
    mqttTls: z.literal(true),
    keyPath: z.string(),
    certPath: z.string(),
    caPath: z.string(),
});

const mqttTlsFalseSchema = z.object({
    mqttTls: z.literal(false),
});

export const configSchema = baseConfigSchema.and(
    z.union([mqttTlsTrueSchema, mqttTlsFalseSchema])
);