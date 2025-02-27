import express from "express";
import "../../utils/express-session.d.ts";
import { loginSchema } from "../../schemas/auth.ts";
import { fromError } from "zod-validation-error";
import { parseBody, renderError } from "../../utils/index.ts";
import { getUser } from "../../db/auth.ts";
import { verify } from "argon2";

export const get: express.Handler = (req, res) => {
    return res.render("auth", { register: false });
}

export const post: express.Handler = async (req, res) => {
    const body = await parseBody(loginSchema, res, req.body);
    if (!body) return;

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
        req.session.user = user;
        req.session.save();
        return res.redirect('/dashboard');
    }
}