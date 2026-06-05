export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Icon } from "@/components/Icon";
import { LucideIcon } from "@/components/LucideIcon";
import { coverPhoto } from "@/lib/placeTypes";

export default async function DashboardPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const userId = session.userId as number;
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";
    const name = String(session.name || session.username);

    const [lists, pernoctaCount, favorites] = await Promise.all([
        prisma.configurableList.findMany({
            where: { isVisible: true },
            orderBy: { createdAt: "asc" },
        }),
        prisma.pernocta.count({ where: { userId } }),
        prisma.spot.findMany({
            where: { favoritedBy: { some: { userId } } },
            include: { images: true },
            take: 8,
            orderBy: { updatedAt: "desc" },
        }),
    ]);

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 88 }}>
            <div style={{ maxWidth: 520, margin: "0 auto" }}>

                {/* ── Header ── */}
                <div style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    padding: "56px 16px 0",
                }}>
                    <div>
                        <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, margin: "0 0 2px" }}>
                            {timeGreeting}
                        </p>
                        <h1 style={{
                            fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em",
                            color: "var(--text)", margin: 0,
                        }}>
                            ¡Hola, {name}! 👋
                        </h1>
                    </div>
                    <Link href="/settings" style={{ textDecoration: "none", marginTop: 4 }}>
                        <button className="iconbtn iconbtn-surface" style={{ width: 40, height: 40 }}>
                            <Icon name="settings" size={20} />
                        </button>
                    </Link>
                </div>

                <div style={{ padding: "20px 16px 0" }}>

                    {/* ── Buscador (link al mapa) ── */}
                    <Link href="/pois" style={{ textDecoration: "none", display: "block", marginBottom: 16 }}>
                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            background: "var(--surface)", border: "1.5px solid var(--border)",
                            borderRadius: 99, padding: "12px 16px", boxShadow: "var(--shadow-sm)",
                        }}>
                            <Icon name="search" size={16} style={{ color: "var(--faint)", flexShrink: 0 }} />
                            <span style={{ fontSize: 14, color: "var(--faint)" }}>
                                Busca ciudad, lugar o dirección...
                            </span>
                        </div>
                    </Link>

                    {/* ── Banner pernocta ── */}
                    <Link href="/pois" style={{ textDecoration: "none", display: "block", marginBottom: 20 }}>
                        <div style={{
                            background: "var(--primary)", borderRadius: 20, padding: "18px 20px",
                            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                        }}>
                            <div>
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    background: "rgba(255,255,255,0.18)", borderRadius: 99,
                                    padding: "3px 10px", marginBottom: 8,
                                }}>
                                    <Icon name="moon" size={11} style={{ color: "rgba(255,255,255,0.85)" }} />
                                    <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "0.06em" }}>
                                        PERNOCTA
                                    </span>
                                </div>
                                <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 4px" }}>
                                    Dormir cerca esta noche
                                </p>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", margin: 0 }}>
                                    Explora los mejores sitios para pernoctar
                                </p>
                            </div>
                            <div style={{
                                width: 44, height: 44, borderRadius: 99, flexShrink: 0,
                                background: "rgba(255,255,255,0.18)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <Icon name="navigate" size={20} style={{ color: "#fff" }} />
                            </div>
                        </div>
                    </Link>

                    {/* ── Grid de acciones ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 28 }}>
                        <ActionCard
                            href="/pois"
                            icon="Map"
                            iconBg="var(--primary)"
                            title="Explorar mapa"
                            sub="Mapa y lista"
                        />
                        <ActionCard
                            href="/pois"
                            icon="Plus"
                            iconBg="var(--primary)"
                            title="Añadir lugar"
                            sub="Rápido o guiado"
                        />
                        <ActionCard
                            href="/pernoctas"
                            icon="Moon"
                            iconBg="#4F46E5"
                            title="Pernoctas"
                            sub={pernoctaCount > 0 ? `${pernoctaCount} registradas` : "Sin registros aún"}
                        />
                        {lists.map(list => (
                            <ActionCard
                                key={list.id}
                                href={`/lists/${list.type}`}
                                icon={list.icon ?? "list"}
                                iconBg="#C2552E"
                                title={list.name}
                                sub="Checklist"
                            />
                        ))}
                        {lists.length === 0 && (
                            <ActionCard
                                href="/settings"
                                icon="Settings"
                                iconBg="var(--muted)"
                                title="Ajustes"
                                sub="Configuración"
                            />
                        )}
                    </div>

                    {/* ── Tus favoritos ── */}
                    {favorites.length > 0 && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                <h2 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: 0 }}>
                                    Tus favoritos
                                </h2>
                                <Link href="/pois" style={{ textDecoration: "none", fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>
                                    Ver todos
                                </Link>
                            </div>
                            <div style={{
                                display: "flex", gap: 12,
                                overflowX: "auto", paddingBottom: 4,
                                scrollbarWidth: "none",
                                marginLeft: -16, marginRight: -16,
                                paddingLeft: 16, paddingRight: 16,
                            }}>
                                {favorites.map(spot => (
                                    <Link
                                        key={spot.id}
                                        href={`/pois?spot=${spot.id}`}
                                        style={{ textDecoration: "none", flexShrink: 0 }}
                                    >
                                        <div style={{
                                            width: 155, borderRadius: 16, overflow: "hidden",
                                            background: "var(--surface)", border: "1px solid var(--border)",
                                            boxShadow: "var(--shadow-sm)",
                                        }}>
                                            <div style={{
                                                height: 96, background: "var(--surface-2)",
                                                backgroundImage: `url(${coverPhoto(spot.images)})`,
                                                backgroundSize: "cover", backgroundPosition: "center",
                                            }} />
                                            <div style={{ padding: "10px 12px 12px" }}>
                                                <p style={{
                                                    fontSize: 13, fontWeight: 700, color: "var(--text)",
                                                    margin: 0, overflow: "hidden",
                                                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                                                }}>
                                                    {spot.title}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

function ActionCard({ href, icon, iconBg, title, sub }: {
    href: string;
    icon: string;
    iconBg: string;
    title: string;
    sub: string;
}) {
    const lucideName = icon.charAt(0).toUpperCase() + icon.slice(1);
    return (
        <Link href={href} style={{ textDecoration: "none" }}>
            <div className="placecard" style={{ padding: "16px 16px 18px" }}>
                <div style={{
                    width: 46, height: 46, borderRadius: 14, background: iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
                }}>
                    <LucideIcon name={lucideName} size={22} style={{ color: "#fff" }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", margin: "0 0 2px" }}>
                    {title}
                </p>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                    {sub}
                </p>
            </div>
        </Link>
    );
}
