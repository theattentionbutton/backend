import express from "express";
import { Liquid } from "liquidjs";
import path from "path";
import cors from "cors";
import session from "express-session";
import sqlite from "better-sqlite3";
import * as errors from "./routes/errors.ts";
import * as index from "./routes/index.ts";
import * as store from "./routes/store.ts";
import * as register from "./routes/register.ts";
import { config } from "../utils/config.ts";
import { timeMs } from "../utils/time.ts";
import { SqliteStore } from "../utils/sqlite3-session-store.ts";

const makeCors = () => cors({
    origin: "https://theattentionbutton.in",
    optionsSuccessStatus: 200
});

const makeSession = () => {
    const db = new sqlite("sessions.db");
    return session({
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true,
            maxAge: timeMs({ d: 7 }),
            sameSite: 'lax',
            httpOnly: true,
        },

        secret: config.secrets,
        store: new SqliteStore({
            client: db,
            expired: {
                clear: true,
                intervalMs: timeMs({ h: 0.5 })
            }
        })
    })
}

declare module "express-session" {
    interface SessionData {
        username?: string;
    }
}

const requiresAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.session.username) {
        return next();
    }
    return res.redirect('/login');
}

export const createApp = () => {
    const app = express();
    const liquid = new Liquid({ extname: ".liquid" });

    app.engine("liquid", liquid.express());
    app.set("view engine", "liquid");
    app.set("views", path.resolve("./templates"));
    app.use(express.static("./public"));
    app.use(express.urlencoded({ extended: true }));
    app.use(makeSession());
    app.get("/", index.get);
    app.get("/store", store.get);
    app.get('/register', register.get);

    app.use(makeCors());
    app.get('/account', requiresAuth, index.get);

    app.use(errors.catchall);
    app.use(errors.renderer);

    return app;
}