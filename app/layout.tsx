import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font",
    display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["500", "600"],
    variable: "--mono",
    display: "swap",
});

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
    themeColor: "#1F7A52",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
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
            <body className={`${hankenGrotesk.variable} ${jetBrainsMono.variable}`}>
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
