import { z } from "zod";

const normalizeKeys = (data: Record<string, string>) => ({
    authEmail: data["auth-email"],
    authPassword: data["auth-password"],
    authConfirmPw: data["auth-confirm-pw"],  // Only used in registerSchema
    registerName: data["register-name"],  // Only used in registerSchema
    hcaptchaToken: data["h-captcha-response"], // Only used in registerSchema
});

const baseLoginSchema = z.object({
    "auth-email": z.string().email(),
    "auth-password": z.string().min(6).max(72),
});

export const loginSchema = baseLoginSchema.transform(normalizeKeys);

export const registerSchema = baseLoginSchema
    .extend({
        "register-name": z.string().min(2, { message: "Name must be at least 2 characters." }),
        "auth-confirm-pw": z.string().min(6).max(72),
        "h-captcha-response": z.string().min(1, { message: "hCaptcha validation is required." }),
    })
    .transform(normalizeKeys)
    .refine(data => data.authPassword === data.authConfirmPw,
        {
            message: "Passwords must match",
            path: ["authConfirmPw"],
        });
