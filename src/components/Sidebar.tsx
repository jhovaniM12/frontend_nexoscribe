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
  Loader2
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
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Proyectos" },
  { href: "/tasks", icon: CheckSquare, label: "Mis Tareas" },
  { href: "/notes", icon: FileText, label: "Notas" },
  { href: "/board", icon: PenTool, label: "Tablero" },
  { href: "/settings", icon: Settings, label: "Ajustes" },
]

export function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const { organizations, currentOrganization, isLoading, setOrganization, setOrganizationWithoutReload, refreshOrganizations } = useOrganization()

  const isSuperAdmin = user?.systemRole === 'superadmin';

  // Definir items según rol
  const items = isSuperAdmin ? [
    { href: "/admin", icon: ShieldAlert, label: "Panel Admin" },
  ] : navItems;

  // Estado para diálogo de nueva organización
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateOrg = async () => {
    // Validar que el usuario puede crear organizaciones
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
      
      // Guardar el ID de la nueva organización en localStorage
      localStorage.setItem('currentOrgId', newOrgId)
      
      // Cerrar el diálogo antes de recargar
      setIsCreateOpen(false)
      setNewOrgName("")
      
      // Esperar un momento para asegurar que el backend haya procesado la creación
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Recargar la página para que el contexto cargue la nueva organización
      window.location.reload()
    } catch (error: any) {
      console.error('Error creating organization:', error)
      toast.error(error?.message || "Error al crear la organización")
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
    // En móvil, cerrar el sidebar al hacer click en un enlace
    if (isMobile && onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border/50 transition-all duration-300 ease-in-out z-50 shadow-lg",
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
                        Crear nueva organización
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
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "hover:shadow-sm active:scale-[0.98]",
                collapsed && !isMobile && "lg:justify-center"
              )}
              activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
              onClick={handleNavClick}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn("text-sm whitespace-nowrap font-medium", collapsed && !isMobile && "lg:hidden")}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Diálogo para crear organización */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Organización</DialogTitle>
            <DialogDescription>
              Crea un espacio de trabajo para tu equipo o empresa.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Nombre de la Organización</Label>
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
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateOrg} disabled={isCreating || !newOrgName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Organización"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}

