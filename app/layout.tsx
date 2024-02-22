import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-tremor-background-subtle dark:bg-dark-tremor-background-subtle text-tremor-default text-tremor-content dark:text-dark-tremor-content`}>
        <aside className="fixed top-0 left-0 h-screen w-20 z-40 flex flex-col space-y-4 bg-tremor-brand dark:bg-dark-tremor-brand">
          <Sidebar />
        </aside>
        <div className="ml-20 p-6">
          {children}
        </div>
      </body>
    </html>
  );
}
