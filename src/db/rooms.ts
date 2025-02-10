import { Kysely } from "kysely";
import { db } from "./index.ts";
import type { Database, Invite, Room } from "./index.ts";

export const getUserRooms = async (userId: string) => {
    return await db
        .selectFrom('rooms')
        .innerJoin('memberships', 'memberships.room', 'rooms.id')
        .where('memberships.user', '=', userId)
        .select('rooms.id')
        .orderBy('rooms.created_at', 'asc')
        .execute();
}

export const getRoomsById = async (roomIds: string[]) => {
    return await db
        .selectFrom('room_user_count')
        .select(['room_id', 'room_name', 'user_count'])
        .where('room_id', 'in', roomIds) // Filter by the list of room IDs
        .execute();
}

export const getUserInvites = async (username: string) => {
    return await db.selectFrom('invites')
        .select(['from', 'id', 'created_at', 'room_id'])
        .where('to', '=', username)
        .execute();
}

export const rejectInvite = async (invite: string) => {
    return await db.deleteFrom('invites').where('id', '=', invite).execute();
}

export const acceptInvite = async (id: string) => {
    return await db.transaction().execute(async trx => {
        const invite = await trx
            .deleteFrom('invites')
            .where('id', '=', id)
            .returningAll()
            .executeTakeFirst() as Invite;

        await trx.insertInto('memberships').values({
            room: invite.room_id,
            user: invite.to
        }).execute();
    })
}

export const createRoom = async (r: Omit<Room, "created_at">, k: Kysely<Database> = db) => {
    return await k.insertInto('rooms').values(r).execute();
}

export const addUserToRoom = async (user: string, room: string, k: Kysely<Database> = db) => {
    const query = k.insertInto('memberships').values({ user, room });
    console.log(user, room);
    console.log(query.compile().sql);
    return await query
        .execute();
}