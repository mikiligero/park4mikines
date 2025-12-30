import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { signToken, verifyPassword, hashPassword } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getSystemStatus() {
    const userCount = await prisma.user.count();
    return { hasUsers: userCount > 0 };
}

async function loginAction(formData: FormData) {
    "use server";
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

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
    });

    redirect("/");
}

async function registerAdminAction(formData: FormData) {
    "use server";
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
        redirect("/login?error=PasswordMismatch");
    }

    // Double check to prevent race conditions
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        redirect("/login?error=SetupAlreadyCompleted");
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            username,
            password: hashedPassword,
            role: "ADMIN",
            name: "Admin User",
        },
    });

    const token = await signToken({ userId: user.id, username: user.username, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });

    redirect("/");
}

export default async function LoginPage() {
    const { hasUsers } = await getSystemStatus();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Park4Mikines
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {hasUsers ? "Acceso exclusivo para miembros" : "Configuración Inicial del Sistema"}
                    </p>
                </div>

                {hasUsers ? (
                    <form action={loginAction} className="mt-8 space-y-6" suppressHydrationWarning>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Usuario
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="usuario"
                                    suppressHydrationWarning
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="••••••••"
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                        >
                            Iniciar Sesión
                        </button>
                    </form>
                ) : (
                    <form action={registerAdminAction} className="mt-8 space-y-6" suppressHydrationWarning>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                No se han detectado usuarios. Cree la cuenta de administrador para comenzar.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Usuario Administrador
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="admin"
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                        >
                            Crear Administrador
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
