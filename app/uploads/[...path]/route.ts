
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params;

        // Security: Prevent directory traversal by strictly joining segments
        const filePathParam = pathSegments.join("/");

        // Only allow alphanumeric, dashes, dots, underscores
        if (!/^[a-zA-Z0-9\-\._\/]+$/.test(filePathParam)) {
            return new NextResponse("Forbidden Path", { status: 403 });
        }

        const uploadsDir = path.join(process.cwd(), "public/uploads");
        const filePath = path.join(uploadsDir, filePathParam);

        // Double check that the resolved path is inside uploadsDir
        if (!filePath.startsWith(uploadsDir)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return new NextResponse("Not Found", { status: 404 });
        }

        // Read file
        const fileBuffer = fs.readFileSync(filePath);

        // Determine content type
        const ext = path.extname(filePath).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        else if (ext === '.txt') contentType = 'text/plain';

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable"
            }
        });

    } catch (error) {
        console.error("Error serving static file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
