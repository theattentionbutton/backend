import { sql } from "kysely";
import type { User } from './index.ts';
import { db } from "./index.ts";
import { timeMs } from "../utils/time.ts"

export const getUser = async (username: string, confirmed?: 0 | 1) => {
    const query = db.selectFrom('users').selectAll().where('username', '=', username)
    if (typeof confirmed !== 'undefined') {
        return await query.where('confirmed', '=', Number(confirmed)).executeTakeFirst();
    }
    return await query.executeTakeFirst();
}

export const deleteUnconfirmedUsers = async () => {
    return await db.deleteFrom('users')
        .where('confirmed', '=', 0)
        .where(sql<boolean>`created_at - unixepoch() > ${timeMs({ h: 1 }) / 1000}`)
        .execute();
}

export const createUser = async (args: User) => {
    return await db.insertInto('users')
        .values(args)
        .returningAll()
        .executeTakeFirst();
}

export const checkVerificationEntry = async (code: string) => {
    return await db.selectFrom('users')
        .selectAll()
        .where('verification_code', '=', code)
        .where('confirmed', '=', 0)
        .executeTakeFirst();
}

export const confirmUser = async (username: string) => {
    return await db.updateTable('users').set({ confirmed: 1 }).where('id', '=', username).execute();
}