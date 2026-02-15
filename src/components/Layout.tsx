'use client'

import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  // Sidebar colapsado por defecto
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
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
          "transition-all duration-300 ease-in-out min-h-screen bg-background",
          // Desktop: siempre tiene margen según el estado del sidebar
          sidebarCollapsed ? "lg:ml-[60px]" : "lg:ml-64",
          // Mobile: sin margen porque el sidebar es overlay
          "ml-0"
        )}
      >
        <Header onMenuClick={() => setSidebarMobileOpen(true)} />

        <main className="p-3 sm:p-4 lg:p-6 h-[calc(100vh-3.5rem)] min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}

