// deno-lint-ignore no-explicit-any
export const die = (code: number, ...args: any[]) => {
    console.log(...args);
    Deno.exit(code);
}

// deno-lint-ignore no-explicit-any
export const fatal = (...args: any[]) => die(1, ...args);