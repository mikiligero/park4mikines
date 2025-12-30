import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Park4Mikines",
    description: "Private camper spots manager",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Park4Mikines",
    },
};

export const viewport: Viewport = {
    themeColor: "#4f46e5",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Typical for map apps
};

import LayoutWrapper from "@/components/LayoutWrapper";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <LayoutWrapper>{children}</LayoutWrapper>
                </ThemeProvider>
            </body>
        </html>
    );
}
