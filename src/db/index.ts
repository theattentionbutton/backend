import { Kysely, sql, SqliteDialect } from "kysely";
import SQLite from 'better-sqlite3';

export interface Database {
    users: User;
    rooms: Room;
    memberships: Membership;
    room_requests: RoomRequest;
}

export interface User {
    id: string;
    name: string;
    username: string;
    password: string;
    created_at: number;
    confirmed: boolean;
}

export interface Room {
    id: string;
    secret: string;
    name: string;
}

export interface Membership {
    user: string;
    room: string;
}

export interface RoomRequest {
    from: string;
    to: string;
    created_at: number;
}

const dialect = new SqliteDialect({
    database: new SQLite('./tab-backend.db'),
});

export const db = new Kysely<Database>({ dialect });

await db.schema.createTable('users')
    .ifNotExists()
    .addColumn('id', 'text', col => col.primaryKey().onDelete('cascade'))
    .addColumn('name', 'text', col => col.defaultTo(""))
    .addColumn("username", 'text', col => col.notNull().unique())
    .addColumn('password', 'text', col => col.notNull())
    .addColumn('created_at', 'integer', col => col.notNull().defaultTo(sql`unixepoch()`))
    .addColumn('confirmed', 'boolean', col => col.notNull().defaultTo(false))
    .execute();

await db.schema
    .createTable("rooms")
    .ifNotExists()
    .addColumn("id", "text", (col) => col.primaryKey().onDelete("cascade"))
    .addColumn("secret", "text", (col) => col.notNull().unique())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("created_at", "integer", (col) =>
        col.notNull().defaultTo(sql`unixepoch()`)
    )
    .execute();

await db.schema
    .createTable("memberships")
    .ifNotExists()
    .addColumn("user", "text", (col) => col.notNull())
    .addColumn("room", "text", (col) => col.notNull())
    .addPrimaryKeyConstraint("pk_memberships", ["user", "room"])
    .addForeignKeyConstraint("fk_memberships_user", ["user"], "users", ["id"], (cb) =>
        cb.onDelete("cascade")
    )
    .addForeignKeyConstraint("fk_memberships_room", ["room"], "rooms", ["id"], (cb) =>
        cb.onDelete("cascade")
    )
    .execute();

await db.schema
    .createTable("room_requests")
    .ifNotExists()
    .addColumn("from", "text", (col) => col.notNull())
    .addColumn("to", "text", (col) => col.notNull())
    .addColumn("created_at", "integer", (col) =>
        col.notNull().defaultTo(sql`unixepoch()`)
    )
    .addForeignKeyConstraint("fk_room_requests_from", ["from"], "users", ["id"], (cb) =>
        cb.onDelete("cascade")
    )
    .addForeignKeyConstraint("fk_room_requests_to", ["to"], "users", ["id"], (cb) =>
        cb.onDelete("cascade")
    )
    .execute();
