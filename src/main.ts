import express from "express";
import { Liquid } from "liquidjs";
import net from "net";
import tls from "tls";
import path from "path";
import Aedes from "aedes";
import { loadConfig } from "./utils";
import fs from "fs";

const config = await loadConfig();

const app = express();
const liquid = new Liquid({ extname: ".liquid" });
app.engine("liquid", liquid.express());
app.set("view engine", "liquid");
app.set("views", path.resolve("./templates"));

// Serve static files
app.use(express.static("./public"));

// Define routes
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/store", (_, res) => {
    return res.redirect(config.storeUrl);
})

// Start the HTTP server
const httpPort = Number(config.httpPort) || 3000;
const httpServer = app.listen(httpPort, config.hostname || "0.0.0.0", () => {
    console.log(`HTTP listening on http://${config.hostname || "0.0.0.0"}:${httpPort}`);
});

// Set up Aedes MQTT broker
const mqtt = new Aedes();

mqtt.authenticate = (client, username, password, callback) => {
    if (!username || !password) {
        return callback(null, false);
    }

    if (
        username === "admin" &&
        password.toString() === "admin"
    ) {
        return callback(null, true);
    }

    return callback(null, false);
};

mqtt.authorizeSubscribe = (client, sub, callback) => {
    if (!/attnbtn\/messages\/[0-9a-f]{64}/.test(sub.topic)) {
        return callback(new Error("Not authorized to subscribe to topic"), null);
    }

    console.log('here');
    return callback(null, sub);
};

mqtt.authorizePublish = (client, packet, callback) => {
    if (packet.length) console.log(`Packet length: ${packet.length}`);
    let decoded = packet.payload;
    if (typeof packet.payload !== 'string') {
        decoded = new TextDecoder().decode(packet.payload);
    }
    console.log(decoded);
    return callback(null);
}

// Create TCP or TLS server for MQTT
const mqttPort = config.mqttPort || 1883;
const mqttServer = config.mqttTls
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

mqttServer.listen(mqttPort, "0.0.0.0", () => {
    console.log(
        `MQTT broker listening on ${config.mqttTls ? "tls" : "tcp"}://0.0.0.0:${mqttPort}`
    );
});
