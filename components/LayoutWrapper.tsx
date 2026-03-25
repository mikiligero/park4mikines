"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/login";

    return (
        <div className="flex min-h-screen">
            {!isLoginPage && <Sidebar />}
            <main className={`w-full h-screen focus:outline-none ${!isLoginPage ? "lg:pl-72" : ""}`}>
                {children}
            </main>
        </div>
    );
}
