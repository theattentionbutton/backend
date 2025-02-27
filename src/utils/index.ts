import express from "express";
import { fromError } from "zod-validation-error";
import { z } from "zod";

export const die = (code: number, ...args: any[]): never => {
    console.log(...args);
    process.exit(code);
}

export const sha256 = async (input: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert buffer to hex string
    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

export const fatal = (...args: any[]) => die(1, "fatal:", ...args);

export const getHttpDescription = (code: number) => {
    return {
        200: "The request was successful.",
        201: "The resource was successfully created.",
        204: "The request was successful, but there is no content to send.",
        400: "The request was invalid or cannot be served.",
        401: "Authentication is required and has failed or has not been provided.",
        403: "You do not have permission to access this resource.",
        404: "The requested resource was not found on this server.",
        405: "The request method is not supported for this resource.",
        408: "The server timed out waiting for the request.",
        418: "I'm a teapot. This is not a coffee machine.",
        429: "Too many requests. Please slow down.",
        500: "An internal server error occurred.",
        502: "Bad gateway. The server received an invalid response.",
        503: "The server is temporarily unavailable or overloaded.",
        504: "The gateway timed out waiting for a response."
    }[code] || "An unknown error occurred.";
}

const RENDER_ERROR_OPTS = {
    code: "Error",
    title: "Error",
    details: "An unknown error occurred.",
    name: "Unknown error"
}

export type RenderErrorOpts = Partial<Record<keyof typeof RENDER_ERROR_OPTS, string | number>>;

const errorOpts = (opts: RenderErrorOpts): typeof RENDER_ERROR_OPTS => {
    return Object.assign(JSON.parse(JSON.stringify(RENDER_ERROR_OPTS)), opts);
}

export const renderError = (res: express.Response, opts: RenderErrorOpts, code = 400) => {
    return res.status(code).render("error", errorOpts(opts));
}


export const parseBody = async <Z extends z.ZodTypeAny = z.ZodNever>(
    schema: Z,
    res: express.Response,
    body: unknown
) => {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        renderError(res, {
            details: fromError(parsed.error).toString(),
            name: "Validation error",
        })
        return null;
    }

    return parsed.data as z.infer<Z>;
};


export const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;