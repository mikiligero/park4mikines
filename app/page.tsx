import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
    Map as MapIcon,
    Moon,
    Settings,
} from "lucide-react";
import * as LucideIcons from "lucide-react";

export default async function DashboardPage() {
    const session = await getSession();
    if (!session) redirect("/login");

    const lists = await prisma.configurableList.findMany({
        where: { isVisible: true },
        orderBy: { createdAt: "asc" }
    });

    const staticCards = [
        {
            title: "Puntos de Interés",
            description: "Explora el mapa y añade nuevos lugares.",
            href: "/pois",
            icon: MapIcon,
            color: "from-blue-500 to-indigo-600",
            shadow: "shadow-blue-500/20"
        },
        {
            title: "Pernoctas",
            description: "Registra y gestiona tus noches de campamento.",
            href: "/pernoctas",
            icon: Moon,
            color: "from-indigo-500 to-violet-600",
            shadow: "shadow-indigo-500/20"
        }
    ];

    const dynamicCards = lists.map(list => {
        const IconComponent = (LucideIcons as any)[list.icon] || LucideIcons.List;
        return {
            title: list.name,
            description: "Gestiona tu lista de verificación y cosas por hacer.",
            href: `/lists/${list.type}`,
            icon: IconComponent,
            color: "from-pink-500 to-rose-500",
            shadow: "shadow-pink-500/20"
        }
    });

    const settingsCard = {
        title: "Configuración",
        description: "Ajustes de la aplicación y tu perfil.",
        href: "/settings",
        icon: Settings,
        color: "from-gray-600 to-slate-800 dark:from-gray-700 dark:to-gray-900",
        shadow: "shadow-gray-500/20"
    };

    const allCards = [...staticCards, ...dynamicCards, settingsCard];

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 p-6 md:p-12 pb-24">
            <header className="mb-12 mt-12 lg:mt-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-3 tracking-tight">
                    ¡Hola, {String(session.name || session.username)}! 👋
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl">
                    Bienvenido de nuevo a Park4Mikines. ¿Qué aventura te espera hoy?
                </p>
            </header>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-in slide-in-from-bottom-8 duration-700 fade-in delay-150 fill-mode-both">
                {allCards.map((card, idx) => (
                    <Link
                        key={idx}
                        href={card.href}
                        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md border border-white/40 dark:border-gray-800/60 shadow-md sm:shadow-xl shadow-black/5 hover:shadow-xl sm:hover:shadow-2xl hover:-translate-y-1 sm:hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${card.color} opacity-10 dark:opacity-20 rounded-bl-full sm:rounded-bl-[100px] -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform duration-500 ease-out group-hover:scale-125`} />
                        
                        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center mb-3 sm:mb-6 shadow-md sm:shadow-lg ${card.shadow} transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300`}>
                            <card.icon className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2} />
                        </div>
                        
                        <h2 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                            {card.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 sm:line-clamp-none">
                            {card.description}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
