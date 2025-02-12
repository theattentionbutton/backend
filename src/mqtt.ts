import Aedes from "aedes";
import tls from "tls";
import net from "net";
import { config } from './utils/config.ts';
import { getUser } from "./db/auth.ts";
import type { User } from "./db/index.ts";
import { getUserRooms } from "./db/rooms.ts";
import fs from "fs";
import { z } from "zod";
import { fromError } from "zod-validation-error";

export const createMqtt = () => {
    const mqtt = Aedes.createBroker();

    const userClients = new Map<string, User>();
    const decoder = new TextDecoder('UTF-8');
    mqtt.authenticate = async (client, username, password, callback) => {
        if (!username || !password) return callback(null, false);

        const user = await getUser(username);
        if (!user) return callback(null, false);
        const isUserValid = await getUserRooms(user.id)
            .then(rooms => rooms.some(
                room => room.secret === decoder.decode(password)
            ));

        if (isUserValid) userClients.set(client.id, user);
        console.debug(`[debug] client ${client.id} authed for user ${user.username}`);
        return callback(null, isUserValid);
    };

    const isClientAllowed = async (client: Aedes.Client, topic: string) => {
        const matched = topic.match(/attnbtn\/messages\/([0-9a-f]{64})/);
        if (!matched || !matched[1]) {
            return ["No such room", null];
        }
        const parsedTopic = matched[1];
        if (!client.id || !userClients.has(client.id)) ["Not authenticated", null];
        const user = userClients.get(client.id);
        const rooms = await getUserRooms(user.id);
        if (rooms.some(itm => itm.mqtt_topic === parsedTopic)) {
            console.log(`[debug] client ${client.id} authorized for ${parsedTopic} as ${user.username}`);
            return [null, true];
        }

        return ["Unknown error", null];
    }

    mqtt.authorizeSubscribe = async (client, sub, callback) => {
        if (!/attnbtn\/messages\/[0-9a-f]{64}/.test(sub.topic)) {
            return callback(new Error("Invalid topic"), null);
        }

        const [msg, success] = await isClientAllowed(client, sub.topic);
        if (!success) {
            const err = new Error((typeof msg === 'string' && msg.length) ? msg : 'Unknown error occurred.');
            return callback(err, null);
        }
        return callback(null, sub);
    };

    const decodePayload = (payload: string | Buffer<ArrayBufferLike>) => {
        console.log(payload.length);
        if (typeof payload !== 'string') {
            return decoder.decode(payload);
        }
        return payload;
    }


    const schema = z.string().refine(
        (val) => {
            const match = val.match(/^#([^#]+)#([^#]+)#$/);
            if (!match) return false;

            const [, str, email] = match;
            return z.string().email().safeParse(email).success && str.length <= 24;
        },
        { message: "Invalid format or constraints not met" }
    );

    mqtt.authorizePublish = async (client, packet, callback) => {
        if (packet.topic.startsWith('$SYS')) {
            return callback(new Error('$SYS' + ' topic is reserved'))
        }
        const [msg, success] = await isClientAllowed(client, packet.topic);
        if (!success) {
            const err = new Error((typeof msg === 'string' && msg.length) ? msg : 'Unknown error occurred.');
            return callback(err);
        }

        const decoded = decodePayload(packet.payload);
        console.debug(`[debug] payload: \`${decoded}\``);
        if (decoded.length > 512) return callback(new Error("Packet too long."));
        const parsed = schema.safeParse(decoded);
        if (!parsed.success && decoded !== "qos0") {
            return callback(fromError(parsed.error));
        }
        console.log(`[debug] allowed ${decoded}`);
        return callback(null);
    }

    mqtt.addListener('keepaliveTimeout', (client: Aedes.Client) => {
        console.debug(`[debug] client ${client.id} timed out`)
    });

    mqtt.addListener('ping', (packet: Aedes.PingreqPacket, client: Aedes.Client) => {
        console.debug(`[debug] client ${client.id} sent a ${packet.cmd}`);
    })

    mqtt.addListener('clientError', (client, error) => {
        console.debug(`[debug] client ${client.id} error {${error}}`);
    })

    return {
        instance: mqtt,
        createListener() {
            return config.mqttTls
                ? tls.createServer(
                    {
                        key: fs.readFileSync(config.keyPath),
                        cert: fs.readFileSync(config.certPath),
                        ca: fs.readFileSync(config.caPath),
                        requestCert: true,
                        rejectUnauthorized: true, // Ensure client certs are validated
                    },
                    (socket) => mqtt.handle(socket)
                )
                : net.createServer((socket) => mqtt.handle(socket));
        }
    }
}