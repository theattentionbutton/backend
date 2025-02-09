import { z } from "zod";

export const updatePwSchema = z.object({
    "old-pw": z.string().min(6).max(72),
    "new-pw": z.string().min(6).max(72),
    "confirm-new-pw": z.string().min(6).max(72),
}).transform(data => ({
    oldPass: data['old-pw'],
    newPass: data['new-pw'],
    confirmPw: data['confirm-new-pw']
})).refine(data => data.newPass === data.confirmPw, {
    message: "Passwords must match",
    path: ["authConfirmPw"],
});

const baseLoginSchema = z.object({
    "auth-email": z.string().email(),
    "auth-password": z.string().min(6).max(72),
});

export const loginSchema = baseLoginSchema.transform(data => ({
    authEmail: data["auth-email"],
    authPassword: data["auth-password"],
}));

export const registerSchema = baseLoginSchema
    .extend({
        "register-name": z.string().min(2, { message: "Name must be at least 2 characters." }),
        "auth-confirm-pw": z.string().min(6).max(72),
        "h-captcha-response": z.string().min(1, { message: "hCaptcha validation is required." }),
    })
    .transform(data => ({
        authEmail: data["auth-email"],
        authPassword: data["auth-password"],
        authConfirmPw: data["auth-confirm-pw"]!,  // Only used in registerSchema
        registerName: data["register-name"]!,  // Only used in registerSchema
        hcaptchaToken: data["h-captcha-response"]!, // Only used in registerSchema
    }))
    .refine(data => data.authPassword === data.authConfirmPw,
        {
            message: "Passwords must match",
            path: ["authConfirmPw"],
        });
