import express from 'express';
import { renderError, sha256 } from '../../utils/index.ts';
import { generate } from "random-words";
import { addUserToRoom, createRoom } from '../../db/rooms.ts';
import { db } from '../../db/index.ts';
import { getUser } from '../../db/auth.ts';
import { hash } from 'argon2';

export const create: express.Handler = async (req, res) => {
    const name: string | undefined = req.body['room-name']?.trim();
    if (!name) return renderError(res, { name: "Bad Request", details: "Room name not supplied." });
    const secret = generate({ exactly: 4, maxLength: 11, minLength: 5, join: ' ' });
    const r = {
        id: crypto.randomUUID(),
        mqtt_topic: await sha256(secret),
        name,
        secret: await hash(secret),
    };

    const user = await getUser(req.session.username);
    await db.transaction().execute(async trx => {
        await createRoom(r, trx);
        await addUserToRoom(user.id, r.id, trx);
    });

    return res.redirect('/account');
}