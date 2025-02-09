import express from "express";

export const get: express.Handler = (req, res, next) => {
    return res.render('dashboard', {
        title: "Dashboard"
    });
}

export const logout: express.Handler = (req, res) => {
    delete req.session.username;
    req.session.save();
    return res.redirect('/');
}