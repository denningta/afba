import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import DialogProvider from "./components/common/DialogProvider";
import { CategoryProvider } from "./context/CategoryProvider";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en">
      <body className={`${inter.className} bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle text-tremor-default text-tremor-content dark:text-dark-tremor-content`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DialogProvider>
            <CategoryProvider>
              <aside className="fixed top-0 left-0 h-screen w-20 z-40 flex flex-col space-y-4 bg-tremor-brand dark:bg-dark-tremor-brand">
                <Sidebar />
              </aside>
              <div className="ml-20 p-5 space-x-3 space-y-3">
                {children}
              </div>
            </CategoryProvider>
          </DialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
