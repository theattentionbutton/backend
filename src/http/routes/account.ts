import express from "express";

export const get: express.Handler = (req, res, next) => {
    return res.render('dashboard', {
export const updatePw: express.Handler = async (req, res, next) => {
    const parseResult = await updatePwSchema.safeParseAsync(req.body);
    if (!parseResult.success) {
        return renderError(res, {
            details: fromError(parseResult.error).toString(),
            name: "Validation error",
        })
    }
    const body = parseResult.data;
    const username = req.session.username!;
    const user = await getUser(username);
    if (!user) return next(new Error('An internal server error occurred.'));
    if (!await verify(user.password, body.oldPass)) {
        return renderError(res, {
            name: "Password error",
            details: "Current password was incorrect."
        })
    }

    await updatePassword(username, body.newPass);
    return res.redirect('/account');
}

export const logout: express.Handler = (req, res) => {
    delete req.session.username;
    req.session.save();
    return res.redirect('/');
}