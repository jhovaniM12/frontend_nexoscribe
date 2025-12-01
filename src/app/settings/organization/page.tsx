'use client'

import { Layout } from "@/components/Layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Mail, UserPlus, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { organizationApi } from "@/lib/api"
import { useOrganization } from "@/context/organization-context"
import { toast } from "sonner"
import { AuthGuard } from "@/components/AuthGuard"

interface Member {
  userId: {
    _id: string
    name: string
    email: string
    avatar?: string
  } | string
  role: string
  joinedAt?: string
}

interface PendingInvitation {
  _id: string
  email: string
  role: string
  invitedBy: {
    _id: string
    name: string
  }
  expiresAt?: string
}

export default function OrganizationSettingsPage() {
  const { currentOrganization } = useOrganization()
  const [members, setMembers] = useState<Member[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estado para invitación
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<'editor' | 'admin' | 'viewer'>('editor')
  const [isInviting, setIsInviting] = useState(false)

  const isOwnerOrAdmin = currentOrganization?.role === 'owner' || currentOrganization?.role === 'admin'

  const loadMembers = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)
      const response = await organizationApi.getMembers(currentOrganization._id)
      setMembers(response.members)
      setPendingInvitations(response.pendingInvitations || [])
    } catch {
      toast.error("Error al cargar miembros")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
    // loadMembers depende de currentOrganization que ya está en las dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization])

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !currentOrganization) return

    setIsInviting(true)
    try {
      await organizationApi.inviteMember(currentOrganization._id, {
        email: inviteEmail,
        role: inviteRole
      })
      toast.success("Invitación enviada")
      setInviteEmail("")
      loadMembers() // Recargar para ver la invitación pendiente
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al enviar invitación"
      toast.error(errorMessage)
    } finally {
      setIsInviting(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      owner: 'Dueño',
      admin: 'Administrador',
      editor: 'Editor',
      viewer: 'Visualizador'
    }
    return labels[role] || role
  }

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'owner') return 'destructive'
    if (role === 'admin') return 'default'
    return 'secondary'
  }

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

  if (!isOwnerOrAdmin) {
    return (
      <AuthGuard>
        <Layout>
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No tienes permisos para gestionar esta organización
              </p>
            </CardContent>
          </Card>
        </Layout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <Layout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold">Configuración de Organización</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los miembros y permisos de {currentOrganization?.name}
            </p>
          </div>

          {/* Invitar Miembro */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invitar Miembro
              </CardTitle>
              <CardDescription>
                Envía una invitación por correo electrónico para que se una a tu organización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Label htmlFor="inviteEmail">Correo Electrónico</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="colega@empresa.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  />
                </div>
                <div>
                  <Label htmlFor="inviteRole">Rol</Label>
                  <Select value={inviteRole} onValueChange={(value: 'admin' | 'editor' | 'viewer') => setInviteRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar Invitación
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Miembros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Miembros ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Fecha de Ingreso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const user = typeof member.userId === 'object' ? member.userId : null
                      const userIdString = typeof member.userId === 'string' ? member.userId : member.userId?._id
                      const isCurrentUser = user?._id === user?._id
                      
                      return (
                        <TableRow key={userIdString || 'unknown'}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback>
                                  {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {user?.name || 'Usuario'}
                                {isCurrentUser && ' (Tú)'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{user?.email || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(member.role)}>
                              {getRoleLabel(member.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Invitaciones Pendientes */}
          {pendingInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Invitaciones Pendientes ({pendingInvitations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Invitado por</TableHead>
                        <TableHead>Expira</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingInvitations.map((inv) => (
                        <TableRow key={inv._id}>
                          <TableCell>{inv.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getRoleLabel(inv.role)}</Badge>
                          </TableCell>
                          <TableCell>{inv.invitedBy?.name || '-'}</TableCell>
                          <TableCell>
                            {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </AuthGuard>
  )
}

