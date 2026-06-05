export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SettingsClient from "@/components/settings/SettingsClient";
import { Icon } from "@/components/Icon";
import Link from "next/link";

export default async function SettingsPage() {
    const session = await getSession();
    if (!session || !session.userId) redirect("/login");

    const user = await prisma.user.findUnique({ where: { id: session.userId as number } });
    if (!user) redirect("/login");

    const lists = await prisma.configurableList.findMany({ orderBy: { createdAt: "asc" } });

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 80 }}>
            {/* Header (visible en todas las pantallas) */}
            <div style={{
                position: "sticky", top: 0, zIndex: 50,
                background: "var(--surface)", borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 16px", height: 52,
            }}>
                <Link href="/" style={{ textDecoration: "none" }}>
                    <button className="iconbtn iconbtn-ghost" style={{ width: 36, height: 36 }}>
                        <Icon name="back" size={20} />
                    </button>
                </Link>
                <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.02em", color: "var(--text)" }}>
                    Configuración
                </span>
                <div style={{ width: 36 }} />
            </div>

            <main style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 0" }}>
                <SettingsClient user={user} isAdmin={session.role === "ADMIN"} lists={lists} />
            </main>
        </div>
    );
}
