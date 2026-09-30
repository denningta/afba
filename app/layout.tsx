import type { Metadata } from "next";
import { Geist } from "next/font/google"
import "./globals.css";
import SWRProvider from "./components/SWRProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  // Pages set their own title; the tab reads e.g. "Transactions · afba".
  title: {
    template: "%s · afba",
    default: "afba",
  },
  description: "Another Funky Budgeting App",
};

// Providers only; the signed-in shell (sidebar, header) is in (app)/layout.tsx
// and the sign-in pages in (auth)/layout.tsx.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans antialiased", geist.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SWRProvider>
            <TooltipProvider delayDuration={0}>
              {children}
            </TooltipProvider>
            <Toaster />
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
