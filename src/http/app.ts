import express from "express";
import { Liquid } from "liquidjs";
import path from "path";
import { z } from "zod";
import { configSchema } from "../schemas/config";
import errors from "./routes/errors";
import index from "./routes/index";
import store from "./routes/store";

export const createApp = () => {
    const app = express();
    const liquid = new Liquid({ extname: ".liquid" });

    app.engine("liquid", liquid.express());
    app.set("view engine", "liquid");
    app.set("views", path.resolve("./templates"));
    app.use(express.static("./public"));

    app.get("/", index.get);
    app.get("/store", store.get);

    app.use(errors.catchall);
    app.use(errors.renderer);

    return app;
}