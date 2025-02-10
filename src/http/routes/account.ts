import express from "express";
import "../../utils/express-session.d.ts";
import { getRoomsById, getUserInvites, getUserRooms } from "../../db/rooms.ts";
import { updatePwSchema } from "../../schemas/auth.ts";
import { fromError } from "zod-validation-error";
import { renderError } from "../../utils/index.ts";
import { getUser, updatePassword } from "../../db/auth.ts";
import { verify } from "argon2";

export const get: express.Handler = async (req, res, next) => {
    const user = await getUser(req.session.username);
    const userRooms = await getUserRooms(user.id);
    const invites = await getUserInvites(user.id);
    const invitedRooms = invites.map(i => i.room_id);
    const rooms = await getRoomsById(userRooms.map(itm => itm.id).concat(invitedRooms));
    const roomMap = Object.groupBy(rooms, (itm) => itm.room_id);

    console.log({ userRooms, rooms });

    return res.render('dashboard', {
        title: "Dashboard",
        username: req.session.username,
        rooms: rooms.filter(room => !invitedRooms.includes(room.room_id)),
        invites: invites.map(invite => ({
            id: invite.id,
            from: invite.from,
            roomName: roomMap[invite.room_id]
        }))
    });
}

export const updatePw: express.Handler = async (req, res, next) => {
    const parseResult = await updatePwSchema.safeParseAsync(req.body);
    if (!parseResult.success) {
        return renderError(res, {
            details: fromError(parseResult.error).toString(),
            name: "Validation error",
        })
    }
    const body = parseResult.data;
    const username = req.session.username!;
    const user = await getUser(username);
    if (!user) return next(new Error('An internal server error occurred.'));
    if (!await verify(user.password, body.oldPass)) {
        return renderError(res, {
            name: "Password error",
            details: "Current password was incorrect."
        })
    }

    await updatePassword(username, body.newPass);
    return res.redirect('/account');
}

export const logout: express.Handler = (req, res) => {
    delete req.session.username;
    req.session.save();
    return res.redirect('/');
}