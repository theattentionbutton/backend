import { Kysely } from "kysely";
import { db } from "./index.ts";
import type { Database, Invite, Room } from "./index.ts";

export const getUserRooms = async (userId: string) => {
    return await db
        .selectFrom('rooms')
        .innerJoin('memberships', 'memberships.room', 'rooms.id')
        .where('memberships.user', '=', userId)
        .select('rooms.id')
        .orderBy('rooms.created_at', 'desc')
        .execute();
}

export const getUserPublicInfo = async (ids: string[]) => {
    return await db
        .selectFrom('users')
        .select(['username as email', 'name'])
        .where('id', 'in', ids)
        .execute();
}

export const getRoomById = async (id: string) => {
    const meta = await db
        .selectFrom('room_meta')
        .selectAll()
        .where('id', '=', id) // Filter by the list of room IDs
        .executeTakeFirst();

    const users = await db
        .selectFrom('memberships')
        .select(['user'])
        .where('room', '=', id)
        .execute()
        .then(wrapped => wrapped.map(i => i.user));

    return {
        meta,
        users: await getUserPublicInfo(users)
    };
}

export const getRoomsById = async (roomIds: string[]) => {
    return await db
        .selectFrom('room_meta')
        .selectAll()
        .where('id', 'in', roomIds) // Filter by the list of room IDs
        .execute();
}

export const getUserInvites = async (username: string) => {
    return await db.selectFrom('invites')
        .selectAll()
        .where('to', '=', username)
        .execute();
}

export const getRoomInvites = async (id: string) => {
    return await db.selectFrom('invites')
        .select(['from', 'to', 'id', 'created_at', 'room_id'])
        .where('room_id', '=', id)
        .orderBy('created_at desc')
        .execute();
}

export const getInviteById = async (id: string) => {
    return await db.selectFrom('invites')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
}

export const createInvite = async (from: string, to: string, room: string) => {
    return await db.insertInto('invites')
        .columns(['from', 'to', 'room_id', 'id'])
        .values({ from, to, room_id: room, id: crypto.randomUUID() })
        .returningAll()
        .executeTakeFirst();
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

        const user = await trx
            .selectFrom('users')
            .select('id')
            .where('username', '=', invite.to)
            .executeTakeFirst()
            .then(itm => itm.id);

        await trx.insertInto('memberships').values({ user, room: invite.room_id }).execute();
    })
}

export const createRoom = async (r: Omit<Room, "created_at">, k: Kysely<Database> = db) => {
    return await k.insertInto('rooms').values(r).execute();
}

export const deleteRoom = async (room: string) => {
    return await db.deleteFrom('rooms').where('id', '=', room).execute();
}

export const addUserToRoom = async (user: string, room: string, k: Kysely<Database> = db) => {
    const query = k.insertInto('memberships').values({ user, room });
    console.log(user, room);
    console.log(query.compile().sql);
    return await query
        .execute();
}