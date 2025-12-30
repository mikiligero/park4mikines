import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("session")?.value;
    const verifiedToken = token && (await verifyToken(token));

    if (!verifiedToken && !request.nextUrl.pathname.startsWith("/login")) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (verifiedToken && request.nextUrl.pathname.startsWith("/login")) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|uploads).*)"],
};
