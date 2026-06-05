const ts = () => new Date().toISOString();

export const logger = {
    info: (msg: string, ctx?: object) => console.log(`[${ts()}] INFO  ${msg}`, ctx ?? ""),
    warn: (msg: string, ctx?: object) => console.warn(`[${ts()}] WARN  ${msg}`, ctx ?? ""),
    error: (msg: string, ctx?: object) => console.error(`[${ts()}] ERROR ${msg}`, ctx ?? ""),
};
