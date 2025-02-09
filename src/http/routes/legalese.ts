import express from "express";

export const tos: express.Handler = (_, res) => {
    return res.render('tos', { title: "Terms of Service" });
}

export const privacy: express.Handler = (_, res) => {
    return res.render('privacy-policy', { title: "Privacy Policy" });
}