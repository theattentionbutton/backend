import fs from "fs";

// deno-lint-ignore no-explicit-any
export const die = (code: number, ...args: any[]) => {
    console.log(...args);
    process.exit(code);
}

// deno-lint-ignore no-explicit-any
export const fatal = (...args: any[]) => die(1, "fatal:", ...args);

export const loadConfig = () => {
    const configPath = process.env.TAB_CONFIG_PATH || "./config.json";
    console.log(configPath);
    if (!fs.existsSync(configPath)) {
        fatal("Supplied config path did not exist!");
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    console.log(config);
    return config;
}

export const getHttpDescription = (code: number) => {
    return {
        200: "The request was successful.",
        201: "The resource was successfully created.",
        204: "The request was successful, but there is no content to send.",
        400: "The request was invalid or cannot be served.",
        401: "Authentication is required and has failed or has not been provided.",
        403: "You do not have permission to access this resource.",
        404: "The requested resource was not found on this server.",
        405: "The request method is not supported for this resource.",
        408: "The server timed out waiting for the request.",
        418: "I'm a teapot. This is not a coffee machine.",
        429: "Too many requests. Please slow down.",
        500: "An internal server error occurred.",
        502: "Bad gateway. The server received an invalid response.",
        503: "The server is temporarily unavailable or overloaded.",
        504: "The gateway timed out waiting for a response."
    }[code] || "An unknown error occurred.";
}