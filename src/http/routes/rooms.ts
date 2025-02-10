import express from 'express';
import { renderError, sha256, UUID_REGEX } from '../../utils/index.ts';
import { generate } from "random-words";
import { addUserToRoom, createRoom, getRoomById } from '../../db/rooms.ts';
import { db } from '../../db/index.ts';
import { hash } from 'argon2';

export const create: express.Handler = async (req, res) => {
    const name: string | undefined = req.body['room-name']?.trim();
    if (!name) return renderError(res, { name: "Bad Request", details: "Room name not supplied." });
    const secret = generate({ exactly: 4, maxLength: 11, minLength: 5, join: ' ' });

    const user = req.session.user!;
    const r = {
        id: crypto.randomUUID(),
        mqtt_topic: await sha256(secret),
        name,
        secret: await hash(secret),
        owner: user.id
    };

    await db.transaction().execute(async trx => {
        await createRoom(r, trx);
        await addUserToRoom(user.id, r.id, trx);
    });

    return res.redirect('/account');
}

export const manage: express.Handler = (req, res) => {
    const uuid = req.params.uuid;
    const err400 = () => renderError(res, {
        code: 400,
        details: "Invalid room id.",
        name: "Bad Request"
    });

    if (!uuid || !uuid.trim() || !UUID_REGEX.test(uuid)) return err400();
    const room = getRoomById(uuid);
    return res.render('manage-room', { room });
}