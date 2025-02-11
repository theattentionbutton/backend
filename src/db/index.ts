import { ForeignKeyConstraintBuilder, Kysely, sql, SqliteDialect } from "kysely";
import SQLite from 'better-sqlite3';

export interface Database {
    users: User;
    rooms: Room;
    memberships: Membership;
    invites: Invite;
    room_meta: {
        id: string,
        name: string,
        count: number,
        owner: string,
        secret: string
    }
}

export interface User {
    id: string;
    name: string;
    username: string;
    verification_code: string;
    password: string;
    created_at: number;
    confirmed: number; /* SQLite3 does not support bools. */
}

export interface Room {
    id: string;
    secret: string;
    name: string;
    created_at: number;
    mqtt_topic: string;
    owner: string;
}

export interface Membership {
    user: string;
    room: string;
}

export interface Invite {
    from: string;
    to: string;
    created_at: number;
    id: string;
    room_id: string;
}

const dialect = new SqliteDialect({
    database: new SQLite('./tab-backend.db'),
});

export const db = new Kysely<Database>({ dialect });
const onDeleteCascade = (cb: ForeignKeyConstraintBuilder) => cb.onDelete('cascade');

await db.schema.createTable('users')
    .ifNotExists()
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('name', 'text', col => col.defaultTo(""))
    .addColumn("username", 'text', col => col.notNull().unique())
    .addColumn("verification_code", 'text', col => col.notNull().unique())
    .addColumn('password', 'text', col => col.notNull())
    .addColumn('created_at', 'integer', col => col.defaultTo(sql`(unixepoch())`))
    .addColumn('confirmed', 'integer', col => col.notNull().defaultTo(0)).execute();

await db.schema
    .createTable("rooms")
    .ifNotExists()
    .addColumn("id", "text", (col) => col.primaryKey())
    .addColumn("secret", "text", (col) => col.notNull().unique())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn('owner', 'text', (col) => col.notNull())
    .addColumn("mqtt_topic", "text", (col) => col.notNull().unique())
    .addColumn("created_at", "integer", (col) => col.defaultTo(sql`(unixepoch())`))
    .addForeignKeyConstraint('rooms_owner_fk', ['owner'], 'users', ['id'], onDeleteCascade)
    .execute();

await db.schema
    .createTable("memberships")
    .ifNotExists()
    .addColumn("user", "text", (col) => col.notNull())
    .addColumn("room", "text", (col) => col.notNull())
    .addPrimaryKeyConstraint("pk_memberships", ["user", "room"])
    .addForeignKeyConstraint("fk_memberships_user", ["user"], "users", ["id"], onDeleteCascade)
    .addForeignKeyConstraint("fk_memberships_room", ["room"], "rooms", ["id"], onDeleteCascade)
    .execute();

await db.schema
    .createTable("invites")
    .ifNotExists()
    .addColumn("from", "text", (col) => col.notNull())
    .addColumn("to", "text", (col) => col.notNull())
    .addColumn("id", "text", (col) => col.notNull().unique())
    .addColumn("room_id", "text", (col) => col.notNull())
    .addColumn("created_at", "integer", (col) => col.defaultTo(sql`(unixepoch())`))
    .addForeignKeyConstraint("fk_invites_from", ["from"], "users", ["username"], onDeleteCascade)
    .addForeignKeyConstraint('fk_invite_room_id', ['room_id'], 'rooms', ['id'], onDeleteCascade)
    .execute();

await db.schema
    .createView('room_meta')
    .ifNotExists()
    .as(db.selectFrom('memberships')
        .innerJoin('rooms', 'rooms.id', 'memberships.room')
        .select([
            'rooms.id as id',
            'rooms.name as name',
            'rooms.owner as owner',
            'rooms.secret as secret',
            sql<number>`count(memberships.user)`.as('count')
        ])
        .groupBy('rooms.id')
    )
    .execute();