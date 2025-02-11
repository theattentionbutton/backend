import express from 'express';
import { parseBody, renderError, sha256, UUID_REGEX } from '../../utils/index.ts';
import { generate } from "random-words";
import { acceptInvite, addUserToRoom, createInvite, createRoom, deleteRoom, getInviteById, getRoomById, getRoomInvites, getUserInvites, rejectInvite, removeUserFromRoom } from '../../db/rooms.ts';
import { db } from '../../db/index.ts';
import { z } from "zod";
import { sendEmail } from '../../mail.ts';

export const create: express.Handler = async (req, res) => {
    const name: string | undefined = req.body['room-name']?.trim();
    if (!name) return renderError(res, { name: "Bad Request", details: "Room name not supplied." });
    const secret = generate({ exactly: 4, maxLength: 11, minLength: 5, join: ' ' });

    const user = req.session.user!;
    const r = {
        id: crypto.randomUUID(),
        mqtt_topic: await sha256(secret),
        name,
        secret,
        owner: user.id
    };

    await db.transaction().execute(async trx => {
        await createRoom(r, trx);
        await addUserToRoom(user.id, r.id, trx);
    });

    return res.redirect('/dashboard');
}

const err400 = (res: express.Response, details = 'Invalid request data.') => renderError(res, {
    code: 400,
    details,
    name: "Bad Request"
});

export const manage: express.Handler = async (req, res) => {
    const uuid = req.params.uuid;

    if (!uuid || !uuid.trim() || !UUID_REGEX.test(uuid)) return err400(res, "Invalid link.");
    const room = await getRoomById(uuid);
    if (!room) return err400(res, "No such room.");
    const count = room.meta.count <= 1 ? '' : ` (${room.meta.count} members)`;
    const pendingInvites = getRoomInvites(room.meta.id);
    return res.render('manage-room', {
        room,
        pendingInvites,
        title: `Room "${room.meta.name}"`,
        heading: `Room "${room.meta.name}"${count}`,
        isOwner: room.meta.owner === req.session.user.id,
        username: req.session.user.username,
        user_id: req.session.user.id,
        secret_parts: room.meta.secret.split(' ')
    });
}

const inviteSchema = z.object({
    to: z.string().email(),
    id: z.string().uuid()
})

export const inviteUser: express.Handler = async (req, res) => {
    const sender = req.session.user;
    if (!sender) throw new Error("No user present in auth-only route.");
    const body = await parseBody(inviteSchema, res, { to: req.body['invite-email'], id: req.body['id'] });
    if (!body) return;
    const room = await getRoomById(body.id);
    if (!room || room.meta.owner !== sender.id || sender.username === body.to) return err400(res, "Invalid invite.");
    const existing = await getUserInvites(body.to)
        .then(invites => invites.filter(itm => itm.room_id === body.id));
    if (existing.length) return err400(res, "This user has already been invited to this room.");
    await createInvite(sender.username, body.to, body.id);
    await sendEmail({
        subject: `The Attention Button - room invite`,
        ctx: {
            sender: sender.username,
            to: body.to,
            room: room.meta.name
        },
        to: body.to,
        type: 'room-invite'
    })
    return res.redirect(`/rooms/${body.id}`);
}

export const del: express.Handler = async (req, res) => {
    if (!req.body.id || !req.body.id.trim() || !UUID_REGEX.test(req.body.id)) return err400(res, "Invalid deletion request.");
    const room = await getRoomById(req.body.id);
    if (!room || room.meta.owner !== req.session.user.id) return err400(res, "You cannot delete this room as you do not own it.");
    await deleteRoom(req.body.id);
    return res.redirect('/dashboard');
}

const inviteActions = ['accept', 'reject'] as const;
const inviteActionSchema = z.object({
    id: z.string().uuid(),
    action: z.enum(inviteActions),
})

export const handleInvite: express.Handler = async (req, res) => {
    const body = await parseBody(inviteActionSchema, res, req.body);
    const invite = await getInviteById(body.id);
    if (!invite || invite.to !== req.session.user.username) return err400(res, "Invalid invite.");
    switch (body.action) {
        case 'accept':
            await acceptInvite(invite.id);
            break;
        case 'reject':
            await rejectInvite(invite.id);
            break;
    }
    return res.redirect('/dashboard');
}

const removeUserSchema = z.object({
    room_id: z.string().uuid(),
    user_id: z.string().uuid()
});

export const removeUser: express.Handler = async (req, res) => {
    const currentUser = req.session.user;
    const body = await parseBody(removeUserSchema, res, req.body);
    if (!body) return;
    const room = await getRoomById(body.room_id);
    if (!room) return err400(res, "Invalid room ID");
    if (currentUser.id === room.meta.owner && currentUser.id === body.user_id) return err400(res, "Owners cannot remove themselves!");
    if (currentUser.id !== room.meta.owner && currentUser.id !== body.user_id) return err400(res, "Invalid room details.");
    await removeUserFromRoom(body.user_id, body.room_id);
    if (currentUser.id === room.meta.owner) {
        return res.redirect(`/rooms/${room.meta.id}`);
    }
    return res.redirect('/dashboard');
}