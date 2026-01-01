import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Double-check to exclude static files and internal Next.js paths within the function
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/images") ||
        pathname.startsWith("/uploads") ||
        pathname === "/favicon.ico" ||
        pathname === "/manifest.json"
    ) {
        return NextResponse.next();
    }

    const token = request.cookies.get("session")?.value;
    const verifiedToken = token && (await verifyToken(token));

    if (!verifiedToken && !pathname.startsWith("/login")) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    if (verifiedToken && pathname.startsWith("/login")) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Added manifest.json and commonly used static extensions to the exclusion regex
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|images|uploads|.*\\.png$).*)"],
};
