import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { IntlProvider } from "@/components/intl-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenlist - Gestion de tâches moderne",
  description: "Application de gestion de tâches intuitive et collaborative pour améliorer votre productivité",
  keywords: ["Zenlist", "tâches", "productivité", "gestion", "collaboration"],
  authors: [{ name: "Zenlist Team" }],
  openGraph: {
    title: "Zenlist - Gestion de tâches moderne",
    description: "Application de gestion de tâches intuitive et collaborative",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zenlist - Gestion de tâches moderne",
    description: "Application de gestion de tâches intuitive et collaborative",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <IntlProvider>
            <SidebarProvider>
              <AuthProvider>
                <div className="flex h-screen w-full">
                  <AppSidebar />
                  <SidebarInset className="flex-1">
                    {/* Barre d'accès mobile pour ouvrir la sidebar */}
                    <div className="flex items-center gap-2 p-2 border-b md:hidden">
                      <SidebarTrigger aria-label="Ouvrir la barre latérale" />
                      <span className="text-sm font-medium">Menu</span>
                    </div>
                    <main className="flex-1 overflow-auto">
                      {children}
                    </main>
                  </SidebarInset>
                </div>
              </AuthProvider>
            </SidebarProvider>
          </IntlProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
