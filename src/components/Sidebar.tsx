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
  Sparkles,
  Search,
  Bell
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
import { organizationApi, projectsApi, Project } from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navItems = [
  { href: "/dashboard", icon: Home, label: "Inicio" },
  { href: "/tasks", icon: CheckSquare, label: "Mis Tareas" },
  { href: "/projects", icon: FolderKanban, label: "Proyectos" },
  { href: "/notes", icon: FileText, label: "Notas" },
  { href: "/board", icon: PenTool, label: "Pizarra" },
]

const settingsItems = [
  { href: "/settings", icon: Settings, label: "Ajustes" },
]

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const { organizations, currentOrganization, isLoading, setOrganization } = useOrganization()

  const isSuperAdmin = user?.systemRole === 'superadmin'

  // Definir items según rol
  const items = isSuperAdmin ? [
    { href: "/admin", icon: ShieldAlert, label: "Panel Admin" },
  ] : navItems

  // Estado para diálogo de nueva organización
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (currentOrganization) {
      projectsApi.getAll()
        .then(res => setProjects(res.projects || []))
        .catch(console.error)
    }
  }, [currentOrganization])

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
          "flex items-center gap-2.5 px-2 py-2 rounded-md transition-all duration-200 group relative",
          "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
          "active:bg-sidebar-accent active:text-sidebar-accent-foreground",
          isCollapsed && !isMobile ? "justify-center px-2" : ""
        )}
        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-none"
        onClick={handleNavClick}
      >
        <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors",
          // Active state handled by activeClassName
        )} />
        <span className={cn(
          "text-sm truncate transition-opacity duration-200",
          isCollapsed && !isMobile ? "hidden" : "block"
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
          <TooltipContent side="right" className="font-medium bg-sidebar-foreground text-sidebar-background border-none">
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
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out z-50 flex flex-col shadow-subtle",
          collapsed ? "lg:w-[60px]" : "lg:w-64",
          mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header: Org Switcher */}
        <div className={cn(
          "h-12 flex items-center border-b border-sidebar-border/40 mb-1",
          collapsed && !isMobile ? "justify-center px-1" : "justify-between px-3"
        )}>
          {(!collapsed || isMobile) ? (
            isLoading ? (
              <Skeleton className="h-8 w-full rounded bg-sidebar-accent/20" />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 flex-1 min-w-0 px-2 h-9 hover:bg-sidebar-accent/50 text-left justify-start rounded-md transition-colors"
                  >
                    <div className="relative h-7 w-7 flex-shrink-0 flex items-center justify-center rounded bg-white/20 border border-white/30">
                      {currentOrganization?.logo ? (
                        <Image src={currentOrganization.logo} alt="Logo" fill className="object-cover rounded-sm" />
                      ) : (
                        <span className="text-[10px] font-bold text-white">
                          {currentOrganization?.name?.charAt(0).toUpperCase() || 'N'}
                        </span>
                      )}
                    </div>
                    <span className="truncate text-sm font-medium text-sidebar-foreground/90 flex-1">
                      {currentOrganization?.name || 'Seleccionar...'}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/40" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-56 p-1 bg-popover/95 backdrop-blur-sm border-border/40 shadow-xl rounded-lg">
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1.5">
                    Espacios de Trabajo
                  </DropdownMenuLabel>
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org._id}
                      onClick={() => setOrganization(org._id)}
                      className="gap-2 focus:bg-accent/50 rounded-md px-2 py-1.5 cursor-pointer"
                    >
                      <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-primary">{org.name.charAt(0)}</span>
                      </div>
                      <span className="flex-1 truncate text-sm">{org.name}</span>
                      {currentOrganization?._id === org._id && <CheckSquare className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <div className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-sidebar-accent/50 cursor-pointer transition-colors" onClick={onToggle}>
              <div className="h-7 w-7 rounded bg-white/20 border border-white/30 flex items-center justify-center">
                <span className="text-xs font-bold text-white">N</span>
              </div>
            </div>
          )}
        </div>

        {/* Global Action / Search Stub */}
        {!collapsed && !isMobile && (
          <div className="px-3 mb-2">
            <Button variant="outline" className="w-full justify-start h-8 px-2 text-xs text-muted-foreground border-sidebar-border/60 bg-sidebar-accent/20 hover:bg-sidebar-accent/40 shadow-none">
              <Search className="mr-2 h-4 w-4" />
              <span className="flex-1 text-left">Buscar (Ctrl+K)</span>
            </Button>
          </div>
        )}

        {/* Scrollable Nav Area */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-4 py-2">
            {/* Main Links */}
            <div className="space-y-0.5">
              {items.map((item) => (
                <NavItem key={item.href} item={item} isCollapsed={collapsed} />
              ))}
            </div>

            {/* Projects Section */}
            {!collapsed && !isMobile && (
              <div className="pt-2">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] uppercase font-bold text-sidebar-foreground/40 tracking-wider mb-1 group">
                  <span>Proyectos</span>
                  <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 cursor-pointer hover:text-sidebar-foreground transition-all" />
                </div>
                <div className="space-y-0.5">
                  {projects.slice(0, 8).map(project => (
                    <NavLink
                      key={project._id}
                      href={`/projects?id=${project._id}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-colors text-xs group"
                      activeClassName="text-sidebar-foreground bg-sidebar-accent/50"
                    >
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full ring-1 ring-white/10",
                        project.color ? `bg-[${project.color}]` : "bg-zinc-500"
                      )} style={{ backgroundColor: project.color }} />
                      <span className="truncate flex-1">{project.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer: User Profile / Settings */}
        <div className="p-2 border-t border-sidebar-border/40 bg-sidebar-accent/5">
          <div className="space-y-0.5">
            {settingsItems.map(item => <NavItem key={item.href} item={item} isCollapsed={collapsed} />)}
          </div>

          {!collapsed && !isMobile && (
            <div className="mt-2 pt-2 border-t border-sidebar-border/30 flex items-center gap-2 px-2 py-1.5">
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white shadow-inner border border-white/10">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-sidebar-foreground truncate">{user?.name}</div>
                <div className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</div>
              </div>
            </div>
          )}
        </div>

        {/* Dialogs */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Espacio de Trabajo</DialogTitle>
              <DialogDescription>
                Define un nuevo entorno para tu equipo.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Nombre del Espacio</Label>
                <Input
                  id="orgName"
                  placeholder="Ej. Diseño de Producto"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="bg-muted/50 border-input/50"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateOrg} disabled={isCreating || !newOrgName.trim()} className="bg-primary text-primary-foreground">
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Espacio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </TooltipProvider>
  )
}
