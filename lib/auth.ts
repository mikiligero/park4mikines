import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signToken, verifyToken } from "./token";

export { signToken, verifyToken };

export async function hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(plain: string, hashed: string) {
    return await bcrypt.compare(plain, hashed);
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    if (!token) return null;
    return await verifyToken(token);
}

export async function login() {
    "use server";
    // Logic to be implemented in server action or API route
    // utilising this lib
}


