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