import express from "express";
import { config } from "../../utils/config.ts";

export const get: express.Handler = (_, res) => {
    return res.redirect(config.storeUrl);
}

export default { get };