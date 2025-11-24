'use client'

import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { cn } from "@/lib/utils"
import { AuthGuard } from "./AuthGuard"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  // Sidebar colapsado por defecto
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  return (
    <AuthGuard>
      <div className="min-h-screen w-full bg-background">
        {/* Overlay para móvil */}
        {sidebarMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}

        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={sidebarMobileOpen}
          onMobileClose={() => setSidebarMobileOpen(false)}
        />
        
        <div
          className={cn(
            "transition-all duration-300 min-h-screen",
            // Desktop: siempre tiene margen según el estado del sidebar
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64",
            // Mobile: sin margen porque el sidebar es overlay
            "ml-0"
          )}
        >
          <Header onMenuClick={() => setSidebarMobileOpen(true)} />
          
          <main className="p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}

