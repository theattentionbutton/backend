import express from "express";
import "../../utils/express-session.d.ts";
import { getRoomsById, getUserInvites, getUserRooms } from "../../db/rooms.ts";
import { updatePwSchema } from "../../schemas/auth.ts";
import { parseBody, renderError } from "../../utils/index.ts";
import { getUser, updatePassword } from "../../db/auth.ts";
import { verify } from "argon2";

export const get: express.Handler = async (req, res, next) => {
    const user = req.session.user!;
    const userRooms = await getUserRooms(user.id);
    const invites = await getUserInvites(user.username);
    const invitedRooms = invites.map(i => i.room_id);
    const rooms = await getRoomsById(userRooms.map(itm => itm.id).concat(invitedRooms));
    const roomMap = Object.fromEntries(rooms.map(itm => [itm.id, itm.name]));
    const filtered = rooms
        .filter(room => !invitedRooms.includes(room.id))
        .map(room => ({ ...room, isOwner: room.owner === user.id }));

    return res.render('dashboard', {
        title: "Dashboard",
        username: user.username,
        rooms: filtered,
        invites: invites.map(invite => ({
            id: invite.id,
            from: invite.from,
            room_name: roomMap[invite.room_id]
        }))
    });
}

export const updatePw: express.Handler = async (req, res, next) => {
    const body = await parseBody(updatePwSchema, res, req.body);
    if (!body) return;
    const user = req.session.user!;
    if (!user) return next(new Error('An internal server error occurred.'));
    if (!await verify(user.password, body.oldPass)) {
        return renderError(res, {
            name: "Password error",
            details: "Current password was incorrect."
        })
    }

    await updatePassword(user.username, body.newPass);
    req.session.user = await getUser(user.username);
    req.session.save();
    return res.redirect('/dashboard');
}

export const logout: express.Handler = (req, res) => {
    delete req.session.user;
    req.session.save();
    return res.redirect('/');
}