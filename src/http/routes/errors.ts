import express from "express";
import { getReasonPhrase } from "http-status-codes";
import { getHttpDescription } from "../../utils/index.ts";

export const catchall: express.Handler = (_, __, next) => {
    const err = new Error(getHttpDescription(404));
    (err as any).status = 404;
    next(err);
}

export const renderer: express.ErrorRequestHandler = (err, _, res, __) => {
    const code = err.status || 500;
    const details = getHttpDescription(code);
    const name = getReasonPhrase(code) || "Internal Server Error";

    // Render the LiquidJS template with the error details
    res.status(code).render('error', {
        code,
        details,
        name,
        title: name
    });
}

export default { renderer, catchall };