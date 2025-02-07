import { Handler } from "express";
import { config } from "../../utils/config";

export const get: Handler = (_, res) => {
    return res.redirect(config.storeUrl);
}

export default { get };