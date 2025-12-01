'use client'

import { Layout } from "@/components/Layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Users, Building2, FileText, TrendingUp, ShieldAlert, Loader2, MoreHorizontal, Ban, CheckCircle, Trash2, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { adminApi, type AdminUser, type AdminOrganization } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthGuard } from "@/components/AuthGuard"
import { Input } from "@/components/ui/input"

interface GlobalStats {
  totalUsers: number
  totalOrgs: number
  totalNotes: number
  totalProjects: number
  growth: {
    newUsersLast30Days: number
    newOrgsLast30Days: number
  }
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  
  // Search States
  const [userSearch, setUserSearch] = useState("")
  const [orgSearch, setOrgSearch] = useState("")

  const loadData = async () => {
    try {
      const [statsRes, orgsRes, usersRes] = await Promise.all([
        adminApi.getGlobalStats(),
        adminApi.getAllOrganizations(1, 50), // Traer más para filtrar en cliente por ahora
        adminApi.getAllUsers(1, 50)
      ])

      // Mapear los datos de la API al formato esperado por GlobalStats
      setStats({
        totalUsers: statsRes.stats.totalUsers,
        totalOrgs: statsRes.stats.totalOrganizations,
        totalNotes: statsRes.stats.totalNotes,
        totalProjects: statsRes.stats.totalProjects,
        growth: {
          newUsersLast30Days: statsRes.stats.userGrowth,
          newOrgsLast30Days: statsRes.stats.orgGrowth
        }
      })
      setOrganizations(orgsRes.organizations)
      setUsers(usersRes.users)
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast.error("Error al cargar datos de administración")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && user.role !== 'admin' && user.systemRole !== 'superadmin') {
      toast.error("Acceso denegado")
      router.push('/dashboard')
      return
    }

    if (user) {
      loadData()
    }
  }, [user, router])

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await adminApi.updateUserStatus(userId, !currentStatus)
      toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`)
      // Optimistic update
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u))
    } catch {
      toast.error("Error al actualizar estado")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario permanentemente? Esta acción no se puede deshacer.")) return

    try {
      await adminApi.deleteUser(userId)
      toast.success("Usuario eliminado")
      setUsers(prev => prev.filter(u => u._id !== userId))
    } catch {
      toast.error("Error al eliminar usuario")
    }
  }

  // Filtered Data
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredOrgs = organizations.filter(o => 
    o.name.toLowerCase().includes(orgSearch.toLowerCase()) || 
    o.createdBy.email.toLowerCase().includes(orgSearch.toLowerCase())
  )

  if (loading) {
    return (
      <AuthGuard>
        <Layout>
          <div className="flex items-center justify-center h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Layout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6 max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-destructive" />
              Panel de Super Administrador
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión global de la plataforma NexoScribe
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.growth.newUsersLast30Days} en el último mes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organizaciones</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrgs}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.growth.newOrgsLast30Days} en el último mes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notas Totales</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalNotes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProjects}</div>
              </CardContent>
            </Card>
          </div>

          {/* Data Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Usuarios ({users.length})</TabsTrigger>
              <TabsTrigger value="orgs">Organizaciones ({organizations.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por nombre o email..." 
                      className="pl-8"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rol Sistema</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Registrado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((u) => (
                          <TableRow key={u._id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <Badge variant={u.systemRole === 'superadmin' ? 'destructive' : 'outline'}>
                                {u.systemRole || 'user'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.isActive ? 'default' : 'secondary'}>
                                {u.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleToggleUserStatus(u._id, u.isActive)}>
                                    {u.isActive ? (
                                      <>
                                        <Ban className="mr-2 h-4 w-4 text-orange-500" /> 
                                        Desactivar cuenta
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> 
                                        Activar cuenta
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteUser(u._id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> 
                                    Eliminar permanentemente
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="orgs" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Organizaciones</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar por nombre o dueño..." 
                      className="pl-8"
                      value={orgSearch}
                      onChange={(e) => setOrgSearch(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Miembros</TableHead>
                          <TableHead>Creado por</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrgs.map((org) => (
                          <TableRow key={org._id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>
                              <Badge variant={org.type === 'business' ? 'default' : 'secondary'}>
                                {org.type === 'business' ? 'Empresa' : 'Personal'}
                              </Badge>
                            </TableCell>
                            <TableCell>{org.members.length}</TableCell>
                            <TableCell>
                              <div className="text-sm">{org.createdBy?.name}</div>
                              <div className="text-xs text-muted-foreground">{org.createdBy?.email}</div>
                            </TableCell>
                            <TableCell>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" disabled>Ver detalles</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </AuthGuard>
  )
}
