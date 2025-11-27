'use client'

import { NavLink } from "@/components/NavLink"
import { 
  Home,
  FileText, 
  CheckSquare, 
  Settings, 
  ChevronLeft,
  PenTool,
  FolderKanban,
  ChevronsUpDown,
  Building,
  Plus,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import Image from "next/image"
import { useOrganization } from "@/context/organization-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Proyectos" },
  { href: "/tasks", icon: CheckSquare, label: "Mis Tareas" },
  { href: "/notes", icon: FileText, label: "Notas" },
  { href: "/board", icon: PenTool, label: "Tablero" },
  { href: "/settings", icon: Settings, label: "Ajustes" },
]

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const { organizations, currentOrganization, isLoading, setOrganization } = useOrganization()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNavClick = () => {
    // En móvil, cerrar el sidebar al hacer click en un enlace
    if (isMobile && onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-50",
        // Desktop: tamaño según collapsed
        collapsed ? "lg:w-16" : "lg:w-64",
        // Mobile: siempre ancho completo cuando está abierto, oculto cuando está cerrado
        mobileOpen ? "w-64" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Header con Selector de Organización */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border",
          collapsed && !isMobile ? "justify-center px-2" : "justify-between px-4"
        )}>
          {(!collapsed || isMobile) ? (
            isLoading ? (
              <Skeleton className="h-8 w-full rounded" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 flex-1 min-w-0 px-2 -ml-2 h-12 hover:bg-sidebar-accent text-left justify-start"
                  >
                    <div className="relative h-6 w-6 flex-shrink-0">
                      {currentOrganization?.logo ? (
                        <Image
                          src={currentOrganization.logo}
                          alt="Org Logo"
                          fill
                          className="object-contain rounded"
                        />
                      ) : (
                        <div className="h-full w-full bg-primary/10 rounded flex items-center justify-center text-primary">
                          {currentOrganization?.type === 'personal' ? (
                            <Image
                              src="/Icon_Shared.svg"
                              alt="Personal"
                              fill
                              className="object-contain p-0.5 dark:brightness-0 dark:invert"
                            />
                          ) : (
                            <Building className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 truncate">
                      <span className="block text-sm font-semibold truncate">
                        {currentOrganization?.name || 'Seleccionar...'}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate capitalize">
                        {currentOrganization?.type === 'personal' ? 'Personal' : currentOrganization?.role}
                      </span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Mis espacios</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {organizations.map((org) => (
                    <DropdownMenuItem 
                      key={org._id}
                      onClick={() => setOrganization(org._id)}
                      className="gap-2"
                    >
                      <div className="h-4 w-4 flex items-center justify-center rounded border border-muted">
                        {org.type === 'personal' ? (
                          <div className="h-2 w-2 bg-primary rounded-full" />
                        ) : (
                          <Building className="h-3 w-3" />
                        )}
                      </div>
                      <span className="flex-1 truncate">{org.name}</span>
                      {currentOrganization?._id === org._id && (
                        <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-muted-foreground">
                    <Plus className="h-4 w-4" />
                    Crear nueva organización
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <div className="relative h-8 w-8 flex-shrink-0 flex items-center justify-center">
               <Image
                  src="/Icon_Shared.svg"
                  alt="NexoScribe Logo"
                  fill
                  className="object-contain dark:brightness-0 dark:invert"
                  priority
                />
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onToggle}
            className={cn(
              "h-8 w-8 transition-smooth hover:bg-sidebar-accent flex-shrink-0",
              collapsed && !isMobile ? "" : "ml-1"
            )}
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && !isMobile && "lg:justify-center"
              )}
              activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              onClick={handleNavClick}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn("text-sm whitespace-nowrap", collapsed && !isMobile && "lg:hidden")}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

