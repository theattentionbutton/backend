import express from "express";
import { loginSchema } from "../../schemas/auth.ts";
import { fromError } from "zod-validation-error";
import { renderError } from "../../utils/index.ts";
import { getUser } from "../../db/auth.ts";
import { verify } from "argon2";

export const get: express.Handler = (req, res) => {
    return res.render("auth", { register: false });
}

export const post: express.Handler = async (req, res) => {
    const parseResult = await loginSchema.safeParseAsync(req.body);
    if (!parseResult.success) {
        return renderError(res, {
            details: fromError(parseResult.error).toString(),
            name: "Validation error",
        })
    }
    const body = parseResult.data;
    const user = await getUser(body.authEmail);
    if (!user) {
        return renderError(res, {
            details: "No such user exists. You should <a href='/register'>register</a> first.",
            name: "User Not Found"
        });
    }
    if (!user.confirmed) {
        return res.render("register-result", {
            message: "Looks like you completed signup, but you haven't verified your e-mail yet! Please check your inbox to complete verification.",
            heading: "Verification Pending",
            title: "Verification Pending"
        })
    }

    if (!await verify(user.password, body.authPassword)) {
        return renderError(res, {
            details: "Invalid username or password.",
            name: "Incorrect credentials"
        });
    }
    else {
        req.session.username = user.username;
        req.session.save();
        return res.redirect('/account');
    }
}