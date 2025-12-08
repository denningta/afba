import type { Metadata } from "next";
import { Roboto } from "next/font/google"
import "./globals.css";
import Sidebar from "./components/Sidebar";
import DialogProvider from "./components/common/DialogProvider";
import { CategoryProvider } from "./context/CategoryProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";

const roboto = Roboto({
  weight: '300',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto'
})

export const metadata: Metadata = {
  title: "Budget",
  description: "Another Funky Budgeting App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body className={cn(roboto.className, `bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle text-tremor-default text-tremor-content dark:text-dark-tremor-content mb-10`)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DialogProvider>
            <CategoryProvider>
              <Sidebar />
              <div className="md:ml-20 pt-4 md:p-5 space-x-3 space-y-3 max-w-7xl mx-auto">
                {children}
              </div>
              <Toaster />
            </CategoryProvider>
          </DialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
