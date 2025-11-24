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
import { Users, Building2, FileText, TrendingUp, ShieldAlert, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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

interface AdminOrganization {
  _id: string
  name: string
  type: string
  members: Array<{ userId: string; role: string }>
  createdBy: {
    _id: string
    name: string
    email: string
  }
  createdAt: string
}

interface AdminUser {
  _id: string
  name: string
  email: string
  systemRole: string
  isActive: boolean
  createdAt: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])

  useEffect(() => {
    // Verificar rol antes de cargar
    if (user && user.role !== 'admin' && user.systemRole !== 'superadmin') {
      toast.error("Acceso denegado")
      router.push('/dashboard')
      return
    }

    const loadData = async () => {
      try {
        const [statsRes, orgsRes, usersRes] = await Promise.all([
          api.get<{ stats: GlobalStats }>('/api/admin/stats'),
          api.get<{ organizations: AdminOrganization[] }>('/api/admin/organizations'),
          api.get<{ users: AdminUser[] }>('/api/admin/users')
        ])

        setStats(statsRes.stats)
        setOrganizations(orgsRes.organizations)
        setUsers(usersRes.users)
      } catch (error) {
        console.error("Error loading admin data:", error)
        toast.error("Error al cargar datos de administración")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, router])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
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
        <Tabs defaultValue="orgs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orgs">Organizaciones</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orgs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todas las Organizaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Miembros</TableHead>
                      <TableHead>Creado por</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Todos los Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol Sistema</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registrado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

