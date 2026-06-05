import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { signToken, verifyPassword, hashPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/schemas";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getSystemStatus() {
    const userCount = await prisma.user.count();
    return { hasUsers: userCount > 0 };
}

async function loginAction(formData: FormData) {
    "use server";
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? "unknown";
    const { success } = rateLimit(ip, "login", { limit: 10, windowSecs: 15 * 60 });
    if (!success) redirect("/login?error=TooManyAttempts");

    const parsed = loginSchema.safeParse({
        username: formData.get("username"),
        password: formData.get("password"),
    });
    if (!parsed.success) redirect("/login?error=InvalidCredentials");

    const { username, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !(await verifyPassword(password, user.password))) {
        redirect("/login?error=InvalidCredentials");
    }

    const token = await signToken({ userId: user.id, username: user.username, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 180,
    });

    redirect("/");
}

async function registerAdminAction(formData: FormData) {
    "use server";
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) redirect("/login?error=PasswordMismatch");

    const userCount = await prisma.user.count();
    if (userCount > 0) redirect("/login?error=SetupAlreadyCompleted");

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
        data: { username, password: hashedPassword, role: "ADMIN", name: "Admin User" },
    });

    const token = await signToken({ userId: user.id, username: user.username, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 180,
    });

    redirect("/");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const { hasUsers } = await getSystemStatus();
    const { error } = await searchParams;

    const errorMessages: Record<string, string> = {
        InvalidCredentials: "Usuario o contraseña incorrectos.",
        TooManyAttempts: "Demasiados intentos. Espera unos minutos.",
        PasswordMismatch: "Las contraseñas no coinciden.",
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--bg)", padding: 16,
        }}>
            <div style={{ width: "100%", maxWidth: 400 }}>

                {/* ── Card ── */}
                <div style={{
                    background: "var(--surface)", borderRadius: 28,
                    border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)",
                    overflow: "hidden",
                }}>
                    {/* Hero verde */}
                    <div style={{
                        background: "var(--primary)",
                        padding: "36px 32px 32px",
                        textAlign: "center",
                    }}>
                        <img
                            src="/icon-192.png"
                            alt="Park4Mikines"
                            style={{
                                width: 68, height: 68, borderRadius: 20,
                                margin: "0 auto 16px",
                                border: "3px solid rgba(255,255,255,0.25)",
                                display: "block",
                            }}
                        />
                        <h1 style={{
                            fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em",
                            color: "#fff", margin: "0 0 6px",
                        }}>
                            Park4Mikines
                        </h1>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", margin: 0, fontWeight: 500 }}>
                            {hasUsers ? "Tu diario de viajes en camper" : "Configuración inicial"}
                        </p>
                    </div>

                    {/* Formulario */}
                    <div style={{ padding: "28px 32px 32px" }}>

                        {/* Error banner */}
                        {error && errorMessages[error] && (
                            <div style={{
                                background: "var(--danger-soft)", color: "var(--danger)",
                                borderRadius: 12, padding: "10px 14px",
                                fontSize: 13, fontWeight: 600, marginBottom: 20,
                            }}>
                                {errorMessages[error]}
                            </div>
                        )}

                        {/* Setup warning */}
                        {!hasUsers && (
                            <div style={{
                                background: "var(--success-soft)", color: "var(--success)",
                                borderRadius: 12, padding: "10px 14px",
                                fontSize: 13, fontWeight: 600, marginBottom: 20,
                            }}>
                                No hay usuarios. Crea la cuenta de administrador para empezar.
                            </div>
                        )}

                        {hasUsers ? (
                            <form action={loginAction} style={{ display: "flex", flexDirection: "column", gap: 16 }} suppressHydrationWarning>
                                <div>
                                    <label className="label" htmlFor="username">Usuario</label>
                                    <input
                                        id="username" name="username" type="text" required
                                        className="input" placeholder="usuario"
                                        suppressHydrationWarning
                                    />
                                </div>
                                <div>
                                    <label className="label" htmlFor="password">Contraseña</label>
                                    <input
                                        id="password" name="password" type="password" required
                                        className="input" placeholder="••••••••"
                                        suppressHydrationWarning
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop: 4 }}>
                                    Iniciar sesión
                                </button>
                            </form>
                        ) : (
                            <form action={registerAdminAction} style={{ display: "flex", flexDirection: "column", gap: 16 }} suppressHydrationWarning>
                                <div>
                                    <label className="label" htmlFor="username">Usuario administrador</label>
                                    <input id="username" name="username" type="text" required className="input" placeholder="admin" />
                                </div>
                                <div>
                                    <label className="label" htmlFor="password">Contraseña</label>
                                    <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="label" htmlFor="confirmPassword">Confirmar contraseña</label>
                                    <input id="confirmPassword" name="confirmPassword" type="password" required className="input" placeholder="••••••••" />
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop: 4 }}>
                                    Crear administrador
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Pie */}
                <p style={{ textAlign: "center", fontSize: 12, color: "var(--faint)", marginTop: 20, fontFamily: "var(--mono)" }}>
                    Park4Mikines · Acceso privado
                </p>
            </div>
        </div>
    );
}
