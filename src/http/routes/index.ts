import { Handler } from "express";

export const get: Handler = (_, res) => {
    res.render("index");
}

export default { get };