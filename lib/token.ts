import { SignJWT, jwtVerify } from "jose";

function getKey() {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error("JWT_SECRET environment variable is required");
    return new TextEncoder().encode(jwtSecret);
}

export async function signToken(payload: Record<string, unknown>) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("180d")
        .sign(getKey());
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, getKey(), {
            algorithms: ["HS256"],
        });
        return payload;
    } catch {
        return null;
    }
}