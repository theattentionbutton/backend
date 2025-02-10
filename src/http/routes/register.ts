import express from "express";
import { verify } from "hcaptcha";
import { registerSchema } from "../../schemas/auth.ts";
import { parseBody, renderError, UUID_REGEX } from "../../utils/index.ts";
import { config } from "../../utils/config.ts";
import { checkVerificationEntry, confirmUser, createUser, deleteUnconfirmedUsers, getUser } from "../../db/auth.ts";
import escape from 'escape-html';
import argon2 from "argon2";
import { fromError } from "zod-validation-error";
import { sendEmail } from "../../mail.ts";

export const get: express.Handler = (_, res) => {
    return res.render("auth", { register: true });
}

export const requestRegistration: express.Handler = async (req, res, next) => {
    const body = await parseBody(registerSchema, res, req.body);
    if (!body) return;

    const verifyResult = await verify(config.captchaSecret, body.hcaptchaToken);
    if (!verifyResult.success) {
        return renderError(res, {
            details: "Invalid captcha.",
            name: "Captcha verification failed"
        });
    }

    await deleteUnconfirmedUsers();

    const userMaybe = await getUser(body.authEmail);
    if (userMaybe) {
        const prelude = `An ${userMaybe!.confirmed ? '' : 'unconfirmed '}account`;
        return renderError(res, {
            details: `${prelude} with the specified username already exists. 
            ${userMaybe!.confirmed ? '' : 'Please check your email.'}`,
            name: "Account exists"
        })
    }

    const created = await createUser({
        confirmed: 0,
        id: crypto.randomUUID(),
        name: body.registerName,
        password: await argon2.hash(body.authPassword),
        username: body.authEmail,
        verification_code: crypto.randomUUID()
    });

    if (!created) return next(new Error("Error creating user."));

    await sendEmail({
        type: 'verify-email',
        ctx: { link: `https://theattentionbutton.in/register/verify/${created.verification_code}` },
        to: body.authEmail,
        subject: "Verify your e-mail"
    });

    return res.render("register-result", {
        title: "Registration",
        heading: "Verify your email",
        message: `We have sent an e-mail to the address ${escape(body.authEmail)}.
            Please click the link within to confirm your e-mail address and 
            finish creating your account.`
    });
}

export const verifyEmail: express.Handler = async (req, res) => {
    const uuid = req.params.uuid;
    const error = () => renderError(res, {
        details: "Missing or invalid uuid.",
        code: 400,
        name: "Bad Request"
    });
    if (!uuid || !UUID_REGEX.test(uuid)) return error();
    const user = await checkVerificationEntry(uuid);
    if (!user) return error();

    if (user.confirmed) return res.redirect('/dashboard');

    await confirmUser(user.username);
    return res.render("register-result", {
        title: "Registration",
        heading: "Verified successfully!",
        message: `Your e-mail address was verified successfully! You can now proceed to <a href='/login'>login</a>.`
    });
}