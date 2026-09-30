import { cookies } from "next/headers"
import AppSidebar from "../components/AppSidebar"
import AppHeader from "../components/AppHeader"
import { CategoryProvider } from "../context/CategoryProvider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// The signed-in shell. proxy.ts has already sent signed-out visitors to /login.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // The sidebar writes its expanded/collapsed state to this cookie; reading it
  // here keeps the server render matching what the user last chose.
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false"

  return (
    <CategoryProvider>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </CategoryProvider>
  )
}
