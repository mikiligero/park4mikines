import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import SettingsClient from "@/components/settings/SettingsClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
    const session = await getSession();
    if (!session || !session.userId) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.userId as number }
    });

    if (!user) redirect("/login");

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pl-64">
            {/* Mobile Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-30 flex items-center gap-3 md:hidden">
                <Link href="/" className="p-2 -ml-2 text-gray-600 dark:text-gray-300">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Configuración</h1>
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
                <div className="hidden md:block mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona tu perfil y preferencias de la aplicación.</p>
                </div>



                <SettingsClient
                    user={user}
                    isAdmin={session.role === "ADMIN"}
                />
            </main>
        </div>
    );
}
