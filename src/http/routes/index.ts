import express from "express";

export const get: express.Handler = (_, res) => {
    res.render("index");
}

export default { get };