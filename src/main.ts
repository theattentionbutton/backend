import { config } from './utils/config.ts';
import { createApp } from "./http/app.ts";
import { createMqtt } from './mqtt.ts';

const app = createApp();

if (process.env.TAB_ENV !== 'dev') app.set('trust proxy', 1);

app.listen(config.httpPort, config.hostname, () => {
    console.log(`HTTP listening on http://${config.hostname}:${config.httpPort}`);
});

const mqtt = createMqtt();
const listener = mqtt.createListener();

listener.listen(config.mqttPort, () => {
    const protocol = config.mqttTls ? "mqtts" : "mqtt";
    console.log(`MQTT broker listening on ${protocol}://0.0.0.0:${config.mqttPort}`);
})