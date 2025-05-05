import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Header from "@/components/layout/Header";
import { Providers } from "./provider";
import '@rainbow-me/rainbowkit/styles.css';
import { Toaster } from "@/components/ui/toaster";
import FloatingChat from "@/components/hedgy/FloatingChat";



export const metadata: Metadata = {
  title: "Hedgehog Lending Protocol",
  description: "A lending protocol that uses real-world assets (RWAs) as collateral",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased min-h-screen`}
      >
        <Providers>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 py-6">
              {children}
            </main>
            <footer className="border-t border-[var(--border-color)] py-4">
              <div className="max-w-[1280px] w-full mx-auto px-4 text-xs text-[var(--secondary)]">
                <p>© {new Date().getFullYear()} Hedgehog Lending Protocol. All rights reserved.</p>
              </div>
            </footer>
          </div>
          <Toaster />
          <FloatingChat />
        </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
