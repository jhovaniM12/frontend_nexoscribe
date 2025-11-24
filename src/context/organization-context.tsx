'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { organizationApi, type Organization } from '@/lib/api'
import { useAuth } from './auth-context'
import { toast } from 'sonner'

interface OrganizationContextType {
  organizations: Organization[]
  currentOrganization: Organization | null
  isLoading: boolean
  setOrganization: (orgId: string) => void
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([])
      setCurrentOrganization(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await organizationApi.getUserOrganizations()
      const orgs = response.organizations
      setOrganizations(orgs)

      // Lógica de selección automática
      const storedOrgId = localStorage.getItem('currentOrgId')
      let selectedOrg = null

      if (storedOrgId) {
        selectedOrg = orgs.find(o => o._id === storedOrgId)
      }

      // Si no hay guardada o la guardada ya no existe, usar la primera (usualmente la personal)
      if (!selectedOrg && orgs.length > 0) {
        selectedOrg = orgs[0]
      }

      if (selectedOrg) {
        setCurrentOrganization(selectedOrg)
        localStorage.setItem('currentOrgId', selectedOrg._id)
      } else {
        // Caso extremo: usuario sin organizaciones (no debería pasar si el registro funciona)
        setCurrentOrganization(null)
        localStorage.removeItem('currentOrgId')
      }

    } catch (error) {
      console.error('Error loading organizations:', error)
      toast.error('Error al cargar tus espacios de trabajo')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadOrganizations()
  }, [loadOrganizations])

  const setOrganization = (orgId: string) => {
    const org = organizations.find(o => o._id === orgId)
    if (org) {
      setCurrentOrganization(org)
      localStorage.setItem('currentOrgId', org._id)
      toast.success(`Cambiado a ${org.name}`)
      // Recargar la página para asegurar que todos los componentes (como Notas) refresquen sus datos con el nuevo header
      // Una alternativa más suave sería usar un evento o contexto para invalidar queries, pero esto es robusto por ahora.
      window.location.reload() 
    }
  }

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        isLoading,
        setOrganization,
        refreshOrganizations: loadOrganizations
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

