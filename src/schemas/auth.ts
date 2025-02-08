import { z } from "zod";

export const loginSchema = z.object({
    authEmail: z.string().email({ message: "Invalid email." }),
    authPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const registerSchema = loginSchema.extend({
    registerName: z.string().min(2, { message: "Name must be at least 2 characters" }),
    authConfirmPw: z.string().min(6, { message: "Password must be at least 6 characters" }),
    hcaptchaToken: z.string().min(1, { message: "hCaptcha validation is required" }),
}).refine(data => data.authPassword === data.authConfirmPw, {
    message: "Passwords must match",
    path: ["authConfirmPw"],
});
