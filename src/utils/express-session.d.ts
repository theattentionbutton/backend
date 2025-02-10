import "express-session";
import type { User } from "../db/index.ts";

declare module "express-session" {
    interface SessionData {
        user?: User;
    }
}