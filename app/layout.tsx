import type { Metadata } from "next";
import { Geist } from "next/font/google"
import { cookies } from "next/headers";
import "./globals.css";
import AppSidebar from "./components/AppSidebar";
import AppHeader from "./components/AppHeader";
import { CategoryProvider } from "./context/CategoryProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Budget",
  description: "Another Funky Budgeting App",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The sidebar writes its expanded/collapsed state to this cookie; reading it
  // here keeps the server render matching what the user last chose.
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false"

  return (
    <html lang="en" className={cn("font-sans antialiased", geist.variable)} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CategoryProvider>
            <TooltipProvider delayDuration={0}>
              <SidebarProvider defaultOpen={sidebarOpen}>
                <AppSidebar />
                <SidebarInset>
                  <AppHeader />
                  <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
                    {children}
                  </div>
                </SidebarInset>
              </SidebarProvider>
            </TooltipProvider>
            <Toaster />
          </CategoryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
