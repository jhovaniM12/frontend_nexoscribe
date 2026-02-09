'use client'

import { NavLink } from "@/components/NavLink"
import { useAuth } from "@/context/auth-context"
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
  ShieldAlert,
  Loader2,
  Sparkles
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { organizationApi } from "@/lib/api"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard", description: "Vista general" },
  { href: "/projects", icon: FolderKanban, label: "Proyectos", description: "Gestionar proyectos" },
  { href: "/tasks", icon: CheckSquare, label: "Mis Tareas", description: "Tablero Kanban" },
  { href: "/notes", icon: FileText, label: "Notas", description: "Documentos y notas" },
  { href: "/board", icon: PenTool, label: "Tablero", description: "Pizarra colaborativa" },
]

const settingsItems = [
  { href: "/settings", icon: Settings, label: "Ajustes", description: "Configuración" },
]

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const { organizations, currentOrganization, isLoading, setOrganization } = useOrganization()

  const isSuperAdmin = user?.systemRole === 'superadmin'

  // Definir items según rol
  const items = isSuperAdmin ? [
    { href: "/admin", icon: ShieldAlert, label: "Panel Admin", description: "Administración" },
  ] : navItems

  // Estado para diálogo de nueva organización
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateOrg = async () => {
    if (user?.accountType !== 'business') {
      toast.error("Solo los usuarios empresariales pueden crear organizaciones")
      return
    }

    if (!newOrgName.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    setIsCreating(true)
    try {
      const response = await organizationApi.create({ name: newOrgName })
      const newOrgId = response.organization?._id

      if (!newOrgId) {
        throw new Error('La organización no fue creada correctamente')
      }

      toast.success("Organización creada")
      setIsCreateOpen(false)
      setNewOrgName("")

      localStorage.setItem('currentOrgId', newOrgId)

      await new Promise(resolve => setTimeout(resolve, 300))
      window.location.reload()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al crear la organización"
      console.error('Error creating organization:', error)
      toast.error(errorMessage)
      setIsCreating(false)
    }
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNavClick = () => {
    if (isMobile && onMobileClose) {
      onMobileClose()
    }
  }

  const NavItem = ({ item, isCollapsed }: { item: typeof navItems[0], isCollapsed: boolean }) => {
    const content = (
      <NavLink
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
          "text-muted-foreground hover:text-foreground hover:bg-accent",
          "active:scale-[0.98]",
          isCollapsed && !isMobile && "lg:justify-center lg:px-2"
        )}
        activeClassName="bg-accent text-foreground font-medium"
        onClick={handleNavClick}
      >
        <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
        <span className={cn(
          "text-sm whitespace-nowrap",
          isCollapsed && !isMobile && "lg:hidden"
        )}>
          {item.label}
        </span>
      </NavLink>
    )

    if (isCollapsed && !isMobile) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r border-border/60 transition-all duration-200 ease-out z-50",
          collapsed ? "lg:w-[60px]" : "lg:w-64",
          mobileOpen ? "w-64" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header con Selector de Organización */}
          <div className={cn(
            "h-14 flex items-center border-b border-border/60",
            collapsed && !isMobile ? "justify-center px-2" : "justify-between px-3"
          )}>
            {(!collapsed || isMobile) ? (
              isLoading ? (
                <Skeleton className="h-9 w-full rounded-lg" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2.5 flex-1 min-w-0 px-2 -ml-1 h-10 hover:bg-accent text-left justify-start rounded-lg"
                    >
                      <div className="relative h-7 w-7 flex-shrink-0">
                        {currentOrganization?.logo ? (
                          <Image
                            src={currentOrganization.logo}
                            alt="Org Logo"
                            fill
                            className="object-contain rounded-md"
                          />
                        ) : (
                          <div className="h-full w-full bg-primary/10 rounded-md flex items-center justify-center">
                            {currentOrganization?.type === 'personal' ? (
                              <Sparkles className="h-4 w-4 text-primary" />
                            ) : (
                              <Building className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold truncate">
                          {currentOrganization?.name || 'Seleccionar...'}
                        </span>
                        <span className="block text-[11px] text-muted-foreground truncate capitalize">
                          {currentOrganization?.type === 'personal' ? 'Espacio personal' : currentOrganization?.role}
                        </span>
                      </div>
                      <ChevronsUpDown className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                      Mis espacios de trabajo
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {organizations.map((org) => (
                      <DropdownMenuItem
                        key={org._id}
                        onClick={() => setOrganization(org._id)}
                        className="gap-2.5 cursor-pointer"
                      >
                        <div className="h-5 w-5 flex items-center justify-center rounded border border-border/60 bg-muted/50">
                          {org.type === 'personal' ? (
                            <Sparkles className="h-3 w-3 text-primary" />
                          ) : (
                            <Building className="h-3 w-3" />
                          )}
                        </div>
                        <span className="flex-1 truncate text-sm">{org.name}</span>
                        {currentOrganization?._id === org._id && (
                          <div className="h-2 w-2 bg-primary rounded-full" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    {user?.accountType === 'business' && !organizations.some(org => org.isOwner) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-muted-foreground cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault()
                            setIsCreateOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Nueva organización
                        </DropdownMenuItem>
                      </>
                    )}
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
                "h-8 w-8 transition-colors hover:bg-accent flex-shrink-0 hidden lg:flex",
                collapsed && !isMobile ? "" : "ml-1"
              )}
            >
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform duration-200",
                collapsed && "rotate-180"
              )} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
            {items.map((item) => (
              <NavItem key={item.href} item={item} isCollapsed={collapsed} />
            ))}
          </nav>

          {/* Footer Navigation */}
          <div className="p-2 border-t border-border/60 space-y-1">
            {!isSuperAdmin && settingsItems.map((item) => (
              <NavItem key={item.href} item={item} isCollapsed={collapsed} />
            ))}
          </div>
        </div>

        {/* Diálogo para crear organización */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Organización</DialogTitle>
              <DialogDescription>
                Crea un espacio de trabajo para tu equipo.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Nombre</Label>
                <Input
                  id="orgName"
                  placeholder="Ej: Acme Corp"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateOrg()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateOrg} disabled={isCreating || !newOrgName.trim()}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </TooltipProvider>
  )
}
