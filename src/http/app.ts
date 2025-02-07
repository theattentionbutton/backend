import express from "express";
import { Liquid } from "liquidjs";
import path from "path";
import cors from "cors";
import session from "express-session";
import sqlite from "better-sqlite3";
import errors from "./routes/errors.ts";
import index from "./routes/index.ts";
import store from "./routes/store.ts";
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

    /** Routes that should enforce cors! */
    app.use(makeCors());
    /** Routes that should enforce cors! */

    app.use(errors.catchall);
    app.use(errors.renderer);

    return app;
}