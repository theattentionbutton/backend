declare module "better-sqlite3-session-store" {
    import session from "express-session";
    import { Database } from "better-sqlite3";

    interface StoreOptions {
        client: Database;
        expired?: {
            clear?: boolean;
            intervalMs?: number;
        };
    }

    class SqliteStore extends session.Store {
        get(sid: string, callback: (err: any, session?: session.SessionData | null) => void): void;
        set(sid: string, session: session.SessionData, callback?: (err?: any) => void): void;
        destroy(sid: string, callback?: (err?: any) => void): void;
        constructor(options: StoreOptions);
    }

    export = SqliteStore;
}
